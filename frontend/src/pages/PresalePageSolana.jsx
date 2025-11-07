import React, { useState, useEffect, useRef, useMemo } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useX402PaymentSolana } from '../hooks/useX402PaymentSolana'
import { getExplorerUrl, SOLANA_NETWORK } from '../config/solana'
import { BRANDING } from '../config/branding'
import './PresalePage.css'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

export default function PresalePageSolana() {
  const { publicKey, connected } = useWallet()
  const { purchaseWithX402, status, error, txSignature } = useX402PaymentSolana()

  const [presaleData, setPresaleData] = useState({
    sold: 0,
    supply: 1000,
    price: 0.1, // Price in SOL
  })

  // Polling state
  const [isPolling, setIsPolling] = useState(true)
  const pollingIntervalRef = useRef(null)

  // Fetch presale status on mount and set up 1-second polling
  useEffect(() => {
    fetchPresaleStatus() // Initial fetch

    // Start polling every 1 second
    if (isPolling) {
      pollingIntervalRef.current = setInterval(() => {
        fetchPresaleStatus()
      }, 1000) // 1 second
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isPolling])

  // Stop polling when page is hidden (battery optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPolling(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Refresh immediately after successful purchase
  useEffect(() => {
    if (status === 'confirmed') {
      fetchPresaleStatus()
    }
  }, [status])

  const fetchPresaleStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/presale/status`)
      if (res.ok) {
        const data = await res.json()
        setPresaleData(data)
      }
    } catch (err) {
      return
    }
  }

  const handlePurchase = (quantity) => {
    purchaseWithX402(quantity)
  }

  const progress = Math.round((presaleData.sold / presaleData.supply) * 100)

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="presale-body">
      {/* Header */}
      <header className="presale-header">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="presale-title">{BRANDING.presaleTitle}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Wallet Connection Button */}
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Presale Section */}
          <section className="parchment" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#3d2817', textShadow: '0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 3px rgba(0, 0, 0, 0.2)' }}>
              Own Your Private Island
            </h2>
            <p style={{ marginBottom: '24px', fontSize: '13px', color: '#6b5639', lineHeight: '1.6' }}>
              {BRANDING.presaleTagline}
            </p>

            {/* Progress Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b5639', display: 'flex', justifyContent: 'space-between' }}>
                <span className="stat-label">islands sold</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>
                  {presaleData.sold} / {presaleData.supply}
                </span>
                <span className="stat-label">{progress}% complete</span>
              </div>
            </div>

            {/* Price Info */}
            <div className="info-section">
              <div className="stat-label" style={{ marginBottom: '4px' }}>price per island</div>
              <div className="stat-value" style={{ fontSize: '28px', color: '#9c27b0' }}>{presaleData.price} SOL</div>
            </div>

            {/* Purchase Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => handlePurchase(1)}
                disabled={!connected || status === 'requesting' || status === 'paying'}
                className="btn-parchment btn-success"
                style={{ flex: 1, padding: '14px' }}
              >
                Buy 1 Island
              </button>
              <button
                onClick={() => handlePurchase(5)}
                disabled={!connected || status === 'requesting' || status === 'paying'}
                className="btn-parchment btn-warning"
                style={{ flex: 1, padding: '14px' }}
              >
                Buy 5 Islands
              </button>
            </div>

            {/* Status Display */}
            {status !== 'idle' && (
              <div className={`status-box ${
                status === 'error' ? 'status-error' :
                status === 'confirmed' ? 'status-confirmed' :
                'status-requesting'
              }`}>
                {status === 'requesting' && '⏳ Requesting purchase...'}
                {status === 'paying' && '💳 Please approve transaction in your wallet...'}
                {status === 'confirming' && '⏳ Confirming transaction on Solana...'}
                {status === 'confirmed' && BRANDING.purchaseSuccessMessage}
                {status === 'error' && `✗ Error: ${error}`}

                {txSignature && (
                  <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
                    <a
                      href={getExplorerUrl(txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link"
                    >
                      View transaction on Solana Explorer →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* x402 Info */}
            <div className="info-section">
              <div className="info-title">⚡ Payment Protocol</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li className="info-text" style={{ marginBottom: '4px' }}>◆ Powered by x402 internet-native payments</li>
                <li className="info-text" style={{ marginBottom: '4px' }}>◆ Direct payments on Solana with SOL</li>
                <li className="info-text" style={{ marginBottom: '4px' }}>◆ Instant settlement and verification</li>
                <li className="info-text">◆ Secure and transparent on-chain transactions</li>
              </ul>
            </div>
          </section>

          {/* Info Section */}
          <aside className="parchment" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#3d2817', textShadow: '0 1px 0 rgba(255, 255, 255, 0.6), 0 2px 3px rgba(0, 0, 0, 0.2)' }}>
              ✦ What You Get
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="feature-icon">🏝️</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#9c27b0', fontSize: '14px', marginBottom: '4px' }}>Private Island</h4>
                  <p className="info-text">{BRANDING.islandDescription}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="feature-icon">👑</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '14px', marginBottom: '4px' }}>Exclusive Access</h4>
                  <p className="info-text">Early access to game features and exclusive content</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="feature-icon">💰</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#d4af37', fontSize: '14px', marginBottom: '4px' }}>Play to Earn</h4>
                  <p className="info-text">Earn passive income by upgrading your island and doing quests.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="feature-icon">🎨</div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#8b6f47', fontSize: '14px', marginBottom: '4px' }}>Customization</h4>
                  <p className="info-text">Full control over your island's appearance and features</p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#3d2817', fontSize: '14px' }}>📜 Roadmap Highlights</h4>
              <ol style={{ marginLeft: '24px', color: '#6b5639', fontSize: '12px', lineHeight: '1.8' }}>
                <li>— Island Presale</li>
                <li>— Early access for holders</li>
                <li>— Public beta</li>
                <li>— Marketplace & trading</li>
              </ol>
            </div>

            <div className="info-section" style={{ background: 'rgba(156, 39, 176, 0.15)' }}>
              <div className="info-title">Why Solana + x402?</div>
              <p className="info-text">
                Solana's high speed and low fees combined with x402's open payment standard enable instant,
                internet-native payments directly over HTTP. Perfect for web3 games with fast settlement.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: '1200px', margin: '6px auto 0', padding: '2px', textAlign: 'center', fontSize: '12px', color: '#8b6f47' }}>
        <p style={{ marginBottom: '8px' }}>{BRANDING.presaleFooterSolana}</p>
        <p>
          <a href={BRANDING.mainUrl} className="footer-link">
            {BRANDING.returnToMainPageText}
          </a>
        </p>
      </footer>
    </div>
  )
}
