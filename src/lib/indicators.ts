/** Technical indicator calculations for crypto charts */

function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (!isNaN(values[j])) { sum += values[j]; count++; }
    }
    if (count === period) result[i] = sum / period;
  }
  return result;
}

function ema(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);

  let sum = 0, count = 0, startIdx = -1;
  for (let i = 0; i < values.length; i++) {
    if (!isNaN(values[i])) {
      sum += values[i]; count++;
      if (count === period) { startIdx = i; result[i] = sum / period; break; }
    }
  }
  if (startIdx === -1) return result;

  for (let i = startIdx + 1; i < values.length; i++) {
    const v = isNaN(values[i]) ? result[i - 1] : values[i];
    result[i] = (v - result[i - 1]) * k + result[i - 1];
  }
  return result;
}

export function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period + 1) return rsi;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change; else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (change < 0 ? Math.abs(change) : 0)) / period;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

export function computeStochRSI(
  closes: number[],
  rsiPeriod = 14,
  stochPeriod = 14,
  kSmooth = 3,
  dSmooth = 3,
): { k: number[]; d: number[] } {
  const rsi = computeRSI(closes, rsiPeriod);
  const raw: number[] = new Array(closes.length).fill(NaN);

  for (let i = rsiPeriod + stochPeriod - 1; i < closes.length; i++) {
    const window = rsi.slice(i - stochPeriod + 1, i + 1);
    const valid = window.filter((v) => !isNaN(v));
    if (valid.length < stochPeriod) continue;
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    raw[i] = max === min ? 50 : ((rsi[i] - min) / (max - min)) * 100;
  }

  const k = sma(raw, kSmooth);
  const d = sma(k, dSmooth);
  return { k, d };
}

export function computeMomentum(closes: number[], period = 10): number[] {
  const mom: number[] = new Array(closes.length).fill(NaN);
  for (let i = period; i < closes.length; i++) {
    mom[i] = ((closes[i] - closes[i - period]) / closes[i - period]) * 100;
  }
  return mom;
}

export function computeSMA(closes: number[], period: number): number[] {
  return sma(closes, period);
}

export function computeEMA(closes: number[], period: number): number[] {
  return ema(closes, period);
}
