# =============================================================
# GENERATE MODEL THUMBNAILS
# Renders Plotly charts as PNGs and stores in PostgreSQL.
# Uses exact notebook style: Segoe Script, #061829 bg, #413510 grid.
# =============================================================

library(DBI)
library(RPostgres)
library(dplyr)
library(plotly)

# ---- CONFIG ----
DB_NAME     <- Sys.getenv("DB_NAME",     "quanthedge")
DB_HOST     <- Sys.getenv("DB_HOST",     "localhost")
DB_USER     <- Sys.getenv("DB_USER",     "quanthedge")
DB_PASSWORD <- Sys.getenv("DB_PASSWORD", "quanthedge_dev_2026")
DB_PORT     <- as.integer(Sys.getenv("DB_PORT", "5432"))

db <- dbConnect(
  RPostgres::Postgres(),
  dbname = DB_NAME, host = DB_HOST, user = DB_USER,
  password = DB_PASSWORD, port = DB_PORT
)
on.exit(dbDisconnect(db), add = TRUE)

# Signature colors
BG      <- "#061829"
GRID    <- "#413510"
WHITE   <- "#ffffff"
GREEN   <- "#00FF9D"
ORANGE  <- "#ba5533"
BLUE    <- "#00ced1"
PURPLE  <- "#b091cc"
FONT    <- "Segoe Script"

# Common layout
base_layout <- function(title, yaxis_title = "", tickprefix = "", ticksuffix = "") {
  list(
    title = list(text = title, font = list(family = FONT, size = 14, color = WHITE)),
    paper_bgcolor = BG,
    plot_bgcolor = BG,
    font = list(family = FONT, size = 10, color = WHITE),
    xaxis = list(
      showgrid = TRUE, gridcolor = GRID, showline = TRUE,
      linecolor = GRID, tickangle = -45, tickfont = list(size = 8)
    ),
    yaxis = list(
      title = list(text = yaxis_title, font = list(size = 10)),
      showgrid = TRUE, gridcolor = GRID, showline = TRUE,
      linecolor = GRID, tickprefix = tickprefix, ticksuffix = ticksuffix
    ),
    legend = list(
      orientation = "h", yanchor = "bottom", y = 1.02,
      xanchor = "right", x = 1, font = list(size = 8)
    ),
    margin = list(l = 50, r = 20, t = 40, b = 40),
    showlegend = TRUE
  )
}

save_thumbnail <- function(fig, slug, width = 800, height = 400) {
  tmp <- tempfile(fileext = ".png")
  tryCatch({
    save_image(fig, tmp, width = width, height = height, scale = 2)
    img_data <- readBin(tmp, "raw", file.info(tmp)$size)

    dbExecute(db, "DELETE FROM model_thumbnails WHERE slug = $1", list(slug))
    dbExecute(db,
      "INSERT INTO model_thumbnails (slug, image, updated_at) VALUES ($1, $2, NOW())",
      list(slug, img_data)
    )
    cat(sprintf("  [OK] %s (%d KB)\n", slug, length(img_data) / 1024))
  }, error = function(e) {
    cat(sprintf("  [ERROR] %s: %s\n", slug, e$message))
  }, finally = {
    if (file.exists(tmp)) file.remove(tmp)
  })
}


# =============================================================
# 1. CRYPTO BREADTH THUMBNAIL
# =============================================================
generate_breadth_thumbnail <- function() {
  cat("[Thumbnail] Crypto Breadth...\n")
  data <- dbGetQuery(db, "SELECT date, pct_above_50dma, pct_above_100dma, pct_above_200dma FROM crypto_models_cryptobreadth ORDER BY date")
  if (nrow(data) == 0) { cat("  No data\n"); return() }

  fig <- plot_ly() %>%
    add_trace(x = data$date, y = data$pct_above_50dma, type = "scatter", mode = "lines",
              name = "% Above 50 DMA", line = list(width = 2, color = ORANGE)) %>%
    add_trace(x = data$date, y = data$pct_above_100dma, type = "scatter", mode = "lines",
              name = "% Above 100 DMA", line = list(width = 2, color = BLUE)) %>%
    add_trace(x = data$date, y = data$pct_above_200dma, type = "scatter", mode = "lines",
              name = "% Above 200 DMA", line = list(width = 2, color = PURPLE)) %>%
    layout(
      !!!base_layout("Crypto Breadth", "% Above DMA", ticksuffix = "%"),
      yaxis = list(range = list(0, 100), showgrid = TRUE, gridcolor = GRID,
                   ticksuffix = "%", title = list(text = "% Above DMA"))
    )

  save_thumbnail(fig, "crypto-breadth")
}


# =============================================================
# 2. ALTCOIN INDEX THUMBNAIL
# =============================================================
generate_index_thumbnail <- function() {
  cat("[Thumbnail] Altcoin 100 Index + BTC overlay...\n")
  data <- dbGetQuery(db, "SELECT date, value FROM crypto_models_cryptoindex WHERE index_name = 'alt100' ORDER BY date")
  btc <- dbGetQuery(db, "SELECT date, close FROM crypto_history WHERE symbol = 'BTC' ORDER BY date")
  if (nrow(data) == 0) { cat("  No data\n"); return() }

  fig <- plot_ly() %>%
    add_trace(x = data$date, y = data$value, type = "scatter", mode = "lines",
              name = "Altcoin 100 Index Price", line = list(width = 2, color = GREEN),
              fill = "tonexty", fillcolor = "rgba(0, 255, 157, 0.1)")

  if (nrow(btc) > 0) {
    fig <- fig %>%
      add_trace(x = btc$date, y = btc$close, type = "scatter", mode = "lines",
                name = "Bitcoin Price", line = list(width = 2, color = WHITE))
  }

  fig <- fig %>% layout(!!!base_layout("Altcoin 100 Index", "Price ($)", tickprefix = "$"))
  save_thumbnail(fig, "altcoin-index")
}


# =============================================================
# 3. GLOBAL METRICS THUMBNAIL
# =============================================================
generate_global_thumbnail <- function() {
  cat("[Thumbnail] Global Metrics...\n")
  data <- dbGetQuery(db, "SELECT date, btc_dominance, eth_dominance FROM crypto_models_cryptoglobalquote ORDER BY date")
  if (nrow(data) == 0) { cat("  No data\n"); return() }

  fig <- plot_ly() %>%
    add_trace(x = data$date, y = data$btc_dominance, type = "scatter", mode = "lines",
              name = "BTC Dominance", line = list(width = 2, color = ORANGE)) %>%
    add_trace(x = data$date, y = data$eth_dominance, type = "scatter", mode = "lines",
              name = "ETH Dominance", line = list(width = 2, color = BLUE)) %>%
    layout(!!!base_layout("BTC & ETH Dominance", "Dominance %", ticksuffix = "%"))

  save_thumbnail(fig, "global-metrics")
}


# =============================================================
# RUN
# =============================================================
cat(sprintf("[%s] Generating thumbnails...\n", Sys.time()))
tryCatch(generate_breadth_thumbnail(), error = function(e) cat(sprintf("  [ERROR]: %s\n", e$message)))
tryCatch(generate_index_thumbnail(), error = function(e) cat(sprintf("  [ERROR]: %s\n", e$message)))
tryCatch(generate_global_thumbnail(), error = function(e) cat(sprintf("  [ERROR]: %s\n", e$message)))
cat(sprintf("[%s] Thumbnails complete\n", Sys.time()))
