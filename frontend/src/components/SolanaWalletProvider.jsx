import React, { useMemo } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { SOLANA_RPC_URL, SOLANA_NETWORK, WALLET_ADAPTER_CONFIG } from '../config/solana'

/**
 * Solana Wallet Provider wrapper component
 * Handles wallet connection for Phantom, Solflare, Torus, Ledger, etc.
 */
export default function SolanaWalletProvider({ children }) {
  // Convert our network string to WalletAdapterNetwork enum
  const network = useMemo(() => {
    switch (SOLANA_NETWORK) {
      case 'mainnet-beta':
        return WalletAdapterNetwork.Mainnet
      case 'testnet':
        return WalletAdapterNetwork.Testnet
      case 'devnet':
      default:
        return WalletAdapterNetwork.Devnet
    }
  }, [])

  // Configure wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [network]
  )

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect={WALLET_ADAPTER_CONFIG.autoConnect}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
