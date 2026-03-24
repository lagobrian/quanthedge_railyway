"""
Generate model chart thumbnails and store in PostgreSQL.
Exact notebook style: Segoe Script, #061829 bg, #413510 grid, colors2 palette.
"""
import plotly.graph_objects as go
import psycopg2
import os

# DB config
DB = dict(
    dbname=os.getenv("DB_NAME", "quanthedge"),
    host=os.getenv("DB_HOST", "localhost"),
    user=os.getenv("DB_USER", "quanthedge"),
    password=os.getenv("DB_PASSWORD", "quanthedge_dev_2026"),
    port=os.getenv("DB_PORT", "5432"),
)

# Signature colors (from colors.py)
BG = "#061829"
GRID = "#413510"
WHITE = "#ffffff"
GREEN = "#00FF9D"
ORANGE = "#ba5533"
BLUE = "#00ced1"
PURPLE = "#b091cc"
BROWN = "#ccb091"
FONT = "Segoe Script"


def base_layout(title, yaxis_title="", tickprefix="", ticksuffix=""):
    return dict(
        title=dict(text=title, font=dict(family=FONT, size=14, color=WHITE)),
        paper_bgcolor=BG,
        plot_bgcolor=BG,
        font=dict(family=FONT, size=10, color=WHITE),
        xaxis=dict(
            showgrid=True, gridcolor=GRID, showline=True, linecolor=GRID,
            tickangle=-45, tickfont=dict(size=8),
        ),
        yaxis=dict(
            title=dict(text=yaxis_title, font=dict(size=10)),
            showgrid=True, gridcolor=GRID, showline=True, linecolor=GRID,
            tickprefix=tickprefix, ticksuffix=ticksuffix,
        ),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(size=8)),
        margin=dict(l=50, r=20, t=40, b=40),
        showlegend=True,
    )


def save_thumbnail(conn, fig, slug, width=800, height=400):
    img = fig.to_image(format="png", width=width, height=height, scale=2)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM model_thumbnails WHERE slug = %s", (slug,))
        cur.execute(
            "INSERT INTO model_thumbnails (slug, image, updated_at) VALUES (%s, %s, NOW())",
            (slug, psycopg2.Binary(img)),
        )
    conn.commit()
    print(f"  [OK] {slug} ({len(img) // 1024} KB)")


def generate_breadth(conn):
    print("[Thumbnail] Crypto Breadth...")
    with conn.cursor() as cur:
        cur.execute("SELECT date, pct_above_50dma, pct_above_100dma, pct_above_200dma FROM crypto_models_cryptobreadth ORDER BY date")
        rows = cur.fetchall()
    if not rows:
        print("  No data"); return

    dates = [r[0] for r in rows]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=dates, y=[r[1] for r in rows], mode="lines", name="% Above 50 DMA", line=dict(width=2, color=ORANGE)))
    fig.add_trace(go.Scatter(x=dates, y=[r[2] for r in rows], mode="lines", name="% Above 100 DMA", line=dict(width=2, color=BLUE)))
    fig.add_trace(go.Scatter(x=dates, y=[r[3] for r in rows], mode="lines", name="% Above 200 DMA", line=dict(width=2, color=PURPLE)))
    fig.update_layout(**base_layout("Crypto Breadth", "% Above DMA", ticksuffix="%"))
    fig.update_yaxes(range=[0, 100])
    save_thumbnail(conn, fig, "crypto-breadth")


def generate_index(conn):
    print("[Thumbnail] Altcoin 100 Index + BTC...")
    with conn.cursor() as cur:
        cur.execute("SELECT date, value FROM crypto_models_cryptoindex WHERE index_name = 'alt100' ORDER BY date")
        idx = cur.fetchall()
        cur.execute("SELECT date, close FROM crypto_history WHERE symbol = 'BTC' ORDER BY date")
        btc = cur.fetchall()
    if not idx:
        print("  No data"); return

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=[r[0] for r in idx], y=[r[1] for r in idx], mode="lines",
        name="Altcoin 100 Index Price", line=dict(width=2, color=GREEN),
        fill="tonexty", fillcolor="rgba(0, 255, 157, 0.1)",
    ))
    if btc:
        fig.add_trace(go.Scatter(
            x=[r[0] for r in btc], y=[r[1] for r in btc], mode="lines",
            name="Bitcoin Price", line=dict(width=2, color=WHITE),
        ))

    layout = base_layout("Altcoin 100 Index", "Price ($)", tickprefix="$")
    # Add price annotations
    if idx:
        layout["annotations"] = [dict(
            x=idx[-1][0], y=idx[-1][1], text=f"${idx[-1][1]:.2f}",
            showarrow=False, yshift=-10, font=dict(size=12, color=GREEN), xshift=30,
        )]
    if btc:
        layout.setdefault("annotations", []).append(dict(
            x=btc[-1][0], y=btc[-1][1], text=f"${btc[-1][1]:.2f}",
            showarrow=False, yshift=-10, font=dict(size=12, color=WHITE), xshift=30,
        ))

    fig.update_layout(**layout)
    save_thumbnail(conn, fig, "altcoin-index")


def generate_global(conn):
    print("[Thumbnail] Global Metrics...")
    with conn.cursor() as cur:
        cur.execute("SELECT date, btc_dominance, eth_dominance FROM crypto_models_cryptoglobalquote ORDER BY date")
        rows = cur.fetchall()
    if not rows:
        print("  No data"); return

    dates = [r[0] for r in rows]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=dates, y=[r[1] for r in rows], mode="lines", name="BTC Dominance", line=dict(width=2, color=ORANGE)))
    fig.add_trace(go.Scatter(x=dates, y=[r[2] for r in rows], mode="lines", name="ETH Dominance", line=dict(width=2, color=BLUE)))
    fig.update_layout(**base_layout("BTC & ETH Dominance", "Dominance %", ticksuffix="%"))
    save_thumbnail(conn, fig, "global-metrics")


if __name__ == "__main__":
    conn = psycopg2.connect(**DB)
    try:
        generate_breadth(conn)
        generate_index(conn)
        generate_global(conn)
    finally:
        conn.close()
    print("Done.")
