import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// In-memory storage (replace with database in production)
const presaleState = {
  sold: 0,
  supply: parseInt(process.env.PRESALE_TOTAL_SUPPLY) || 5000,
  price: parseInt(process.env.PRESALE_PRICE) || 100,
  purchases: [], // Array of { address, quantity, txHash, timestamp }
  challenges: new Map(), // challenge_id -> challenge data
};

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
  });
});

/**
 * GET /api/presale/user/:address
 * Get user's purchase history
 */
router.get('/user/:address', (req, res) => {
  const { address } = req.params;
  const userPurchases = presaleState.purchases.filter(
    p => p.address.toLowerCase() === address.toLowerCase()
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

  if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  // Check availability
  if (presaleState.sold + quantity > presaleState.supply) {
    return res.status(400).json({
      error: 'Not enough supply remaining',
      remaining: presaleState.supply - presaleState.sold
    });
  }

  // Calculate total cost
  const totalAmount = quantity * presaleState.price;

  // Generate payment challenge (x402 protocol)
  const challengeId = crypto.randomUUID();
  const challenge = {
    challenge_id: challengeId,
    amount: totalAmount.toString(),
    currency: process.env.TOKEN_SYMBOL || 'ISLORIA',
    decimals: 18,
    chain: 'bsc',
    payment_address: process.env.PRESALE_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
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

  console.log('📄 x402 Payment Challenge Created:', {
    challengeId,
    quantity,
    amount: totalAmount,
    buyer: address,
  });

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
 * In production, this should:
 * 1. Verify transaction on-chain using BSC RPC
 * 2. Call x402 facilitator /verify endpoint
 * 3. Call x402 facilitator /settle endpoint
 * 4. Mint/assign the purchased items
 */
router.post('/verify', async (req, res) => {
  const { challenge_id, tx_hash, address } = req.body;

  // Validation
  if (!challenge_id || !tx_hash || !address) {
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
  if (challenge.buyer_address.toLowerCase() !== address.toLowerCase()) {
    return res.status(403).json({ error: 'Address mismatch' });
  }

  console.log('🔍 Verifying payment:', {
    challenge_id,
    tx_hash,
    address,
  });

  // TODO: In production, verify transaction on BSC
  // Example using viem/ethers:
  // const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC_URL);
  // const tx = await provider.getTransaction(tx_hash);
  // Verify tx.to === challenge.payment_address
  // Verify tx.value or token transfer amount === challenge.amount

  // TODO: Call x402 facilitator /verify endpoint
  // const facilitatorUrl = process.env.X402_FACILITATOR_URL;
  // const verifyRes = await fetch(`${facilitatorUrl}/verify`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ challenge_id, tx_hash, chain: 'bsc' })
  // });

  // For demo: Simulate successful verification
  const verified = true;

  if (!verified) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  // TODO: Call x402 facilitator /settle endpoint
  // const settleRes = await fetch(`${facilitatorUrl}/settle`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ challenge_id })
  // });

  // Record purchase
  const purchase = {
    address: challenge.buyer_address,
    quantity: challenge.quantity,
    amount: challenge.amount,
    txHash: tx_hash,
    timestamp: Date.now(),
    challenge_id,
  };

  presaleState.purchases.push(purchase);
  presaleState.sold += challenge.quantity;

  // Clean up challenge
  presaleState.challenges.delete(challenge_id);

  console.log('✅ Purchase confirmed:', {
    address: purchase.address,
    quantity: purchase.quantity,
    totalSold: presaleState.sold,
  });

  // TODO: In production:
  // - Mint NFT or assign game access
  // - Update database
  // - Send confirmation email
  // - Emit event to notify frontend

  res.json({
    success: true,
    message: 'Purchase confirmed!',
    purchase: {
      quantity: purchase.quantity,
      txHash: purchase.txHash,
      timestamp: purchase.timestamp,
    },
    presale: {
      sold: presaleState.sold,
      remaining: presaleState.supply - presaleState.sold,
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
