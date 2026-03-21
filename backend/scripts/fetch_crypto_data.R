# fetch_crypto_data.R
# Uses the crypto2 R package to download data from CoinMarketCap
# Outputs CSV files for the Python processing script to ingest

library(crypto2)
library(dplyr)

args <- commandArgs(trailingOnly = TRUE)
output_dir <- if (length(args) > 0) args[1] else file.path(dirname(sys.frame(1)$ofile), "..", "data")
dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)

cat("=== Fetching crypto data from CoinMarketCap ===\n")
cat(paste("Output directory:", output_dir, "\n"))

# 1. Get active coin list (top 500 by rank for breadth calculations)
cat("\n[1/4] Fetching coin list...\n")
coin_list <- tryCatch({
  crypto_list(only_active = TRUE)
}, error = function(e) {
  cat(paste("Error fetching coin list:", e$message, "\n"))
  NULL
})

if (!is.null(coin_list)) {
  write.csv(coin_list, file.path(output_dir, "coin_list.csv"), row.names = FALSE)
  cat(paste("  Got", nrow(coin_list), "coins\n"))
}

# 2. Get latest listings with price/market cap data (top 500)
cat("\n[2/4] Fetching latest listings with quotes...\n")
listings <- tryCatch({
  crypto_listings(which = "latest", quote = TRUE, limit = 500, finalWait = FALSE)
}, error = function(e) {
  cat(paste("Error fetching listings:", e$message, "\n"))
  NULL
})

if (!is.null(listings)) {
  write.csv(listings, file.path(output_dir, "latest_listings.csv"), row.names = FALSE)
  cat(paste("  Got", nrow(listings), "listings\n"))
}

# 3. Get historical prices for top 100 coins (last 7 days for incremental updates)
cat("\n[3/4] Fetching recent price history (top 100, last 7 days)...\n")
if (!is.null(listings)) {
  top_ids <- listings[order(listings$cmc_rank),][1:100,]
  top_coins <- coin_list %>% filter(id %in% top_ids$id)

  end_date <- Sys.Date()
  start_date <- end_date - 7

  prices <- tryCatch({
    crypto_history(
      coin_list = top_coins,
      start_date = as.character(start_date),
      end_date = as.character(end_date),
      interval = "daily",
      finalWait = FALSE,
      sleep = 1
    )
  }, error = function(e) {
    cat(paste("Error fetching price history:", e$message, "\n"))
    NULL
  })

  if (!is.null(prices)) {
    write.csv(prices, file.path(output_dir, "recent_prices.csv"), row.names = FALSE)
    cat(paste("  Got", nrow(prices), "price records\n"))
  }
}

# 4. Get global market quotes
cat("\n[4/4] Fetching global market quotes...\n")
global_quotes <- tryCatch({
  crypto_global_quotes(which = "latest", quote = TRUE, finalWait = FALSE)
}, error = function(e) {
  cat(paste("Error fetching global quotes:", e$message, "\n"))
  NULL
})

if (!is.null(global_quotes)) {
  write.csv(global_quotes, file.path(output_dir, "global_quotes.csv"), row.names = FALSE)
  cat(paste("  Got", nrow(global_quotes), "global quote records\n"))
}

cat("\n=== Data fetch complete ===\n")
