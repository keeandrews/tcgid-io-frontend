import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import WorkOutlineIcon from '@mui/icons-material/WorkOutline'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import ApiIcon from '@mui/icons-material/Api'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import useAuthStatus from '../hooks/useAuthStatus'
import PageContainer from '../components/PageContainer'

const actionCards = [
  {
    key: 'account',
    title: 'Account',
    description: 'Update your company profile, billing contacts, and integration settings.',
    icon: ManageAccountsIcon,
    path: '/account',
    palette: {
      light: 'primary.light',
      main: 'primary.main'
    }
  },
  {
    key: 'inventory',
    title: 'Inventory',
    description: 'Create new items, organize batches, and keep your catalog photo-ready.',
    icon: Inventory2Icon,
    path: '/inventory',
    palette: {
      light: 'secondary.light',
      main: 'secondary.main'
    }
  },
  {
    key: 'offers',
    title: 'Offers',
    description: 'Review marketplace offers, counter with confidence, and close faster.',
    icon: LocalOfferIcon,
    path: '/offers',
    palette: {
      light: 'success.light',
      main: 'success.main'
    }
  },
  {
    key: 'browse',
    title: 'Browse Catalog',
    description: 'Browse thousands of curated trading cards to benchmark your collection and estimate value instantly.',
    icon: TravelExploreIcon,
    path: null,
    disabled: true,
    chipLabel: 'Coming Soon',
    palette: {
      light: 'info.light',
      main: 'info.main'
    }
  },
  {
    key: 'identify',
    title: 'Identify Cards',
    description: 'Automatically match your cards and generate offers with one click using our KNN + OCR engine.',
    icon: QrCodeScannerIcon,
    path: null,
    disabled: true,
    chipLabel: 'Coming Soon',
    palette: {
      light: 'warning.light',
      main: 'warning.main'
    }
  },
  {
    key: 'develop',
    title: 'Developer APIs',
    description: 'Issue API keys to embed our tooling into your custom applications with secure access controls.',
    icon: ApiIcon,
    path: null,
    disabled: true,
    chipLabel: 'Coming Soon',
    palette: {
      light: 'info.light',
      main: 'info.dark'
    }
  },
  {
    key: 'credits',
    title: 'Add Credits',
    description: 'Add credits to your account to continue leveraging our premium automation and insights.',
    icon: CreditScoreIcon,
    path: null,
    disabled: true,
    chipLabel: 'Coming Soon',
    palette: {
      light: 'warning.light',
      main: 'warning.dark'
    }
  },
  {
    key: 'jobs',
    title: 'Jobs',
    description: 'Schedule automated syncs and data enrichment jobs (coming soon).',
    icon: WorkOutlineIcon,
    path: null,
    disabled: true,
    chipLabel: 'In Development',
    palette: {
      light: 'grey.200',
      main: 'text.secondary'
    }
  }
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { isAuthenticated, userClaims } = useAuthStatus()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleNavigate = (card) => {
    if (!card.path || card.disabled) return
    navigate(card.path)
  }

  return (
    <PageContainer maxWidth={1400} contentSx={{ gap: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          mb: { xs: 4, md: 6 },
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, rgba(25,118,210,0.18), rgba(0,200,180,0.16))',
          border: '1px solid',
          borderColor: 'rgba(255,255,255,0.15)',
          boxShadow: '0 25px 80px rgba(9, 14, 40, 0.25)',
          textAlign: 'center'
        }}
      >
        <Chip
          label="Dashboard"
          color="primary"
          variant="outlined"
          sx={{
            mb: 2,
            fontWeight: 600,
            borderRadius: 999,
            px: 1.5,
            backgroundColor: 'rgba(255,255,255,0.08)'
          }}
        />
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '2rem', sm: '2.4rem', md: '2.9rem' },
            fontWeight: 700,
            mb: 1,
            color: 'primary.contrastText'
          }}
        >
          Welcome back{userClaims?.given_name ? `, ${userClaims.given_name}` : ''}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            maxWidth: 720,
            mx: 'auto',
            color: 'text.primary',
            opacity: 0.88,
            fontWeight: 400,
            lineHeight: 1.5
          }}
        >
          Choose where to jump in. Everything you need to keep your trading card business humming is one click away.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2.5, md: 3.5 }}>
        {actionCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Grid item xs={12} sm={6} md={6} lg={3} key={card.key}>
              <Card
                elevation={3}
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid',
                  borderColor: 'rgba(255,255,255,0.06)',
                  boxShadow: '0 20px 45px rgba(5, 10, 35, 0.35)',
                  '&:hover': {
                    boxShadow: card.disabled ? undefined : '0 30px 65px rgba(5, 10, 35, 0.55)'
                  }
                }}
              >
                <CardActionArea
                  disabled={card.disabled}
                  onClick={() => handleNavigate(card)}
                  sx={{
                    height: '100%',
                    p: { xs: 2.5, sm: 3 },
                    display: 'flex',
                    alignItems: 'stretch',
                    textAlign: 'left',
                    opacity: card.disabled ? 0.6 : 1
                  }}
                >
                  <CardContent sx={{ p: 0, width: '100%' }}>
                    <Stack spacing={2.5}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '24px',
                          bgcolor: card.palette.light,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: card.palette.main,
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
                          fontSize: 0
                        }}
                      >
                        <IconComponent sx={{ fontSize: 32 }} />
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontSize: { xs: '1.25rem', sm: '1.35rem' },
                              fontWeight: 600
                            }}
                          >
                            {card.title}
                          </Typography>
                          {card.chipLabel && (
                            <Chip
                              label={card.chipLabel}
                              size="small"
                              color="default"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.08)',
                                color: 'text.secondary',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'text.secondary',
                            lineHeight: 1.6,
                            fontSize: { xs: '0.95rem', sm: '1rem' }
                          }}
                        >
                          {card.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </PageContainer>
  )
}


