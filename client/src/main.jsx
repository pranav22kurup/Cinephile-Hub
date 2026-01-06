import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { orange, deepOrange } from '@mui/material/colors'
import App from './App'
import { AuthProvider } from './context/AuthContext'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: orange[500] },
    secondary: { main: deepOrange[400] },
    background: {
      default: '#121212', // dark grey background
      paper: '#1e1e1e'    // slightly lighter for cards/surfaces
    }
  }
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
