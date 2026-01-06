import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material'
import Home from './pages/Home'
import Search from './pages/Search'
import AddMovie from './pages/Admin/AddMovie'
import EditMovie from './pages/Admin/EditMovie'
import Login from './pages/Login'
import ProtectedRoute from './routes/ProtectedRoute'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { logout, isAuthenticated, user } = useAuth()

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Cinephile Hub</Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/search">Search</Button>
          {user?.role === 'admin' && (
            <Button color="inherit" component={Link} to="/admin/add">Add Movie</Button>
          )}
          {!isAuthenticated ? (
            <Button color="inherit" component={Link} to="/login">Login</Button>
          ) : (
            <Button color="inherit" onClick={logout}>Logout</Button>
          )}
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 3 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
          <Route path="/admin/add" element={<ProtectedRoute role="admin"><AddMovie /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute role="admin"><EditMovie /></ProtectedRoute>} />
        </Routes>
      </Container>
    </>
  )
}
