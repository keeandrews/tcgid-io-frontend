import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { Link as RouterLink } from 'react-router-dom'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import useAuthStatus from '../hooks/useAuthStatus'

export default function Navigation() {
  const navigate = useNavigate()
  const { isAuthenticated, userClaims, refreshAuth } = useAuthStatus()
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTimeout, setMenuTimeout] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const containerRef = useRef(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userClaims')
    refreshAuth()
    setMenuOpen(false)
    setAnchorEl(null)
    // Dispatch event to update Navigation component
    window.dispatchEvent(new Event('authStateChange'))
    navigate('/signin')
  }

  const handleMenuOpen = (event) => {
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
    if (!menuOpen) {
      setAnchorEl(event.currentTarget)
      setMenuOpen(true)
    }
  }

  const handleMenuClose = () => {
    // Add a delay before closing to allow moving mouse to menu
    if (menuTimeout) {
      clearTimeout(menuTimeout)
    }
    const timeout = setTimeout(() => {
      setMenuOpen(false)
      setAnchorEl(null)
    }, 400)
    setMenuTimeout(timeout)
  }

  const handleMenuEnter = () => {
    // Cancel any pending close when mouse enters menu
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
  }

  const handleMenuLeave = () => {
    // Close menu when mouse leaves
    handleMenuClose()
  }

  const handleContainerEnter = () => {
    // Cancel any pending close when mouse is anywhere in container
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
  }

  const handleContainerLeave = () => {
    // Start close timer when leaving entire container
    handleMenuClose()
  }

  const handleUserMenuEnter = (event) => {
    // Cancel any pending close
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
    // Open menu when hovering over user name/icon
    if (!menuOpen) {
      setAnchorEl(event.currentTarget)
      setMenuOpen(true)
    }
  }

  const handleMenuItemClick = () => {
    // Close menu immediately when menu item is clicked
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
    setMenuOpen(false)
    setAnchorEl(null)
  }

  const toggleMobileDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setMobileDrawerOpen(open)
  }

  const handleDrawerLinkClick = () => {
    setMobileDrawerOpen(false)
  }

  // Mobile drawer content
  const mobileDrawerContent = (
    <Box
      sx={{ width: 280 }}
      role="presentation"
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary">
          TCGID.IO
        </Typography>
        <IconButton onClick={toggleMobileDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {!isAuthenticated ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signin" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signup" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem>
              <Stack direction="column" spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountCircleIcon color="primary" />
                  <Typography variant="subtitle1">
                    {userClaims?.given_name || 'User'}
                  </Typography>
                </Stack>
              </Stack>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/dashboard" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/account" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Account" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/inventory" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Inventory" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/offers" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Offers" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => { handleSignOut(); handleDrawerLinkClick(); }}>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          backgroundColor: 'rgba(5, 12, 27, 0.85)',
          backdropFilter: 'blur(18px)'
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 64, md: 72 },
            px: { xs: 2, sm: 3, md: 4 },
            gap: 2
          }}
        >
          <Box
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <svg
              width="200"
              height="48"
              viewBox="0 0 200 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ maxWidth: '100%' }}
            >
              <rect x="6" y="6" width="22" height="32" rx="4" stroke="white" strokeWidth="2" />
              <circle cx="17" cy="16" r="3" fill="white" />
              <rect x="12" y="25" width="10" height="2.4" rx="1.2" fill="white" />
              <text
                x="45"
                y="31"
                fill="white"
                fontSize="20"
                fontWeight="700"
                fontFamily="-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                letterSpacing="1"
              >
                TCGID.IO
              </text>
            </svg>
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              {!isAuthenticated && (
                <>
                  <Button color="inherit" component={RouterLink} to="/signin" variant="outlined" sx={{ borderRadius: '999px' }}>
                    Sign In
                  </Button>
                  <Button color="secondary" component={RouterLink} to="/signup" variant="contained">
                    Sign Up
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <Box
                  ref={containerRef}
                  onMouseEnter={handleContainerEnter}
                  onMouseLeave={handleContainerLeave}
                  sx={{
                    ml: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    onMouseEnter={handleUserMenuEnter}
                    sx={{
                      cursor: 'pointer',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 999,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      transition: 'background-color 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.12)',
                      },
                    }}
                  >
                    <AccountCircleIcon sx={{ fontSize: 28 }} />
                    <Typography variant="body1">
                      {userClaims?.given_name || 'User'}
                    </Typography>
                  </Stack>
                  <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => {
                      if (menuTimeout) {
                        clearTimeout(menuTimeout)
                        setMenuTimeout(null)
                      }
                      setMenuOpen(false)
                      setAnchorEl(null)
                    }}
                    MenuListProps={{
                      onMouseEnter: handleMenuEnter,
                      onMouseLeave: handleMenuLeave,
                    }}
                    PaperProps={{
                      onMouseEnter: handleMenuEnter,
                      onMouseLeave: handleMenuLeave,
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    disableAutoFocusItem
                    sx={{
                      mt: 0.5,
                      '& .MuiPaper-root': {
                        pointerEvents: 'auto',
                      },
                    }}
                  >
                    <MenuItem
                      component={RouterLink}
                      to="/dashboard"
                      onClick={handleMenuItemClick}
                    >
                      Dashboard
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/account"
                      onClick={handleMenuItemClick}
                    >
                      Account
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/inventory"
                      onClick={handleMenuItemClick}
                    >
                      Inventory
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/offers"
                      onClick={handleMenuItemClick}
                    >
                      Offers
                    </MenuItem>
                    <MenuItem onClick={() => {
                      handleMenuItemClick()
                      handleSignOut()
                    }}>
                      Sign Out
                    </MenuItem>
                  </Menu>
                </Box>
              )}
            </Stack>
          )}
          
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={toggleMobileDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={toggleMobileDrawer(false)}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        {mobileDrawerContent}
      </Drawer>
    </>
  )
}


