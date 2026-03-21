library(crypto2)
library(dplyr)
output_dir <- "C:/Users/LagoB/Desktop/site/backend/data"

cat("Fetching latest listings to get top coins by rank...\n")
listings <- crypto_listings(which="latest", quote=FALSE, limit=500, finalWait=FALSE)
top_ids <- listings[order(listings$cmc_rank),][1:20,]

# Build coin_list format from listings for crypto_history
coin_list_full <- crypto_list(only_active=TRUE)
top_coins <- coin_list_full %>% filter(id %in% top_ids$id)
cat(paste("Fetching history for top", nrow(top_coins), "coins (90 days)...\n"))

prices <- crypto_history(
  coin_list=top_coins,
  start_date=as.character(Sys.Date()-90),
  end_date=as.character(Sys.Date()),
  interval="daily",
  finalWait=FALSE,
  sleep=1
)
write.csv(prices, file.path(output_dir, "recent_prices.csv"), row.names=FALSE)
cat(paste("Got", nrow(prices), "price records\n"))
cat("Done.\n")
