/**
 * Chart theme - exact match of the notebook style (colors.py).
 * Signature: Segoe Script font, #061829 bg, #413510 grid, colors2 palette.
 */

export const colors2 = {
  blue: '#00ced1',
  grey: '#ababab',
  brown: '#ccb091',
  pink: '#cc91ad',
  green: '#adcc91',
  purple: '#b091cc',
  red: '#ff2400',
  light_red: '#e83311',
  red_orange: '#d14422',
  orange: '#ba5533',
  brown_orange: '#a36744',
  dark_brown: '#8c7a55',
  light_green: '#758d66',
  bright_green: '#00FF9D',
  green_cyan: '#5ea078',
  cyan: '#46b389',
  dark_cyan: '#2fc69a',
  dark_turquoise: '#18d9ab',
  turquoise: '#00e3bc',
};

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
  fontFamily: 'Segoe Script, cursive',
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
  fontFamily: 'Segoe Script, cursive',
  rangesliderBg: '#f0f2f5',
  rangeselectorBg: '#eef1f6',
  rangeselectorActive: '#0097a7',
  bordercolor: '#dce1e8',
};

/** Standard Plotly layout matching the notebook charts exactly */
export function getBaseLayout(theme: ReturnType<typeof getChartTheme>, title: string) {
  return {
    title: {
      text: title,
      font: { family: theme.fontFamily, size: 18, color: theme.fontColor },
    },
    autosize: true,
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: { family: theme.fontFamily, size: 12, color: theme.fontColor },
    xaxis: {
      title: '',
      showgrid: true,
      showticklabels: true,
      showline: true,
      zeroline: true,
      gridcolor: theme.gridcolor,
      tickangle: -45,
      rangeslider: { visible: true, bgcolor: theme.rangesliderBg, bordercolor: theme.bordercolor },
      rangeselector: {
        buttons: [
          { count: 1, label: '1M', step: 'month', stepmode: 'backward' },
          { count: 3, label: '3M', step: 'month', stepmode: 'backward' },
          { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
          { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
          { count: 2, label: '2Y', step: 'year', stepmode: 'backward' },
          { step: 'all', label: 'All' },
        ],
        bgcolor: theme.rangeselectorBg,
        activecolor: theme.rangeselectorActive,
        bordercolor: theme.bordercolor,
        font: { color: theme.fontColor },
      },
    },
    yaxis: {
      showgrid: true,
      showticklabels: true,
      showline: true,
      zeroline: true,
      gridcolor: theme.gridcolor,
    },
    legend: {
      orientation: 'h' as const,
      yanchor: 'bottom' as const,
      y: 1.02,
      xanchor: 'right' as const,
      x: 1,
    },
    margin: { l: 60, r: 30, t: 60, b: 40 },
    hovermode: 'x unified' as const,
  };
}

export const plotConfig = {
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'] as any[],
  toImageButtonOptions: {
    format: 'png' as const,
    height: 800,
    width: 1200,
    scale: 3,
  },
};
