import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { flushQueue } from './lib/offlineQueue'
import toast from 'react-hot-toast'
import SplashScreen from './components/SplashScreen'
import LandingPage from './pages/LandingPage'
import RegisterWizard from './pages/RegisterWizard'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import MenuManagement from './pages/MenuManagement'
import StaffManagement from './pages/StaffManagement'
import TableManagement from './pages/TableManagement'
import ReportsPage from './pages/ReportsPage'
import MarketingAI from './pages/MarketingAI'
import CashierDine from './pages/CashierDine'
import CashierDelivery from './pages/CashierDelivery'
import CaptainPanel from './pages/CaptainPanel'
import PrintStation from './pages/PrintStation'
import PrinterManagement from './pages/PrinterManagement'
import RegisterPage from './saas/RegisterPage'
import OnboardingWizard from './saas/OnboardingWizard'
import PlanPayment from './saas/PlanPayment'
import MenuUploadStep from './saas/MenuUploadStep'
import TenantPortal from './saas/TenantPortal'
import TenantAdminWrapper from './saas/TenantAdminWrapper'
import TenantCashierWrapper from './saas/TenantCashierWrapper'
import TenantCaptainWrapper from './saas/TenantCaptainWrapper'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />
  }

  return children
}

const API_BASE = import.meta.env.VITE_SAAS_API_URL || 'http://localhost:4000'

function findAnyToken() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.endsWith('_token')) {
        return localStorage.getItem(key)
      }
    }
  } catch {}
  return null
}

function App() {
  useEffect(() => {
    const handleOnline = async () => {
      const token = findAnyToken()
      const { flushed } = await flushQueue(API_BASE, token)
      if (flushed > 0) {
        toast.success(`${flushed} offline order(s) synced`)
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <SplashScreen>
          <Routes>
            <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-old" element={<RegisterWizard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          <Route path="/onboarding/payment" element={<PlanPayment />} />
          <Route path="/onboarding/menu-upload" element={<MenuUploadStep />} />
          <Route path="/tenant/:slug" element={<TenantPortal />} />
          <Route path="/tenant/:slug/admin/*" element={<TenantAdminWrapper />} />
          <Route path="/tenant/:slug/cashier/:stationId" element={<TenantCashierWrapper />} />
          <Route path="/tenant/:slug/captain" element={<TenantCaptainWrapper />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/menu" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MenuManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/staff" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StaffManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/tables" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TableManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/marketing" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MarketingAI />
            </ProtectedRoute>
          } />
          <Route path="/admin/printers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PrinterManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/cashier1" element={
            <ProtectedRoute allowedRoles={['cashier1', 'admin']}>
              <CashierDine />
            </ProtectedRoute>
          } />
          
          <Route path="/cashier2" element={
            <ProtectedRoute allowedRoles={['cashier2', 'admin']}>
              <CashierDelivery />
            </ProtectedRoute>
          } />
          
          <Route path="/captain" element={
            <ProtectedRoute allowedRoles={['captain', 'admin']}>
              <CaptainPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/print-station" element={<PrintStation />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SplashScreen>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
