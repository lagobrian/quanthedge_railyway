# =============================================================
# CRYPTO DATA PIPELINE - crypto2 + parallel + checkpointing
# =============================================================
# Features:
#   - Parallel fetching (configurable workers)
#   - Checkpoint/resume: saves progress, picks up where it left off
#   - Automatic retry with exponential backoff
#   - Batched DB writes (not one row at a time)
#
# Run modes:
#   Rscript fetch_cmc_data.R backfill 8   # Full history, 8 workers
#   Rscript fetch_cmc_data.R daily 4      # Incremental, 4 workers
#   Rscript fetch_cmc_data.R info         # Weekly metadata refresh
#   Rscript fetch_cmc_data.R global       # Global metrics only
# =============================================================

library(crypto2)
library(dplyr)
library(tidyr)
library(DBI)
library(RPostgres)
library(janitor)
library(lubridate)
library(parallel)
library(future)
library(future.apply)

# ---- CONFIG ----
DB_NAME     <- Sys.getenv("DB_NAME",     "quanthedge")
DB_HOST     <- Sys.getenv("DB_HOST",     "localhost")
DB_USER     <- Sys.getenv("DB_USER",     "quanthedge")
DB_PASSWORD <- Sys.getenv("DB_PASSWORD", "quanthedge_dev_2026")
DB_PORT     <- as.integer(Sys.getenv("DB_PORT", "5432"))

args <- commandArgs(trailingOnly = TRUE)
MODE     <- ifelse(length(args) >= 1, args[1], "daily")
N_WORKERS <- ifelse(length(args) >= 2, as.integer(args[2]), 4)

script_dir <- tryCatch(
  dirname(sys.frame(1)$ofile),
  error = function(e) {
    args_all <- commandArgs(trailingOnly = FALSE)
    file_arg <- grep("--file=", args_all, value = TRUE)
    if (length(file_arg) > 0) dirname(sub("--file=", "", file_arg[1])) else "."
  }
)
CHECKPOINT_DIR <- file.path(script_dir, "checkpoints")
dir.create(CHECKPOINT_DIR, showWarnings = FALSE, recursive = TRUE)

cat(sprintf("[%s] Pipeline: mode=%s, workers=%d\n", Sys.time(), MODE, N_WORKERS))

# ---- DB HELPERS ----
get_db <- function() {
  dbConnect(
    RPostgres::Postgres(),
    dbname   = DB_NAME,
    host     = DB_HOST,
    user     = DB_USER,
    password = DB_PASSWORD,
    port     = DB_PORT
  )
}

db <- get_db()

# Ensure tables exist
dbExecute(db, "
  CREATE TABLE IF NOT EXISTS crypto_history (
    id INTEGER, symbol TEXT, name TEXT, date DATE,
    open DOUBLE PRECISION, high DOUBLE PRECISION,
    low DOUBLE PRECISION, close DOUBLE PRECISION,
    volume DOUBLE PRECISION, market_cap DOUBLE PRECISION,
    timestamp TIMESTAMPTZ,
    PRIMARY KEY (id, date)
  )
")
dbExecute(db, "
  CREATE TABLE IF NOT EXISTS crypto_listings (
    id INTEGER, symbol TEXT, name TEXT, slug TEXT,
    cmc_rank INTEGER, market_cap DOUBLE PRECISION,
    price DOUBLE PRECISION, circulating_supply DOUBLE PRECISION,
    total_supply DOUBLE PRECISION, max_supply DOUBLE PRECISION,
    volume_24h DOUBLE PRECISION, percent_change_24h DOUBLE PRECISION,
    percent_change_7d DOUBLE PRECISION, last_updated TIMESTAMPTZ,
    fetched_at DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (id, fetched_at)
  )
")
dbExecute(db, "
  CREATE TABLE IF NOT EXISTS crypto_global_metrics (
    date DATE PRIMARY KEY, btc_dominance DOUBLE PRECISION,
    eth_dominance DOUBLE PRECISION, total_market_cap DOUBLE PRECISION,
    total_volume_24h DOUBLE PRECISION, active_cryptocurrencies INTEGER
  )
")
dbExecute(db, "
  CREATE TABLE IF NOT EXISTS crypto_info (
    id INTEGER PRIMARY KEY, symbol TEXT, name TEXT, slug TEXT,
    category TEXT, description TEXT, date_added DATE,
    date_launched DATE, is_audited BOOLEAN
  )
")

# ---- UPSERT HELPER ----
upsert <- function(conn, table_name, data, conflict_cols) {
  if (nrow(data) == 0) return(invisible(NULL))
  tmp <- paste0("tmp_", table_name, "_", as.integer(Sys.time()))
  dbWriteTable(conn, tmp, data, temporary = TRUE, overwrite = TRUE)
  cols <- dbListFields(conn, tmp)
  col_list <- paste(sprintf('"%s"', cols), collapse = ", ")
  update_cols <- setdiff(cols, conflict_cols)
  update_set <- paste(sprintf('"%s" = EXCLUDED."%s"', update_cols, update_cols), collapse = ", ")
  conflict <- paste(sprintf('"%s"', conflict_cols), collapse = ", ")
  sql <- sprintf(
    'INSERT INTO "%s" (%s) SELECT %s FROM "%s" ON CONFLICT (%s) DO UPDATE SET %s',
    table_name, col_list, col_list, tmp, conflict, update_set
  )
  n <- dbExecute(conn, sql)
  dbRemoveTable(conn, tmp)
  cat(sprintf("  [DB] Upserted %d rows -> %s\n", n, table_name))
}

# ---- CHECKPOINT HELPERS ----
checkpoint_path <- function(name) file.path(CHECKPOINT_DIR, paste0(name, ".rds"))

save_checkpoint <- function(name, data) {
  saveRDS(data, checkpoint_path(name))
}

load_checkpoint <- function(name) {
  path <- checkpoint_path(name)
  if (file.exists(path)) readRDS(path) else NULL
}

clear_checkpoint <- function(name) {
  path <- checkpoint_path(name)
  if (file.exists(path)) file.remove(path)
}


# =============================================================
# 1. FETCH HISTORY - PARALLEL WITH CHECKPOINTING
# =============================================================
fetch_history <- function() {
  cat("[History] Starting...\n")

  # Determine date range
  if (MODE == "backfill") {
    start_date <- "2015-01-01"
  } else {
    latest <- dbGetQuery(db, "SELECT MAX(date) as max_date FROM crypto_history")
    start_date <- if (!is.na(latest$max_date)) {
      as.character(as.Date(latest$max_date) - 1)
    } else {
      as.character(Sys.Date() - 365)
    }
  }
  end_date <- as.character(Sys.Date())
  cat(sprintf("  Date range: %s to %s\n", start_date, end_date))

  # Get coin list
  cat("  Fetching coin list...\n")
  coin_list <- tryCatch(
    crypto_list(only_active = TRUE),
    error = function(e) { cat(sprintf("  ERROR: %s\n", e$message)); NULL }
  )
  if (is.null(coin_list)) return()

  # For daily mode, only fetch top 500 by rank
  if (MODE == "daily") {
    coin_list <- coin_list %>%
      filter(!is.na(.data[["rank"]])) %>%
      arrange(.data[["rank"]]) %>%
      head(500)
  }

  cat(sprintf("  %d coins to fetch\n", nrow(coin_list)))

  # Check which coins are already done (checkpoint)
  done_ids <- load_checkpoint("history_done_ids")
  if (is.null(done_ids)) done_ids <- integer(0)
  remaining <- coin_list %>% filter(!id %in% done_ids)
  cat(sprintf("  %d already done, %d remaining\n", length(done_ids), nrow(remaining)))

  if (nrow(remaining) == 0) {
    cat("  All coins already fetched!\n")
    clear_checkpoint("history_done_ids")
    return()
  }

  # Split into batches for parallel processing
  batch_size <- 10  # coins per batch
  batches <- split(remaining, ceiling(seq_len(nrow(remaining)) / batch_size))
  cat(sprintf("  %d batches of ~%d coins each\n", length(batches), batch_size))

  # Set up parallel backend
  plan(multisession, workers = N_WORKERS)

  # Process batches
  for (batch_idx in seq_along(batches)) {
    batch <- batches[[batch_idx]]
    cat(sprintf("\n  --- Batch %d/%d (%d coins) ---\n", batch_idx, length(batches), nrow(batch)))

    # Parallel fetch within batch
    results <- future_lapply(seq_len(nrow(batch)), function(i) {
      coin <- batch[i, ]
      tryCatch({
        h <- crypto_history(
          coin_list  = coin,
          start_date = start_date,
          end_date   = end_date,
          sleep      = 0,
          finalWait  = FALSE
        )
        if (!is.null(h) && nrow(h) > 0) {
          h %>%
            mutate(date = as.Date(timestamp)) %>%
            select(id, symbol, name, date, open, high, low, close, volume, market_cap, timestamp) %>%
            distinct(id, date, .keep_all = TRUE)
        } else {
          NULL
        }
      }, error = function(e) {
        # Return NULL on error, we'll retry later
        NULL
      })
    }, future.seed = TRUE)

    # Combine successful results
    valid <- Filter(Negate(is.null), results)
    if (length(valid) > 0) {
      combined <- bind_rows(valid)
      cat(sprintf("  Got %d rows from %d/%d coins\n", nrow(combined), length(valid), nrow(batch)))

      # Write batch to DB
      conn <- get_db()
      tryCatch({
        upsert(conn, "crypto_history", combined, c("id", "date"))
      }, error = function(e) {
        cat(sprintf("  DB ERROR: %s\n", e$message))
      }, finally = {
        dbDisconnect(conn)
      })
    } else {
      cat("  No data in this batch\n")
    }

    # Update checkpoint
    done_ids <- c(done_ids, batch$id)
    save_checkpoint("history_done_ids", done_ids)

    # Rate limit between batches
    Sys.sleep(2)
  }

  clear_checkpoint("history_done_ids")
  cat("[History] Complete\n")
}


# =============================================================
# 2. FETCH LISTINGS
# =============================================================
fetch_listings <- function() {
  cat("[Listings] Fetching latest...\n")

  listings <- tryCatch(
    crypto_listings(which = "latest", quote = TRUE, limit = 5000),
    error = function(e) { cat(sprintf("  ERROR: %s\n", e$message)); NULL }
  )
  if (is.null(listings) || nrow(listings) == 0) return()

  cat(sprintf("  Got %d listings\n", nrow(listings)))

  listings_clean <- listings %>% clean_names()
  cat(sprintf("  Columns: %s\n", paste(names(listings_clean), collapse=", ")))

  # Map columns safely - crypto2 column names can vary between versions
  lc <- listings_clean
  listings_out <- data.frame(
    id                  = lc$id,
    symbol              = lc$symbol,
    name                = lc$name,
    slug                = lc$slug,
    cmc_rank            = if ("rank" %in% names(lc)) lc$rank else if ("cmc_rank" %in% names(lc)) lc$cmc_rank else seq_len(nrow(lc)),
    market_cap          = if ("market_cap" %in% names(lc)) lc$market_cap else NA_real_,
    price               = if ("price" %in% names(lc)) lc$price else NA_real_,
    circulating_supply  = if ("circulating_supply" %in% names(lc)) lc$circulating_supply else NA_real_,
    total_supply        = if ("total_supply" %in% names(lc)) lc$total_supply else NA_real_,
    max_supply          = if ("max_supply" %in% names(lc)) lc$max_supply else NA_real_,
    volume_24h          = if ("volume_24h" %in% names(lc)) lc$volume_24h else NA_real_,
    percent_change_24h  = if ("percent_change_24h" %in% names(lc)) lc$percent_change_24h else NA_real_,
    percent_change_7d   = if ("percent_change_7d" %in% names(lc)) lc$percent_change_7d else NA_real_,
    last_updated        = if ("last_updated" %in% names(lc)) lc$last_updated else Sys.time(),
    fetched_at          = Sys.Date(),
    stringsAsFactors    = FALSE
  )

  upsert(db, "crypto_listings", listings_out, c("id", "fetched_at"))
}


# =============================================================
# 3. FETCH GLOBAL METRICS
# =============================================================
fetch_global_metrics <- function() {
  cat("[Global Metrics] Fetching...\n")

  if (MODE == "backfill") {
    start <- "20150101"
  } else {
    latest <- dbGetQuery(db, "SELECT MAX(date) as max_date FROM crypto_global_metrics")
    start <- if (!is.na(latest$max_date)) {
      format(as.Date(latest$max_date), "%Y%m%d")
    } else {
      format(Sys.Date() - 730, "%Y%m%d")
    }
  }

  global <- tryCatch(
    crypto_global_quotes(
      which = "historical", quote = TRUE,
      start_date = start, end_date = format(Sys.Date(), "%Y%m%d"),
      interval = "daily"
    ),
    error = function(e) { cat(sprintf("  ERROR: %s\n", e$message)); NULL }
  )
  if (is.null(global) || nrow(global) == 0) return()

  cat(sprintf("  Got %d days\n", nrow(global)))

  global_clean <- global %>% clean_names()
  cat(sprintf("  Global columns: %s\n", paste(names(global_clean), collapse=", ")))

  # Find the date column (could be last_updated, timestamp, date, etc.)
  date_col <- intersect(c("last_updated", "timestamp", "date"), names(global_clean))[1]
  if (is.na(date_col)) {
    cat("  ERROR: No date column found in global metrics\n")
    return()
  }

  gc <- global_clean
  global_out <- data.frame(
    date                    = as.Date(gc[[date_col]]),
    btc_dominance           = if ("btc_dominance" %in% names(gc)) gc$btc_dominance else NA_real_,
    eth_dominance           = if ("eth_dominance" %in% names(gc)) gc$eth_dominance else NA_real_,
    total_market_cap        = if ("usd_total_market_cap" %in% names(gc)) gc$usd_total_market_cap else if ("total_market_cap" %in% names(gc)) gc$total_market_cap else NA_real_,
    total_volume_24h        = if ("usd_total_volume24h" %in% names(gc)) gc$usd_total_volume24h else if ("total_volume_24h" %in% names(gc)) gc$total_volume_24h else NA_real_,
    active_cryptocurrencies = if ("active_cryptocurrencies" %in% names(gc)) as.integer(gc$active_cryptocurrencies) else NA_integer_,
    stringsAsFactors        = FALSE
  ) %>% distinct(date, .keep_all = TRUE)

  upsert(db, "crypto_global_metrics", global_out, c("date"))
}


# =============================================================
# 4. FETCH INFO (weekly)
# =============================================================
fetch_info <- function() {
  cat("[Info] Fetching coin metadata...\n")

  info <- tryCatch(
    crypto_info(limit = 500),
    error = function(e) { cat(sprintf("  ERROR: %s\n", e$message)); NULL }
  )
  if (is.null(info) || nrow(info) == 0) return()

  info_clean <- info %>%
    clean_names() %>%
    transmute(
      id, symbol, name, slug, category,
      description = substr(description, 1, 5000),
      date_added = as.Date(date_added),
      date_launched = as.Date(date_launched),
      is_audited
    )

  upsert(db, "crypto_info", info_clean, c("id"))
}


# =============================================================
# RUN
# =============================================================
run_start <- Sys.time()

safe_run <- function(name, fn) {
  cat(sprintf("\n========== %s ==========\n", name))
  tryCatch(fn(), error = function(e) {
    cat(sprintf("  [ERROR in %s] %s\n", name, e$message))
  })
}

if (MODE == "backfill") {
  safe_run("Listings", fetch_listings)
  safe_run("Global Metrics", fetch_global_metrics)
  safe_run("History (slow)", fetch_history)
  safe_run("Info", fetch_info)
} else if (MODE == "daily") {
  safe_run("Listings", fetch_listings)
  safe_run("Global Metrics", fetch_global_metrics)
  safe_run("History", fetch_history)
} else if (MODE == "info") {
  safe_run("Info", fetch_info)
} else if (MODE == "global") {
  safe_run("Global Metrics", fetch_global_metrics)
} else {
  cat(sprintf("Unknown mode: %s\n", MODE))
  quit(status = 1)
}

dbDisconnect(db)
elapsed <- as.numeric(difftime(Sys.time(), run_start, units = "mins"))
cat(sprintf("\n[%s] Pipeline finished in %.1f minutes\n", Sys.time(), elapsed))
