import { useState, useEffect } from 'react';
import { BRANDING } from '../config/branding';
import './BottomBar.css';

export const BottomBar = ({ stats = {} }) => {
  const {
    marketCap = 0,
    totalNPCs = 0,
    islandSize = 0,
    activePlayers = 0,
    tokenAddress = 'coming soon'
  } = stats;

  const [displayMC, setDisplayMC] = useState('...');
  const [isMobile, setIsMobile] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if (marketCap !== null && marketCap !== undefined) {
      setDisplayMC(marketCap.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }));
    }
  }, [marketCap]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Copy CA to clipboard
  const handleCopyCA = async () => {
    if (tokenAddress && tokenAddress !== 'coming soon') {
      try {
        await navigator.clipboard.writeText(tokenAddress);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Social links component (reusable)
  const socialLinks = (
    <>
      <a href={BRANDING.twitterUrl} className="social-link" title="X" target="_blank"
        rel="noopener noreferrer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a href="https://x.com/i/communities/1986955894702137619" className="social-link" title="Community" target="_blank"
        rel="noopener noreferrer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </a>
      <a
        href={`https://pump.fun/coin/${tokenAddress}`}
        className="social-link"
        title="Pumpfun"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
  
  <g stroke="#353535ff" stroke-width="8" transform="rotate(315 100 50)">
    <path d="M 100 10 L 50 10 A 40 40 0 0 0 50 90 L 100 90 Z" fill="#2E8B57" />
    
    <path d="M 100 10 L 150 10 A 40 40 0 0 1 150 90 L 100 90 Z" fill="#FFFFFF" />
  </g>
</svg>
      </a>
    </>
  );

  return (
    <>
      {/* Mobile: Social icons in top-left corner */}
      {isMobile && (
        <div className="social-links-mobile">
          {socialLinks}
        </div>
      )}

      {/* Bottom bar */}
      <div className="bottom-bar">
        {/* Desktop: Show social links in bottom bar */}
        {!isMobile && (
          <div className="bottom-bar-section social-links">
            {socialLinks}
          </div>
        )}

        {/* Stats section */}
        <div className="bottom-bar-section stats">
          {/* CA stat - always visible */}
          <div className="stat-item ca-container">
            <span className="stat-label">CA </span>
            <span
              className="stat-value ca-value"
              onClick={handleCopyCA}
              title="Click to copy"
            >
              {tokenAddress}
            </span>
            {showCopied && (
              <div className="copied-popup">
                Copied to clipboard!
              </div>
            )}
          </div>

          {/* Desktop: Show divider and market cap */}
          {!isMobile && (
            <>
              <div className="stat-divider">|</div>
              <div className="stat-item">
                <span className="stat-label">market cap </span>
                <span className="stat-value">${displayMC}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
