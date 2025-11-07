import { useEffect } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './config/wagmi'
import { BRANDING } from './config/branding'
import GamePage from './pages/GamePage'
import PresalePage from './pages/PresalePage'
import PresalePageSolana from './pages/PresalePageSolana'
import SolanaWalletProvider from './components/SolanaWalletProvider'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
  // Suppress Chrome extension errors in console
  useEffect(() => {
    const originalError = console.error
    console.error = (...args) => {
      // Filter out known Chrome extension / wallet errors
      const message = args[0]?.toString() || ''
      if (
        message.includes('chrome.runtime.sendMessage') ||
        message.includes('Extension ID') ||
        message.includes('inpage.js')
      ) {
        return // Suppress these errors
      }
      originalError.apply(console, args)
    }

    // Suppress unhandled promise rejections from wallet extensions
    const handleRejection = (event) => {
      const message = event.reason?.message || event.reason?.toString() || ''
      if (
        message.includes('chrome.runtime.sendMessage') ||
        message.includes('Extension ID')
      ) {
        event.preventDefault() // Suppress the error
      }
    }

    window.addEventListener('unhandledrejection', handleRejection)

    return () => {
      console.error = originalError
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])
  // Detect subdomain to determine which page to show
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]

  // Check if we're on the presale subdomain
  const isPresale = BRANDING.isPresaleDomain(hostname)

  // If presale subdomain, render Solana PresalePage (PRIMARY)
  // BSC version kept as backup in PresalePage.jsx
  if (isPresale) {
    return (
      <SolanaWalletProvider>
        <PresalePageSolana />
      </SolanaWalletProvider>
    )
  }

  // Otherwise, render the main game
  return <GamePage />
}

export default App;