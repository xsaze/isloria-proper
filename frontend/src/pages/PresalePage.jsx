import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useX402Payment } from '../hooks/useX402Payment'
import './PresalePage.css'

export default function PresalePage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { purchaseWithX402, status, error, txHash } = useX402Payment()

  const [presaleData, setPresaleData] = useState({
    sold: 0,
    supply: 1000,
    price: 100000,
  })

  // Fetch presale status on mount
  useEffect(() => {
    fetchPresaleStatus()
  }, [])

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
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="presale-body">
      {/* Header */}
      <header className="presale-header">
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 className="presale-title">Binaria Island Presale</h1>
          <div>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="wallet-address">
                  {formatAddress(address)}
                </div>
                <button
                  onClick={() => disconnect()}
                  className="btn-parchment btn-danger"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="btn-parchment"
              >
                Connect Wallet
              </button>
            )}
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
              Secure exclusive access to Binaria with your own Private Island. Limited supply available during presale.
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
              <div className="stat-value" style={{ fontSize: '28px', color: '#22c55e' }}>{presaleData.price} $BNRA</div>
            </div>

            {/* Purchase Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => handlePurchase(1)}
                disabled={!isConnected || status === 'requesting' || status === 'paying'}
                className="btn-parchment btn-success"
                style={{ flex: 1, padding: '14px' }}
              >
                Buy 1 Island
              </button>
              <button
                onClick={() => handlePurchase(5)}
                disabled={!isConnected || status === 'requesting' || status === 'paying'}
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
                {status === 'paying' && '💳 Please confirm transaction in your wallet...'}
                {status === 'confirming' && '⏳ Confirming transaction...'}
                {status === 'confirmed' && '✓ Purchase confirmed! Welcome to Isloria!'}
                {status === 'error' && `✗ Error: ${error}`}

                {txHash && (
                  <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.8 }}>
                    <a
                      href={`https://bscscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-link"
                    >
                      View transaction on BscScan →
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
                <li className="info-text" style={{ marginBottom: '4px' }}>◆ Direct token transfers on BSC (Binance Smart Chain)</li>
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
                  <h4 style={{ fontWeight: 'bold', color: '#22c55e', fontSize: '14px', marginBottom: '4px' }}>Private Island</h4>
                  <p className="info-text">Your own customizable island in the Binaria metaverse</p>
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
                  <h4 style={{ fontWeight: 'bold', color: '#d4af37', fontSize: '14px', marginBottom: '4px' }}>Play to earn</h4>
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

            <div className="info-section" style={{ background: 'rgba(139, 111, 78, 0.15)' }}>
              <div className="info-title">Why x402?</div>
              <p className="info-text">
                x402 is an open payment standard that enables instant, internet-native payments directly over HTTP.
                It's perfect for web3 games, offering fast settlement and low fees.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: '1200px', margin: '32px auto 0', padding: '24px', textAlign: 'center', fontSize: '12px', color: '#8b6f47' }}>
        <p style={{ marginBottom: '8px' }}>Binaria — Presale powered by x402 protocol</p>
        <p>
          <a href="https://binaria.fun" className="footer-link">
            « Return to Main Game
          </a>
        </p>
      </footer>
    </div>
  )
}
