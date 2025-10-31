import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './config/wagmi'
import GamePage from './pages/GamePage'
import PresalePage from './pages/PresalePage'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

function App() {
  // Detect subdomain to determine which page to show
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]

  // Check if we're on the presale subdomain
  const isPresale = subdomain === 'island' || hostname === 'island.binaria.fun'

  // If presale subdomain, render PresalePage with Web3 providers
  if (isPresale) {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <PresalePage />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    )
  }

  // Otherwise, render the main game
  return <GamePage />
}

export default App;