import { alpha, createTheme } from '@mui/material/styles'

const pageBg = '#050c1b'
const surfaceBg = '#111a2c'
const primaryMain = '#7c5dfa'
const secondaryMain = '#2dd4bf'

// Single source of truth for site-wide theming
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: primaryMain,
      light: '#a68bff',
      dark: '#5b3bbc',
      contrastText: '#f8fafc'
    },
    secondary: {
      main: secondaryMain,
      light: '#5eead4',
      dark: '#115e59',
      contrastText: '#021c1d'
    },
    background: {
      default: pageBg,
      paper: surfaceBg
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5f5'
    },
    divider: 'rgba(148, 163, 184, 0.24)'
  },
  typography: {
    fontFamily:
      'Inter, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontWeightRegular: 500,
    h1: {
      fontSize: '2.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      '@media (max-width:900px)': {
        fontSize: '2.25rem'
      },
      '@media (max-width:600px)': {
        fontSize: '2rem'
      }
    },
    h2: {
      fontSize: '2.1rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      '@media (max-width:900px)': {
        fontSize: '1.85rem'
      },
      '@media (max-width:600px)': {
        fontSize: '1.6rem'
      }
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 600,
      '@media (max-width:900px)': {
        fontSize: '1.55rem'
      },
      '@media (max-width:600px)': {
        fontSize: '1.35rem'
      }
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width:900px)': {
        fontSize: '1.35rem'
      },
      '@media (max-width:600px)': {
        fontSize: '1.2rem'
      }
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65
    },
    body2: {
      fontSize: '0.925rem',
      lineHeight: 1.6
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: 14
  },
  breakpoints: {
    values: {
      xs: 0, // Mobile: 0-599px
      sm: 600, // Tablet: 600-899px
      md: 900, // Desktop: 900px+
      lg: 1200,
      xl: 1536
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: pageBg,
          backgroundImage: `
            radial-gradient(circle at 20% 20%, ${alpha(primaryMain, 0.18)} 0, transparent 40%),
            radial-gradient(circle at 80% 0%, ${alpha(secondaryMain, 0.22)} 0, transparent 35%),
            linear-gradient(145deg, ${pageBg}, #020817)
          `,
          minHeight: '100vh'
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha('#94a3b8', 0.5)} transparent`
        },
        '*::-webkit-scrollbar': {
          width: 8,
          height: 8
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha('#94a3b8', 0.4),
          borderRadius: 999
        },
        a: {
          color: primaryMain
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#060e1f', 0.9),
          backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${alpha('#1f2937', 0.6)}`
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha(surfaceBg, 0.96),
          border: `1px solid ${alpha('#3f4d63', 0.6)}`,
          boxShadow: '0 20px 45px rgba(3, 7, 18, 0.55)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 18,
          border: `1px solid ${alpha('#3f4d63', 0.45)}`,
          boxShadow: '0 12px 30px rgba(3, 7, 18, 0.5)'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: '1.5rem',
          paddingBlock: '0.55rem'
        },
        containedSecondary: {
          color: '#041b21'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: alpha('#ffffff', 0.03),
          '& fieldset': {
            borderColor: alpha('#cbd5f5', 0.25)
          },
          '&:hover fieldset': {
            borderColor: alpha(primaryMain, 0.6)
          },
          '&.Mui-focused fieldset': {
            borderColor: primaryMain,
            borderWidth: 1.5
          }
        },
        input: {
          paddingBlock: '0.8rem'
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${alpha('#3f4d63', 0.5)}`
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(surfaceBg, 0.95),
          borderRadius: 16,
          border: `1px solid ${alpha('#3f4d63', 0.55)}`,
          marginBlock: '0.5rem',
          '&:before': {
            display: 'none'
          },
          '&.Mui-expanded': {
            margin: '0.5rem 0'
          }
        }
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          paddingInline: '1.25rem',
          minHeight: 64,
          '& .MuiAccordionSummary-content': {
            margin: 0,
            alignItems: 'center'
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14
        }
      }
    }
  }
})

export default theme


