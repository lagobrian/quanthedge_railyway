library(crypto2)
library(dplyr)
output_dir <- "C:/Users/LagoB/Desktop/site/backend/data"

cat("Fetching global quotes...\n")
gq <- tryCatch(crypto_global_quotes(which="latest", quote=TRUE, finalWait=FALSE), error=function(e) { cat(paste("GQ Error:", e$message, "\n")); NULL })
if (!is.null(gq)) { write.csv(gq, file.path(output_dir, "global_quotes.csv"), row.names=FALSE); cat(paste("Got", nrow(gq), "global quotes\n")) }

cat("Fetching coin list...\n")
coin_list <- crypto_list(only_active=TRUE)
top_coins <- coin_list %>% filter(!is.na(.data[["rank"]])) %>% arrange(.data[["rank"]]) %>% head(100)
cat(paste("Top coins:", nrow(top_coins), "\n"))

cat("Fetching 30 days of history for top 100...\n")
prices <- tryCatch(
  crypto_history(coin_list=top_coins, start_date=as.character(Sys.Date()-30), end_date=as.character(Sys.Date()), interval="daily", finalWait=FALSE, sleep=1),
  error=function(e) { cat(paste("History Error:", e$message, "\n")); NULL }
)
if (!is.null(prices)) { write.csv(prices, file.path(output_dir, "recent_prices.csv"), row.names=FALSE); cat(paste("Got", nrow(prices), "price records\n")) }
cat("Done.\n")
