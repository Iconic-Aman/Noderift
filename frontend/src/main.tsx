import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Editor from './pages/editor'
import { Login } from './pages/login'
import { Dashboard } from './pages/dashboard'
import './index.css'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('noderift_token')
  return token ? <>{children}</> : <Navigate to="/login" />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/editor/:id" element={<PrivateRoute><Editor /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
