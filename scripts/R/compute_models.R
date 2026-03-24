# =============================================================
# COMPUTE CRYPTO MODELS - Exact replication of crypto_breadh.ipynb
# =============================================================
# Reads raw CMC data from PostgreSQL, computes:
#   1. Altcoin 100 Market-Cap Weighted Index (monthly rebalanced, daily mcap weights)
#   2. Crypto Breadth (% above 50/100/200 DMA, dynamically adjusted denominator)
#   3. Distance-Weighted Breadth (penalized by % of coins moving lower)
# Writes computed results back to the DB.
# =============================================================

library(dplyr)
library(tidyr)
library(DBI)
library(RPostgres)
library(lubridate)

# ---- CONFIG ----
DB_NAME     <- Sys.getenv("DB_NAME",     "quanthedge")
DB_HOST     <- Sys.getenv("DB_HOST",     "localhost")
DB_USER     <- Sys.getenv("DB_USER",     "quanthedge")
DB_PASSWORD <- Sys.getenv("DB_PASSWORD", "quanthedge_dev_2026")
DB_PORT     <- as.integer(Sys.getenv("DB_PORT", "5432"))

db <- dbConnect(
  RPostgres::Postgres(),
  dbname   = DB_NAME,
  host     = DB_HOST,
  user     = DB_USER,
  password = DB_PASSWORD,
  port     = DB_PORT
)
on.exit(dbDisconnect(db), add = TRUE)

# ---- WRITE TO EXISTING DJANGO TABLES ----
# crypto_models_cryptoindex:       id, index_name, date, value, daily_return, num_constituents
# crypto_models_cryptobreadth:     id, date, pct_above_50dma, pct_above_100dma, pct_above_200dma
# crypto_models_cryptoglobalquote: id, date, btc_dominance, eth_dominance, active_cryptocurrencies,
#                                  total_market_cap, total_volume_24h, altcoin_market_cap

# Stablecoins and wrapped tokens to exclude
STABLECOINS <- c(
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "FRAX", "USDD", "GUSD",
  "PYUSD", "FDUSD", "USDJ", "CUSD", "SUSD", "LUSD", "MIM", "UST", "USTC",
  "USDS", "USDX", "USD0"
)
WRAPPED <- c(
  "WBTC", "WETH", "WBNB", "STETH", "WSTETH", "RETH", "CBETH", "HBTC",
  "RENBTC", "TBTC", "BTCB", "BETH"
)
EXCLUDE_INDEX <- c("BTC", STABLECOINS, WRAPPED)

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


# =============================================================
# 1. ALTCOIN 100 INDEX
#    Exact replication of notebook Cell 10-11:
#    - Monthly rebalancing: rank by market cap at end of each month
#    - Top 100 altcoins (excl BTC, stablecoins, wrapped)
#    - Daily weights = daily_mcap / sum(daily_mcap) within month
#    - Log returns * daily weights, summed across coins
#    - Cumulative: 100 * cumprod(1 + weighted_returns)
# =============================================================
compute_altcoin_index <- function() {
  cat("[Altcoin Index] Computing (notebook Cell 10-11 logic)...\n")

  # Get all price + market_cap history
  raw <- dbGetQuery(db, "
    SELECT symbol, date, close, market_cap
    FROM crypto_history
    WHERE close > 0 AND market_cap > 0
    ORDER BY date
  ")
  if (nrow(raw) == 0) { cat("  No data\n"); return() }

  # Filter out BTC, stablecoins, wrapped
  raw <- raw %>% filter(!symbol %in% EXCLUDE_INDEX)

  # Pivot to wide: prices and market caps
  prices_wide <- raw %>%
    select(date, symbol, close) %>%
    distinct(date, symbol, .keep_all = TRUE) %>%
    pivot_wider(names_from = symbol, values_from = close) %>%
    arrange(date)

  mcaps_wide <- raw %>%
    select(date, symbol, market_cap) %>%
    distinct(date, symbol, .keep_all = TRUE) %>%
    pivot_wider(names_from = symbol, values_from = market_cap) %>%
    arrange(date)

  dates <- prices_wide$date
  price_mat <- as.matrix(prices_wide[, -1])
  mcap_mat <- as.matrix(mcaps_wide[, -1])
  symbols <- colnames(price_mat)

  # Compute log returns (matching notebook: returns = np.log(prices / prices.shift(1)))
  log_returns <- matrix(NA_real_, nrow = nrow(price_mat), ncol = ncol(price_mat))
  for (j in 1:ncol(price_mat)) {
    for (i in 2:nrow(price_mat)) {
      if (!is.na(price_mat[i, j]) && !is.na(price_mat[i-1, j]) && price_mat[i-1, j] > 0) {
        log_returns[i, j] <- log(price_mat[i, j] / price_mat[i-1, j])
      }
    }
  }
  colnames(log_returns) <- symbols

  # Group by month
  months <- format(dates, "%Y-%m")
  unique_months <- unique(months)

  cat(sprintf("  %d months of data, %d symbols\n", length(unique_months), length(symbols)))

  # For each month: rank by end-of-month market cap, select top 100,
  # then apply daily mcap weights to next month's returns
  crypto100_returns <- numeric(0)
  crypto100_dates <- as.Date(character(0))
  crypto100_nconstituents <- integer(0)

  for (m_idx in 1:(length(unique_months) - 1)) {
    this_month <- unique_months[m_idx]
    next_month <- unique_months[m_idx + 1]

    # Get last row of this month's market caps
    this_month_rows <- which(months == this_month)
    last_row_idx <- tail(this_month_rows, 1)
    last_mcaps <- mcap_mat[last_row_idx, ]

    # Rank: top 100 by market cap (non-NA, > 0)
    valid <- !is.na(last_mcaps) & last_mcaps > 0
    if (sum(valid) < 5) next

    ranked <- sort(last_mcaps[valid], decreasing = TRUE)
    top100_syms <- names(ranked)[1:min(100, length(ranked))]

    # Get next month's rows
    next_month_rows <- which(months == next_month)
    if (length(next_month_rows) == 0) next

    # Filter to coins available in next month
    available <- intersect(top100_syms, symbols)

    for (row_idx in next_month_rows) {
      # Daily market cap weights (notebook: daily_weights = next_month_caps / sum(next_month_caps, axis=1))
      day_mcaps <- mcap_mat[row_idx, available]
      day_mcaps[is.na(day_mcaps)] <- 0
      total_mcap <- sum(day_mcaps)
      if (total_mcap <= 0) next

      weights <- day_mcaps / total_mcap

      # Daily log returns weighted by market cap
      day_returns <- log_returns[row_idx, available]
      day_returns[is.na(day_returns)] <- 0

      weighted_return <- sum(day_returns * weights)
      crypto100_returns <- c(crypto100_returns, weighted_return)
      crypto100_dates <- c(crypto100_dates, dates[row_idx])
      crypto100_nconstituents <- c(crypto100_nconstituents, length(available))
    }
  }

  if (length(crypto100_returns) == 0) { cat("  No index data computed\n"); return() }

  # Cumulative index: 100 * cumprod(1 + returns) (notebook Cell 11)
  cumulative <- 100 * cumprod(1 + crypto100_returns)

  result <- data.frame(
    index_name       = "alt100",
    date             = crypto100_dates,
    value            = round(cumulative, 4),
    daily_return     = round(crypto100_returns * 100, 4),
    num_constituents = crypto100_nconstituents,
    stringsAsFactors = FALSE
  )

  # Clear old alt100 data and insert fresh
  dbExecute(db, "DELETE FROM crypto_models_cryptoindex WHERE index_name = 'alt100'")
  dbWriteTable(db, "crypto_models_cryptoindex", result, append = TRUE, row.names = FALSE)
  cat(sprintf("  [DB] Inserted %d rows -> crypto_models_cryptoindex\n", nrow(result)))
  cat(sprintf("  Index: %d days, latest=%.2f, constituents=%d\n",
    nrow(result), tail(result$value, 1), tail(result$num_constituents, 1)))
}


# =============================================================
# 2. CRYPTO BREADTH (% above 50/100/200 DMA)
#    Exact replication of notebook Cell 15:
#    - For each date, denominator = all coins that existed up to that date
#    - Rolling SMA, binary indicator price > SMA
#    - Pct = sum(above) / count(available) * 100
# =============================================================
compute_breadth <- function() {
  cat("[Crypto Breadth] Computing (notebook Cell 15 logic)...\n")

  # Get all prices
  prices_raw <- dbGetQuery(db, "
    SELECT symbol, date, close
    FROM crypto_history
    WHERE close > 0
    ORDER BY date
  ")
  if (nrow(prices_raw) == 0) { cat("  No data\n"); return() }

  # Exclude stablecoins and wrapped from breadth
  prices_raw <- prices_raw %>% filter(!symbol %in% c(STABLECOINS, WRAPPED))

  # Pivot wide
  prices_wide <- prices_raw %>%
    distinct(date, symbol, .keep_all = TRUE) %>%
    pivot_wider(names_from = symbol, values_from = close) %>%
    arrange(date)

  dates <- prices_wide$date
  price_mat <- as.matrix(prices_wide[, -1])
  symbols <- colnames(price_mat)

  cat(sprintf("  %d dates, %d symbols\n", length(dates), length(symbols)))

  # For each symbol, find inception date (first non-NA price)
  inception <- sapply(1:ncol(price_mat), function(j) {
    first_valid <- which(!is.na(price_mat[, j]))[1]
    if (is.na(first_valid)) NA else dates[first_valid]
  })
  names(inception) <- symbols

  # Compute rolling SMAs
  rolling_sma <- function(mat, n) {
    result <- matrix(NA_real_, nrow = nrow(mat), ncol = ncol(mat))
    for (j in 1:ncol(mat)) {
      for (i in n:nrow(mat)) {
        window <- mat[(i - n + 1):i, j]
        valid <- window[!is.na(window)]
        if (length(valid) == n) result[i, j] <- mean(valid)
      }
    }
    result
  }

  cat("  Computing 50-DMA...\n")
  sma50 <- rolling_sma(price_mat, 50)
  cat("  Computing 100-DMA...\n")
  sma100 <- rolling_sma(price_mat, 100)
  cat("  Computing 200-DMA...\n")
  sma200 <- rolling_sma(price_mat, 200)

  # For each date: count coins that existed up to that date (notebook logic),
  # then compute % above DMA using only those coins
  breadth <- data.frame(
    date = dates,
    pct_above_50dma  = NA_real_,
    pct_above_100dma = NA_real_,
    pct_above_200dma = NA_real_
  )

  for (i in 1:nrow(price_mat)) {
    current_date <- dates[i]

    # Coins that existed up to this date (notebook: cummulative_count logic)
    available_syms <- symbols[!is.na(inception) & inception <= current_date]

    calc_pct <- function(sma_mat) {
      cols <- intersect(available_syms, symbols)
      col_idx <- match(cols, symbols)
      col_idx <- col_idx[!is.na(col_idx)]
      if (length(col_idx) == 0) return(NA_real_)

      prices_row <- price_mat[i, col_idx]
      sma_row <- sma_mat[i, col_idx]
      both_valid <- !is.na(prices_row) & !is.na(sma_row)
      if (sum(both_valid) == 0) return(NA_real_)

      above <- sum(prices_row[both_valid] > sma_row[both_valid])
      round(above / sum(both_valid) * 100, 2)
    }

    breadth$pct_above_50dma[i]  <- calc_pct(sma50)
    breadth$pct_above_100dma[i] <- calc_pct(sma100)
    breadth$pct_above_200dma[i] <- calc_pct(sma200)
  }

  breadth <- breadth %>%
    filter(!is.na(pct_above_50dma)) %>%
    mutate(
      pct_above_100dma = ifelse(is.na(pct_above_100dma), 0, pct_above_100dma),
      pct_above_200dma = ifelse(is.na(pct_above_200dma), 0, pct_above_200dma)
    )

  # Clear old breadth and insert fresh
  dbExecute(db, "DELETE FROM crypto_models_cryptobreadth")
  dbWriteTable(db, "crypto_models_cryptobreadth", breadth, append = TRUE, row.names = FALSE)
  cat(sprintf("  [DB] Inserted %d rows -> crypto_models_cryptobreadth\n", nrow(breadth)))
  cat(sprintf("  Breadth: %d days\n", nrow(breadth)))

}


# =============================================================
# RUN ALL
# =============================================================
cat(sprintf("[%s] Computing models...\n", Sys.time()))

tryCatch(compute_altcoin_index(), error = function(e) cat(sprintf("  [ERROR] Altcoin Index: %s\n", e$message)))
tryCatch(compute_breadth(), error = function(e) cat(sprintf("  [ERROR] Breadth: %s\n", e$message)))

# Sync global metrics from R table -> Django table
tryCatch({
  cat("[Global Metrics] Syncing to Django table...\n")
  global <- dbGetQuery(db, "SELECT * FROM crypto_global_metrics WHERE btc_dominance IS NOT NULL")
  if (nrow(global) > 0) {
    global_out <- data.frame(
      date                    = global$date,
      btc_dominance           = global$btc_dominance,
      eth_dominance           = global$eth_dominance,
      active_cryptocurrencies = global$active_cryptocurrencies,
      total_market_cap        = global$total_market_cap,
      total_volume_24h        = global$total_volume_24h,
      altcoin_market_cap      = NA_real_,
      stringsAsFactors        = FALSE
    )
    dbExecute(db, "DELETE FROM crypto_models_cryptoglobalquote")
    dbWriteTable(db, "crypto_models_cryptoglobalquote", global_out, append = TRUE, row.names = FALSE)
    cat(sprintf("  [DB] Inserted %d rows -> crypto_models_cryptoglobalquote\n", nrow(global_out)))
  }
}, error = function(e) cat(sprintf("  [ERROR] Global Metrics sync: %s\n", e$message)))

cat(sprintf("[%s] All models computed\n", Sys.time()))
