import { alpha, createTheme } from '@mui/material/styles';

const palette = {
  dark: {
    bg: '#0b1220', paper: '#111c31', paper2: '#16233d', line: '#25344f',
    text: '#e8eef7', muted: '#9fb0c8',
  },
  light: {
    bg: '#eef3fb', paper: '#ffffff', paper2: '#eef3fa', line: '#d6e0ee',
    text: '#12233d', muted: '#5b6b82',
  },
};

export function makeTheme(mode) {
  const c = palette[mode];
  return createTheme({
    palette: {
      mode,
      primary: { main: '#2f81f7' },
      secondary: { main: '#a855f7' },
      success: { main: '#22c55e' },
      error: { main: '#ef4444' },
      warning: { main: '#f59e0b' },
      info: { main: '#06b6d4' },
      background: { default: c.bg, paper: c.paper },
      text: { primary: c.text, secondary: c.muted },
      divider: c.line,
    },
    typography: {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: 13,
      h1: { fontSize: 22, fontWeight: 700, letterSpacing: 0.3 },
      h2: { fontSize: 20, fontWeight: 700 },
      h3: { fontSize: 13, fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 700 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: mode === 'dark'
              ? 'linear-gradient(160deg, #070d18, #0b1220) fixed'
              : 'linear-gradient(160deg, #eef3fb, #e6edf7) fixed',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${c.line}`,
            background: `linear-gradient(160deg, ${c.paper}, ${c.paper2})`,
            boxShadow: 'none',
          },
        },
      },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiOutlinedInput: {
        styleOverrides: { root: { backgroundColor: alpha(c.paper2, 0.9) } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: c.line, padding: '8px 9px', whiteSpace: 'nowrap', fontSize: 11.5 },
          head: { backgroundColor: mode === 'dark' ? '#0f1a2e' : '#e7eef8', fontWeight: 700 },
        },
      },
    },
    custom: c,
  });
}
