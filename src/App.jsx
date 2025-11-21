import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Navigation from './components/Navigation'
import Privacy from './pages/Privacy'
import Inventory from './pages/Inventory'
import EditInventory from './pages/EditInventory'
import CreateBatch from './pages/CreateBatch'
import CreateInventory from './pages/CreateInventory'
import InventoryNew from './pages/InventoryNew'
import Offers from './pages/Offers'
import EditOffer from './pages/EditOffer'
import Account from './pages/Account'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import useAuthStatus from './hooks/useAuthStatus'

// Component to redirect /integrations to /account while preserving query params
function IntegrationsRedirect() {
  const location = useLocation()
  return <Navigate to={`/account${location.search}`} replace />
}

function RootRedirect() {
  const { isAuthenticated } = useAuthStatus()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/signin'} replace />
}

export default function App() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary'
      }}
    >
      <Navigation />
      <Container
        component="main"
        maxWidth={false}
        disableGutters
        sx={{
          flexGrow: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory/new" element={<InventoryNew />} />
          <Route path="/inventory/:sku" element={<EditInventory />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offers/:offerId" element={<EditOffer />} />
          <Route path="/create-batch" element={<CreateBatch />} />
          <Route path="/create-inventory" element={<CreateInventory />} />
          <Route path="/account" element={<Account />} />
          <Route path="/integrations" element={<IntegrationsRedirect />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset" element={<ResetPassword />} />
        </Routes>
      </Container>
    </Box>
  )
}


