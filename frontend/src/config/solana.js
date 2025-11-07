import { clusterApiUrl } from '@solana/web3.js'

// Solana cluster configuration
export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet' // 'devnet' | 'testnet' | 'mainnet-beta'
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK)

// Presale wallet address (will receive SOL payments)
export const PRESALE_WALLET_ADDRESS = import.meta.env.VITE_PRESALE_WALLET_ADDRESS || 'YOUR_SOLANA_WALLET_ADDRESS'

// Token mint address (if using SPL token - update after token deployment)
export const TOKEN_MINT_ADDRESS = import.meta.env.VITE_TOKEN_MINT_ADDRESS || null

// Explorer base URL for transaction links
export const getExplorerUrl = (signature, cluster = SOLANA_NETWORK) => {
  const baseUrl = 'https://explorer.solana.com'
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `${baseUrl}/tx/${signature}${clusterParam}`
}

// Wallet adapter configuration
export const WALLET_ADAPTER_CONFIG = {
  autoConnect: true,
  // You can customize which wallets to show
  // By default, it will show all available wallets
}
