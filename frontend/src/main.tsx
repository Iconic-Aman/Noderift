import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Editor from './pages/editor'
import { Login } from './pages/login'
import { Dashboard } from './pages/dashboard'
import { Credentials } from './pages/credentials'
import { Landing } from './pages/landing'
import { OAuthSuccess } from './pages/oauth-success'
import History from './pages/history'
import { ReportVulnerability } from './pages/report-vulnerability'
import { Privacy } from './pages/privacy'
import { Terms } from './pages/terms'
import './index.css'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('noderift_token')
  return token ? <>{children}</> : <Navigate to="/login" />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Landing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/privacy-policy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/terms-of-service" element={<Terms />} />
        <Route path="/report-vulnerability" element={<PrivateRoute><ReportVulnerability /></PrivateRoute>} />
        <Route path="/vulnerability" element={<PrivateRoute><ReportVulnerability /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/credentials" element={<PrivateRoute><Credentials /></PrivateRoute>} />
        <Route path="/editor/:id" element={<PrivateRoute><Editor /></PrivateRoute>} />
        <Route path="/history/:id" element={<PrivateRoute><History /></PrivateRoute>} />
        <Route path="/oauth/success" element={<OAuthSuccess />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
