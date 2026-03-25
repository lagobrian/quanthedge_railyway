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
# Stablecoins (USD-pegged, EUR-pegged, gold-backed, etc.)
STABLECOINS <- c(
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "USDP", "FRAX", "USDD", "GUSD",
  "PYUSD", "FDUSD", "USDJ", "CUSD", "SUSD", "LUSD", "MIM", "UST", "USTC",
  "USDS", "USDX", "USD0", "USD1", "USDY", "USDG", "RLUSD",
  "USDe", "sUSDe", "USDf", "USDE", "SUSDE", "USDF", "USDtb",
  "USDAI", "bUSD0", "STABLE", "GHO", "EURC", "EURS", "EURT",
  "syrupUSDC", "syrupUSDT", "USDC.e", "BFUSD",
  "XAUt", "PAXG"  # gold-backed tokens
)
# Wrapped tokens, liquid staking derivatives, bridged tokens
WRAPPED <- c(
  "WBTC", "WETH", "WBNB", "STETH", "WSTETH", "RETH", "CBETH", "HBTC",
  "RENBTC", "TBTC", "BTCB", "BETH", "CBBTC",
  "AETHWETH", "AETHUSDT", "weETH", "WEETH", "RSETH", "METH",
  "LBTC", "SBTC", "FBTC", "BBTC", "BTCT", "vBTC",
  "stETH", "EZETH", "osETH", "EETH", "LSETH",
  "BNSOL", "JUPSOL", "JITOSOL", "slisBNB", "slisBNBx",
  "SolvBTC", "vBNB", "WTRX", "WFLR", "WXTZ",
  "KHYPE"
)
# LP tokens, exchange tokens, misc non-crypto
EXCLUDE_OTHER <- c(
  "JLP", "WLFI", "CC", "RAIN", "NIGHT", "KITE", "MORPHO", "ETHFI"
)
EXCLUDE_INDEX <- c("BTC", STABLECOINS, WRAPPED, EXCLUDE_OTHER)

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
  cat("[Altcoin Index] Computing (notebook Cell 10-11 logic + OHLC)...\n")

  # Get top 200 coins by latest market cap (only need 100 for index, buffer for monthly changes)
  # Get latest market cap per symbol (only where market_cap > 0)
  top_syms <- dbGetQuery(db, "
    SELECT symbol, market_cap FROM (
      SELECT symbol, market_cap, ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY date DESC) as rn
      FROM crypto_history
      WHERE close > 0 AND market_cap > 0
    ) sub WHERE rn = 1
  ") %>%
    filter(!symbol %in% EXCLUDE_INDEX, market_cap > 0) %>%
    arrange(desc(market_cap)) %>%
    head(200)

  cat(sprintf("  Top 200 altcoins selected for index computation\n"))

  raw <- dbGetQuery(db, sprintf("
    SELECT symbol, date, open, high, low, close, market_cap
    FROM crypto_history
    WHERE close > 0 AND market_cap > 0 AND symbol IN (%s)
    ORDER BY date
  ", paste(sprintf("'%s'", top_syms$symbol), collapse = ",")))
  if (nrow(raw) == 0) { cat("  No data\n"); return() }

  # Deduplicate (keep first occurrence per symbol+date)
  raw <- raw %>% distinct(date, symbol, .keep_all = TRUE)

  # Pivot all fields at once using a single wide pivot
  prices_wide <- raw %>% select(date, symbol, close) %>%
    pivot_wider(names_from = symbol, values_from = close) %>% arrange(date)
  dates <- prices_wide$date
  symbols <- setdiff(names(prices_wide), "date")

  # Build matrices using the same symbol order
  to_mat <- function(field) {
    wide <- raw %>% select(date, symbol, !!sym(field)) %>%
      pivot_wider(names_from = symbol, values_from = !!sym(field)) %>% arrange(date)
    # Ensure same column order
    m <- as.matrix(wide[, symbols, drop = FALSE])
    m
  }

  cat("  Building matrices...\n")
  price_mat <- to_mat("close")
  mcap_mat  <- to_mat("market_cap")
  open_mat  <- to_mat("open")
  high_mat  <- to_mat("high")
  low_mat   <- to_mat("low")

  # Compute log returns for close (matching notebook)
  log_returns <- matrix(NA_real_, nrow = nrow(price_mat), ncol = ncol(price_mat))
  for (j in 1:ncol(price_mat)) {
    for (i in 2:nrow(price_mat)) {
      if (!is.na(price_mat[i, j]) && !is.na(price_mat[i-1, j]) && price_mat[i-1, j] > 0) {
        log_returns[i, j] <- log(price_mat[i, j] / price_mat[i-1, j])
      }
    }
  }
  colnames(log_returns) <- symbols

  # Also compute returns for open/high/low (relative to prev close)
  open_returns <- matrix(NA_real_, nrow = nrow(price_mat), ncol = ncol(price_mat))
  high_returns <- matrix(NA_real_, nrow = nrow(price_mat), ncol = ncol(price_mat))
  low_returns <- matrix(NA_real_, nrow = nrow(price_mat), ncol = ncol(price_mat))
  for (j in 1:ncol(price_mat)) {
    for (i in 2:nrow(price_mat)) {
      prev_close <- price_mat[i-1, j]
      if (!is.na(prev_close) && prev_close > 0) {
        if (!is.na(open_mat[i, j])) open_returns[i, j] <- log(open_mat[i, j] / prev_close)
        if (!is.na(high_mat[i, j])) high_returns[i, j] <- log(high_mat[i, j] / prev_close)
        if (!is.na(low_mat[i, j]))  low_returns[i, j]  <- log(low_mat[i, j] / prev_close)
      }
    }
  }

  colnames(open_returns) <- symbols
  colnames(high_returns) <- symbols
  colnames(low_returns) <- symbols

  # Group by month
  months <- format(dates, "%Y-%m")
  unique_months <- unique(months)
  cat(sprintf("  %d months of data, %d symbols\n", length(unique_months), length(symbols)))

  # Accumulators
  idx_close_returns <- numeric(0)
  idx_open_returns <- numeric(0)
  idx_high_returns <- numeric(0)
  idx_low_returns <- numeric(0)
  idx_dates <- as.Date(character(0))
  idx_nconstituents <- integer(0)
  latest_constituents <- NULL

  for (m_idx in 1:(length(unique_months) - 1)) {
    this_month <- unique_months[m_idx]
    next_month <- unique_months[m_idx + 1]

    this_month_rows <- which(months == this_month)
    last_row_idx <- tail(this_month_rows, 1)
    last_mcaps <- mcap_mat[last_row_idx, ]

    valid <- !is.na(last_mcaps) & last_mcaps > 0
    if (sum(valid) < 5) next

    ranked <- sort(last_mcaps[valid], decreasing = TRUE)
    top100_syms <- names(ranked)[1:min(100, length(ranked))]
    next_month_rows <- which(months == next_month)
    if (length(next_month_rows) == 0) next

    available <- intersect(top100_syms, symbols)

    for (row_idx in next_month_rows) {
      day_mcaps <- mcap_mat[row_idx, available]
      day_mcaps[is.na(day_mcaps)] <- 0
      total_mcap <- sum(day_mcaps)
      if (total_mcap <= 0) next

      weights <- day_mcaps / total_mcap

      # Weighted returns for OHLC
      dr_close <- log_returns[row_idx, available]; dr_close[is.na(dr_close)] <- 0
      dr_open  <- open_returns[row_idx, available]; dr_open[is.na(dr_open)] <- 0
      dr_high  <- high_returns[row_idx, available]; dr_high[is.na(dr_high)] <- 0
      dr_low   <- low_returns[row_idx, available];  dr_low[is.na(dr_low)] <- 0

      idx_close_returns <- c(idx_close_returns, sum(dr_close * weights))
      idx_open_returns  <- c(idx_open_returns,  sum(dr_open * weights))
      idx_high_returns  <- c(idx_high_returns,  sum(dr_high * weights))
      idx_low_returns   <- c(idx_low_returns,   sum(dr_low * weights))
      idx_dates         <- c(idx_dates, dates[row_idx])
      idx_nconstituents <- c(idx_nconstituents, length(available))

      # Save the latest month's constituents for real-time use
      if (m_idx == length(unique_months) - 1) {
        latest_constituents <- data.frame(
          symbol = available,
          weight = round(as.numeric(weights), 6),
          market_cap = as.numeric(day_mcaps),
          stringsAsFactors = FALSE
        )
      }
    }
  }

  if (length(idx_close_returns) == 0) { cat("  No index data computed\n"); return() }

  # Cumulative index OHLC
  cum_close <- 100 * cumprod(1 + idx_close_returns)
  cum_open  <- numeric(length(idx_close_returns))
  cum_high  <- numeric(length(idx_close_returns))
  cum_low   <- numeric(length(idx_close_returns))

  prev_close <- 100
  for (i in seq_along(idx_close_returns)) {
    cum_open[i]  <- prev_close * (1 + idx_open_returns[i])
    cum_high[i]  <- prev_close * (1 + idx_high_returns[i])
    cum_low[i]   <- prev_close * (1 + idx_low_returns[i])
    prev_close   <- cum_close[i]
  }

  # Store close-based index (existing table)
  result <- data.frame(
    index_name = "alt100", date = idx_dates,
    value = round(cum_close, 4),
    daily_return = round(idx_close_returns * 100, 4),
    num_constituents = idx_nconstituents,
    stringsAsFactors = FALSE
  )
  dbExecute(db, "DELETE FROM crypto_models_cryptoindex WHERE index_name = 'alt100'")
  dbWriteTable(db, "crypto_models_cryptoindex", result, append = TRUE, row.names = FALSE)
  cat(sprintf("  [DB] Inserted %d rows -> crypto_models_cryptoindex\n", nrow(result)))

  # Store current constituents with Binance symbols (symbol + "USDT")
  if (!is.null(latest_constituents) && nrow(latest_constituents) > 0) {
    latest_constituents$binance_symbol <- paste0(latest_constituents$symbol, "USDT")
    latest_constituents$updated_at <- Sys.Date()
    dbExecute(db, "DELETE FROM model_altcoin_index_constituents")
    dbWriteTable(db, "model_altcoin_index_constituents", latest_constituents, append = TRUE, row.names = FALSE)
    cat(sprintf("  [DB] Inserted %d constituents -> model_altcoin_index_constituents\n", nrow(latest_constituents)))
  }

  cat(sprintf("  Index: %d days, latest close=%.2f, constituents=%d\n",
    nrow(result), tail(cum_close, 1), tail(idx_nconstituents, 1)))
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
