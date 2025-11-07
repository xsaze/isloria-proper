import express from 'express';
import crypto from 'crypto';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const router = express.Router();

// Create Solana connection
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ||
  (SOLANA_NETWORK === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : `https://api.${SOLANA_NETWORK}.solana.com`);

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// In-memory storage (replace with database in production)
const presaleState = {
  sold: 0,
  supply: parseInt(process.env.PRESALE_TOTAL_SUPPLY) || 1000,
  price: parseFloat(process.env.PRESALE_PRICE) || 0.1, // Price in SOL per island
  tokensPerIsland: parseInt(process.env.TOKENS_PER_ISLAND) || 200000, // Token reward per island
  tokenMintAddress: process.env.TOKEN_MINT_ADDRESS || null, // SPL token mint address
  purchases: [], // Array of { address, quantity, txSignature, timestamp, tokensEarned }
  challenges: new Map(), // challenge_id -> challenge data
};

/**
 * GET /api/presale/active
 * Returns whether presale is currently active
 */
router.get('/active', (req, res) => {
  const isActive = process.env.AUTO_START_PRICE_POLLING === 'true';
  res.json({
    active: isActive,
    message: isActive ? 'Presale is active' : 'Presale is not yet active',
  });
});

/**
 * GET /api/presale/status
 * Returns current presale statistics
 */
router.get('/status', (req, res) => {
  res.json({
    sold: presaleState.sold,
    supply: presaleState.supply,
    price: presaleState.price,
    remaining: presaleState.supply - presaleState.sold,
    progress: Math.round((presaleState.sold / presaleState.supply) * 100),
    tokensPerIsland: presaleState.tokensPerIsland,
    tokenMintAddress: presaleState.tokenMintAddress,
    network: SOLANA_NETWORK,
  });
});

/**
 * GET /api/presale/user/:address
 * Get user's purchase history
 */
router.get('/user/:address', (req, res) => {
  const { address } = req.params;
  const userPurchases = presaleState.purchases.filter(
    p => p.address === address
  );

  const totalPurchased = userPurchases.reduce((sum, p) => sum + p.quantity, 0);

  res.json({
    address,
    totalPurchased,
    purchases: userPurchases,
  });
});

/**
 * POST /api/presale/purchase
 * Initiate purchase - Returns HTTP 402 with x402 payment challenge
 */
router.post('/purchase', (req, res) => {
  const { quantity, address } = req.body;

  // Validation
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  // Validate Solana address
  try {
    new PublicKey(address);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid Solana wallet address' });
  }

  // Check availability
  if (presaleState.sold + quantity > presaleState.supply) {
    return res.status(400).json({
      error: 'Not enough supply remaining',
      remaining: presaleState.supply - presaleState.sold
    });
  }

  // Calculate total cost in SOL
  const totalAmount = (quantity * presaleState.price).toFixed(9); // SOL has 9 decimals

  // Generate payment challenge (x402 protocol)
  const challengeId = crypto.randomUUID();
  const challenge = {
    challenge_id: challengeId,
    amount: totalAmount,
    currency: 'SOL',
    chain: SOLANA_NETWORK,
    payment_address: process.env.PRESALE_WALLET_ADDRESS || 'YOUR_SOLANA_WALLET_ADDRESS',
    quantity,
    buyer_address: address,
    expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
    created_at: Date.now(),
  };

  // Store challenge
  presaleState.challenges.set(challengeId, challenge);

  // Clean up expired challenges (older than 15 minutes)
  const now = Date.now();
  for (const [id, ch] of presaleState.challenges.entries()) {
    if (ch.expires_at < now) {
      presaleState.challenges.delete(id);
    }
  }

  // Return HTTP 402 with x402 payment challenge
  res.status(402)
    .set('X-PAYMENT', JSON.stringify(challenge))
    .set('X-Payment-Required', 'true')
    .json({
      message: 'Payment Required',
      challenge_id: challengeId,
      amount: totalAmount,
      quantity,
    });
});

/**
 * POST /api/presale/verify
 * Verify payment and settle purchase
 *
 * Verifies Solana transaction on-chain:
 * 1. Verify transaction exists and is confirmed
 * 2. Verify sender, recipient, and amount
 * 3. Record purchase and update state
 */
router.post('/verify', async (req, res) => {
  const { challenge_id, tx_signature, address } = req.body;

  // Validation
  if (!challenge_id || !tx_signature || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get challenge
  const challenge = presaleState.challenges.get(challenge_id);
  if (!challenge) {
    return res.status(404).json({ error: 'Challenge not found or expired' });
  }

  // Check if challenge expired
  if (challenge.expires_at < Date.now()) {
    presaleState.challenges.delete(challenge_id);
    return res.status(400).json({ error: 'Challenge expired' });
  }

  // Verify buyer address matches
  if (challenge.buyer_address !== address) {
    return res.status(403).json({ error: 'Address mismatch' });
  }

  try {
    // Step 1: Get transaction from Solana
    const transaction = await connection.getTransaction(tx_signature, {
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return res.status(400).json({
        error: 'Transaction not found on Solana blockchain. Please wait for confirmation.'
      });
    }

    // Step 2: Verify transaction was successful
    if (transaction.meta?.err) {
      return res.status(400).json({
        error: 'Transaction failed on blockchain',
        details: transaction.meta.err
      });
    }

    // Step 3: Parse transaction to verify details
    const { message } = transaction.transaction;
    const accountKeys = message.staticAccountKeys || message.accountKeys;

    // Get sender (fee payer - first account)
    const senderPubkey = accountKeys[0].toBase58();

    // Verify sender matches buyer
    if (senderPubkey !== challenge.buyer_address) {
      return res.status(400).json({
        error: 'Transaction sender does not match buyer address',
        expected: challenge.buyer_address,
        actual: senderPubkey
      });
    }

    // Step 4: Verify amount transferred
    // Look through preBalances and postBalances to find the transfer
    const expectedRecipient = new PublicKey(challenge.payment_address);
    let recipientIndex = -1;

    for (let i = 0; i < accountKeys.length; i++) {
      if (accountKeys[i].equals(expectedRecipient)) {
        recipientIndex = i;
        break;
      }
    }

    if (recipientIndex === -1) {
      return res.status(400).json({
        error: 'Recipient address not found in transaction',
        expected: challenge.payment_address
      });
    }

    // Calculate amount transferred (difference in recipient's balance)
    const preBalance = transaction.meta.preBalances[recipientIndex];
    const postBalance = transaction.meta.postBalances[recipientIndex];
    const transferredLamports = postBalance - preBalance;
    const transferredSOL = transferredLamports / LAMPORTS_PER_SOL;

    // Expected amount with small tolerance (0.001 SOL for fees)
    const expectedSOL = parseFloat(challenge.amount);
    const tolerance = 0.001;

    if (transferredSOL < expectedSOL - tolerance) {
      return res.status(400).json({
        error: 'Insufficient payment amount',
        expected: expectedSOL.toFixed(9) + ' SOL',
        actual: transferredSOL.toFixed(9) + ' SOL'
      });
    }

  } catch (error) {
    console.error('Solana verification error:', error);
    return res.status(500).json({
      error: 'Failed to verify transaction on Solana',
      details: error.message
    });
  }

  // Calculate token rewards
  const tokensEarned = challenge.quantity * presaleState.tokensPerIsland;

  // Record purchase
  const purchase = {
    address: challenge.buyer_address,
    quantity: challenge.quantity,
    amount: challenge.amount,
    txSignature: tx_signature,
    timestamp: Date.now(),
    challenge_id,
    tokensEarned, // Track tokens earned for this purchase
  };

  presaleState.purchases.push(purchase);
  presaleState.sold += challenge.quantity;

  // Clean up challenge
  presaleState.challenges.delete(challenge_id);

  // TODO: In production:
  // - Send SPL tokens to buyer (tokensEarned amount)
  // - Update database with purchase record
  // - Send confirmation email with token details
  // - Emit event to notify frontend
  // - Consider using a token distribution service or smart contract

  res.json({
    success: true,
    message: 'Purchase confirmed!',
    purchase: {
      quantity: purchase.quantity,
      txSignature: purchase.txSignature,
      timestamp: purchase.timestamp,
      tokensEarned: purchase.tokensEarned,
      tokenMintAddress: presaleState.tokenMintAddress,
    },
    presale: {
      sold: presaleState.sold,
      remaining: presaleState.supply - presaleState.sold,
      tokensPerIsland: presaleState.tokensPerIsland,
    },
  });
});

/**
 * GET /api/presale/purchases
 * Get all purchases (admin endpoint - should be protected in production)
 */
router.get('/purchases', (req, res) => {
  res.json({
    total: presaleState.purchases.length,
    purchases: presaleState.purchases,
  });
});

export default router;
