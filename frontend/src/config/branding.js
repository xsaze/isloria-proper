/**
 * Centralized Branding Configuration
 *
 * This file contains all project names, URLs, and branding text.
 * Update these values to rebrand the entire application.
 *
 * Usage:
 * import { BRANDING } from '@/config/branding'
 * <h1>{BRANDING.projectName}</h1>
 */

export const BRANDING = {
  // ========================================
  // PROJECT NAMES
  // ========================================

  /** Main project name (displayed throughout the app) */
  projectName: 'Binaria',

  /** Alternative/legacy project name */
  projectNameAlt: 'Binaria',

  /** Game/metaverse name for descriptions */
  metaverseName: 'Binaria metaverse',

  // ========================================
  // DOMAINS & URLS
  // ========================================

  /** Main domain (without protocol) */
  mainDomain: 'binaria.fun',

  /** Presale subdomain (without protocol) */
  presaleDomain: 'island.binaria.fun',

  /** Main website URL */
  mainUrl: 'https://binaria.fun',

  /** Presale website URL */
  presaleUrl: 'https://island.binaria.fun',

  // ========================================
  // SOCIAL MEDIA
  // ========================================

  /** Twitter/X handle (without @) */
  twitterHandle: 'Binariafun',

  /** Twitter/X profile URL */
  twitterUrl: 'https://x.com/Binariafun',

  // ========================================
  // SEO & META TAGS
  // ========================================

  /** Browser tab title */
  pageTitle: 'Binaria',

  /** SEO meta title */
  seoTitle: 'Binaria - Web3 Game',

  /** SEO meta description */
  seoDescription: 'An immersive Web3 game on Solana. Build your island, explore the world, and join the adventure.',

  /** SEO keywords */
  seoKeywords: 'Binaria, Web3 game, Solana, SOL, blockchain game, crypto game, pumpfun',

  /** Open Graph title (for social sharing) */
  ogTitle: 'Binaria - Web3 Game',

  /** Open Graph description */
  ogDescription: 'An immersive Web3 game on Solana. Build your island, explore the world, and join the adventure.',

  /** Twitter card title */
  twitterCardTitle: 'Binaria - Web3 Game',

  /** Twitter card description */
  twitterCardDescription: 'An immersive Web3 game on Solana. Build your island, explore the world, and join the adventure.',

  // ========================================
  // PAGE-SPECIFIC CONTENT
  // ========================================

  /** Presale page title */
  presaleTitle: 'Binaria Island Presale',

  /** Presale tagline */
  presaleTagline: 'Secure exclusive access to Binaria with your own Private Island. Limited supply available during presale.',

  /** Island description for presale */
  islandDescription: 'Your own customizable island in the Binaria metaverse',

  /** Welcome message after purchase */
  welcomeMessage: 'Welcome to Binaria!',

  /** Success message after purchase */
  purchaseSuccessMessage: '✓ Purchase confirmed! Welcome to Binaria!',

  // ========================================
  // FOOTER & MISC
  // ========================================

  /** Presale footer text (Solana) */
  presaleFooterSolana: 'Binaria — Presale powered by x402 protocol on Solana',

  /** Presale footer text (BSC) */
  presaleFooterBSC: 'Binaria — Presale powered by x402 protocol',

  /** Main page link text */
  returnToMainPageText: '« Return to Main Page',

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get full presale title with project name
   * @returns {string} Full presale title
   */
  getPresaleTitle() {
    return `${this.projectName} Island Presale`;
  },

  /**
   * Get metaverse description with project name
   * @returns {string} Metaverse description
   */
  getMetaverseDescription() {
    return `Your own customizable island in the ${this.metaverseName}`;
  },

  /**
   * Check if current hostname is presale domain
   * @param {string} hostname - Current window.location.hostname
   * @returns {boolean} True if on presale domain
   */
  isPresaleDomain(hostname) {
    return hostname.includes('island.') || hostname === this.presaleDomain;
  }
};

// Export individual values for convenience
export const {
  projectName,
  projectNameAlt,
  metaverseName,
  mainDomain,
  presaleDomain,
  mainUrl,
  presaleUrl,
  twitterHandle,
  twitterUrl,
  pageTitle,
  seoTitle,
  seoDescription,
  presaleTitle,
  welcomeMessage
} = BRANDING;

// Default export
export default BRANDING;
