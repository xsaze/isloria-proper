import { useState, useEffect } from 'react';
import './BottomBar.css';

export const BottomBar = ({ stats = {} }) => {
  const {
    marketCap = 0,
    totalNPCs = 0,
    islandSize = 0,
    activePlayers = 0,
    tokenAddress = '...pump'
  } = stats;

  const [displayMC, setDisplayMC] = useState('...');

  useEffect(() => {
    if (marketCap !== null && marketCap !== undefined) {
      setDisplayMC(marketCap.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }));
    }
  }, [marketCap]);

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-section social-links">
        <a href="https://x.com/isloria_fun" className="social-link" title="X">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </a>
        <a href="https://x.com/i/communities/1982498799940436211" className="social-link" title="Community">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
          </svg>
        </a>
        <a
          href={`https://pump.fun/coin/${tokenAddress}`}
          className="social-link"
          title="Pump.fun"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="12" rx="8" ry="4" transform="rotate(-45 12 12)"/>
            <line x1="8" y1="8" x2="16" y2="16" strokeWidth="2"/>
          </svg>
        </a>
      </div>

      <div className="bottom-bar-section stats">
        <div className="stat-item">
          <span className="stat-label">CA:</span>
          <span className="stat-value">{tokenAddress}</span>
        </div>
        <div className="stat-divider">|</div>
        <div className="stat-item">
          <span className="stat-label">market cap:</span>
          <span className="stat-value">${displayMC}</span>
        </div>
      </div>
    </div>
  );
};
