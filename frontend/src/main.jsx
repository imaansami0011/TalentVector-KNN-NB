import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""

const rootElement = document.getElementById('root')
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </StrictMode>,
  )
}

