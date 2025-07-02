
// Chart security utilities
const ALLOWED_CHART_THEMES = ['light', 'dark', 'system'] as const;
const ALLOWED_CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#413ea0',
  '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff',
  '#00ffff', '#800000', '#008000', '#000080', '#808000'
] as const;

type AllowedTheme = typeof ALLOWED_CHART_THEMES[number];
type AllowedColor = typeof ALLOWED_CHART_COLORS[number];

export const sanitizeChartTheme = (theme: string): AllowedTheme => {
  return ALLOWED_CHART_THEMES.includes(theme as AllowedTheme) 
    ? (theme as AllowedTheme) 
    : 'light';
};

export const sanitizeChartColor = (color: string): AllowedColor => {
  return ALLOWED_CHART_COLORS.includes(color as AllowedColor) 
    ? (color as AllowedColor) 
    : '#8884d8';
};

export const validateChartData = (data: any[]): boolean => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    if (typeof item !== 'object' || item === null) return false;
    
    // Check that all values are safe numbers
    return Object.values(item).every(value => {
      if (typeof value === 'string') return value.length < 100;
      if (typeof value === 'number') return isFinite(value) && !isNaN(value);
      return true;
    });
  });
};
