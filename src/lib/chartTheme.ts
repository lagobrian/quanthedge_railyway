/**
 * Chart theme utilities for Plotly charts.
 * Returns colors based on the current theme (light/dark).
 */

export function getChartTheme() {
  if (typeof window === 'undefined') return darkTheme;
  const isDark = document.documentElement.classList.contains('dark');
  return isDark ? darkTheme : lightTheme;
}

const darkTheme = {
  paper_bgcolor: '#061829',
  plot_bgcolor: '#061829',
  gridcolor: '#413510',
  linecolor: '#413510',
  fontColor: '#ffffff',
  rangesliderBg: '#0a2438',
  rangeselectorBg: '#0a2438',
  rangeselectorActive: '#00ced1',
  bordercolor: '#413510',
};

const lightTheme = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#ffffff',
  gridcolor: '#e0e4ea',
  linecolor: '#dce1e8',
  fontColor: '#1a2332',
  rangesliderBg: '#f0f2f5',
  rangeselectorBg: '#eef1f6',
  rangeselectorActive: '#0097a7',
  bordercolor: '#dce1e8',
};
