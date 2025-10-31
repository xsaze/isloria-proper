# BSC Mainnet Migration Checklist

## 🚀 Complete Migration Guide: Testnet (Native tBNB) → Mainnet (Custom ERC-20 Token)

**Document Version:** 1.0
**Last Updated:** 2025
**Purpose:** Reference guide for migrating x402 presale from BSC Testnet to Mainnet with custom ERC-20 token

### Current Setup
- **Network:** BSC Testnet (Chain ID 97)
- **Payment Method:** Native tBNB transfers
- **Transaction Type:** `sendTransaction` (native value transfer)

### Target Setup
- **Network:** BSC Mainnet (Chain ID 56)
- **Payment Method:** Custom ERC-20 token transfers
- **Transaction Type:** `writeContract` (ERC-20 transfer function)

---

## 📑 Table of Contents

1. [Pre-Migration Requirements](#pre-migration-requirements)
2. [Token Information Template](#token-information-template)
3. [Configuration Changes Overview](#configuration-changes-overview)
4. [Frontend Migration (Step-by-Step)](#frontend-migration-step-by-step)
5. [Backend Migration (Step-by-Step)](#backend-migration-step-by-step)
6. [ERC-20 Payment Flow Implementation](#erc-20-payment-flow-implementation)
7. [Testing Checklist](#testing-checklist)
8. [Deployment Steps](#deployment-steps)
9. [Security Checklist](#security-checklist)
10. [Quick Reference Tables](#quick-reference-tables)

---

## 📋 Pre-Migration Requirements

### 1. Deploy Your Custom ERC-20 Token

✅ **Deployment Checklist:**
- [ ] Token contract deployed on BSC Mainnet
- [ ] Contract verified on BscScan (https://bscscan.com/verifyContract)
- [ ] Contract address documented
- [ ] Token decimals confirmed (standard is 18)
- [ ] Token symbol confirmed (e.g., BNRA, GAME)
- [ ] Token name confirmed
- [ ] Manual token transfers tested successfully
- [ ] Token has sufficient supply for presale
- [ ] No pausable/blacklist functions that could block presale
- [ ] Token ownership/admin functions understood

### 2. Get Mainnet Production Wallet Ready

✅ **Wallet Setup Checklist:**
- [ ] New production wallet created (NEVER reuse testnet wallet)
- [ ] Wallet backed up securely offline
- [ ] Wallet added to hardware wallet (recommended)
- [ ] Custom token added to wallet
- [ ] Small test transaction completed
- [ ] Wallet address documented
- [ ] Wallet has small BNB for gas (not needed for receiving tokens)

### 3. Development Environment

✅ **Prerequisites:**
- [ ] Node.js and npm installed
- [ ] Git repository backed up
- [ ] Local testnet environment working
- [ ] MetaMask/wallet installed for testing
- [ ] BscScan API key obtained (optional, for verification)

---

## 📝 Token Information Template

**Fill this out before starting migration:**

```
┌─────────────────────────────────────────────────────────────┐
│ TOKEN INFORMATION (Keep this secure!)                      │
├─────────────────────────────────────────────────────────────┤
│ Token Contract Address: 0x________________________________  │
│ Token Symbol: ________                                      │
│ Token Name: ________________________________                │
│ Token Decimals: ____ (usually 18)                          │
│ Total Supply: ________________                              │
│                                                             │
│ Production Wallet Address: 0x____________________________  │
│ Presale Price (per island): ______ tokens                  │
│ Total Supply for Presale: ______ islands                   │
│                                                             │
│ Mainnet RPC: https://bsc-dataseed.binance.org             │
│ Chain ID: 56                                                │
│ Block Explorer: https://bscscan.com                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Configuration Changes Overview

**Files to Modify (7 total):**

| # | File Path | Changes Required |
|---|-----------|------------------|
| 1 | `frontend/src/config/wagmi.js` | Network, chain, token address, keep ERC-20 ABI |
| 2 | `frontend/src/hooks/useX402Payment.js` | Network, payment method (native → ERC-20) |
| 3 | `frontend/src/pages/PresalePage.jsx` | Network display names |
| 4 | `frontend/.env` | Token address, API URL |
| 5 | `frontend/.env.production` | Token address, production API URL |
| 6 | `backend/.env` | All config variables, add token details |
| 7 | `backend/routes/presale.js` | Network, chain, verification logic (native → ERC-20) |

**Total Changes:** ~50 variables across 7 files

---

## 🎨 Frontend Migration (Step-by-Step)

### Step 1: Update `frontend/src/config/wagmi.js`

#### 1.1 Change Network Import

**Find:**
```javascript
import { bscTestnet } from 'wagmi/chains'
```

**Replace with:**
```javascript
import { bsc } from 'wagmi/chains'
```

#### 1.2 Update Wagmi Config

**Find:**
```javascript
export const config = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http('https://data-seed-prebsc-1-s1.binance.org:8545'),
  },
})

export const BSC_CHAIN = bscTestnet
```

**Replace with:**
```javascript
export const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
  },
})

export const BSC_CHAIN = bsc
```

#### 1.3 Update Token Address

**Find:**
```javascript
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000'
```

**Replace with:**
```javascript
export const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || 'YOUR_TOKEN_CONTRACT_ADDRESS'
```

✅ **Note:** The `ERC20_ABI` at the bottom of this file is already correct - keep it as is!

---

### Step 2: Update `frontend/src/hooks/useX402Payment.js`

This is the **MOST CRITICAL** change - switching from native BNB to ERC-20 token transfers.

#### 2.1 Update Imports

**Find:**
```javascript
import { useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { bscTestnet } from 'viem/chains'
```

**Replace with:**
```javascript
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { bsc } from 'viem/chains'
import { TOKEN_ADDRESS, ERC20_ABI } from '../config/wagmi'
```

**Changes:**
- ✅ `useSendTransaction` → `useWriteContract`
- ✅ `parseEther` → `parseUnits`
- ✅ `bscTestnet` → `bsc`
- ✅ Added imports for `TOKEN_ADDRESS` and `ERC20_ABI`

#### 2.2 Update Hook Declaration

**Find:**
```javascript
export function useX402Payment() {
  const { address, isConnected, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { sendTransaction, data: hash, isPending: isWriting, error: writeError } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
```

**Replace with:**
```javascript
export function useX402Payment() {
  const { address, isConnected, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
```

**Changes:**
- ✅ `sendTransaction` → `writeContract`

#### 2.3 Update Network Check

**Find:**
```javascript
    // Check if user is on BSC Testnet (Chain ID 97)
    const currentChainId = chain?.id
    if (currentChainId !== bscTestnet.id) {
      setStatus('error')
      setError(`Wrong network! Please switch to BSC Testnet`)

      // Attempt to switch network automatically
      try {
        await switchChain({ chainId: bscTestnet.id })
```

**Replace with:**
```javascript
    // Check if user is on BSC Mainnet (Chain ID 56)
    const currentChainId = chain?.id
    if (currentChainId !== bsc.id) {
      setStatus('error')
      setError(`Wrong network! Please switch to BSC Mainnet`)

      // Attempt to switch network automatically
      try {
        await switchChain({ chainId: bsc.id })
```

**Changes:**
- ✅ `bscTestnet.id` → `bsc.id` (2 occurrences)
- ✅ Error message mentions "BSC Mainnet"

#### 2.4 Update Payment Execution (CRITICAL CHANGE)

**Find (Native BNB Transfer):**
```javascript
        // Step 3: Execute native tBNB transfer
        setStatus('paying')

        const amountInWei = parseEther(challenge.amount)

        sendTransaction({
          to: challenge.payment_address,
          value: amountInWei,
        })
```

**Replace with (ERC-20 Token Transfer):**
```javascript
        // Step 3: Execute ERC-20 token transfer
        setStatus('paying')

        const decimals = 18 // Your token decimals
        const amountInTokens = parseUnits(challenge.amount, decimals)

        writeContract({
          address: TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [challenge.payment_address, amountInTokens],
        })
```

**Changes:**
- ✅ `parseEther` → `parseUnits` with decimals
- ✅ `sendTransaction` → `writeContract`
- ✅ Now calls ERC-20 `transfer` function instead of native transfer
- ✅ Passes token contract address and ABI

#### 2.5 Update Comments

**Find:**
```javascript
/**
 * Hook to handle x402 payment protocol flow with native tBNB
 *
 * Flow:
 * 1. Check user is on correct network (BSC Testnet)
 * 2. Request purchase from server
 * 3. Server responds with 402 + payment challenge
 * 4. Parse challenge and execute native BNB transfer
 * 5. Submit tx hash to server for verification
 * 6. Server verifies transaction on BSC Testnet
 */
```

**Replace with:**
```javascript
/**
 * Hook to handle x402 payment protocol flow with ERC-20 token
 *
 * Flow:
 * 1. Check user is on correct network (BSC Mainnet)
 * 2. Request purchase from server
 * 3. Server responds with 402 + payment challenge
 * 4. Parse challenge and execute ERC-20 token transfer
 * 5. Submit tx hash to server for verification
 * 6. Server verifies transaction on BSC Mainnet
 */
```

---

### Step 3: Update `frontend/src/pages/PresalePage.jsx`

#### 3.1 Update Network Import

**Find:**
```javascript
import { bscTestnet } from 'wagmi/chains'
```

**Replace with:**
```javascript
import { bsc } from 'wagmi/chains'
```

#### 3.2 Update Network Check

**Find:**
```javascript
const isCorrectNetwork = currentChainId === bscTestnet.id
```

**Replace with:**
```javascript
const isCorrectNetwork = currentChainId === bsc.id
```

#### 3.3 Update Network Name Function

**Find:**
```javascript
  const getNetworkName = () => {
    if (!currentChainId) return 'Unknown'
    if (currentChainId === bscTestnet.id) return 'BSC Testnet'
    if (currentChainId === 56) return 'BSC Mainnet'
    if (currentChainId === 1) return 'Ethereum'
    if (currentChainId === 137) return 'Polygon'
    return `Network ${currentChainId}`
  }
```

**Replace with:**
```javascript
  const getNetworkName = () => {
    if (!currentChainId) return 'Unknown'
    if (currentChainId === bsc.id) return 'BSC Mainnet'
    if (currentChainId === 97) return 'BSC Testnet'  // Wrong network now
    if (currentChainId === 1) return 'Ethereum'
    if (currentChainId === 137) return 'Polygon'
    return `Network ${currentChainId}`
  }
```

**Changes:**
- ✅ Check for `bsc.id` (mainnet) as correct network
- ✅ Testnet (97) now shows as wrong network

#### 3.4 Update Switch Network Button Text

**Find:**
```javascript
You're connected to {getNetworkName()}. Please switch to BSC Testnet to purchase islands.

...

Switch to BSC Testnet
```

**Replace with:**
```javascript
You're connected to {getNetworkName()}. Please switch to BSC Mainnet to purchase islands.

...

Switch to BSC Mainnet
```

---

### Step 4: Update `frontend/.env`

**Create/Update:**
```env
VITE_API_URL=http://localhost:3001
VITE_TOKEN_ADDRESS=YOUR_TOKEN_CONTRACT_ADDRESS
VITE_TOKEN_DECIMALS=18
VITE_TOKEN_SYMBOL=YOUR_SYMBOL
```

---

### Step 5: Update `frontend/.env.production`

**Create/Update:**
```env
VITE_API_URL=https://your-production-api.com
VITE_TOKEN_ADDRESS=YOUR_TOKEN_CONTRACT_ADDRESS
VITE_TOKEN_DECIMALS=18
VITE_TOKEN_SYMBOL=YOUR_SYMBOL
```

---

## 🔧 Backend Migration (Step-by-Step)

### Step 6: Update `backend/.env`

**Find:**
```env
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=0.01
TOKEN_SYMBOL=tBNB
PRESALE_WALLET_ADDRESS=0x8a32c173cba9cd1af48850e655d698c5a6fe4da6
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_CHAIN_ID=97
```

**Replace with:**
```env
# Presale Configuration
PRESALE_TOTAL_SUPPLY=1000
PRESALE_PRICE=100
TOKEN_SYMBOL=YOUR_TOKEN_SYMBOL
TOKEN_CONTRACT_ADDRESS=YOUR_TOKEN_CONTRACT_ADDRESS
TOKEN_DECIMALS=18
PRESALE_WALLET_ADDRESS=YOUR_PRODUCTION_WALLET_ADDRESS

# BSC Mainnet Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org
BSC_CHAIN_ID=56
```

**Variables Added:**
- `TOKEN_CONTRACT_ADDRESS` - NEW
- `TOKEN_DECIMALS` - NEW

**Variables Changed:**
- `PRESALE_PRICE` - Set real price in tokens (e.g., 100 tokens per island)
- `TOKEN_SYMBOL` - Your token symbol (e.g., BNRA)
- `PRESALE_WALLET_ADDRESS` - **CRITICAL:** Use production wallet!
- `BSC_RPC_URL` - Mainnet RPC
- `BSC_CHAIN_ID` - 56 for mainnet

---

### Step 7: Update `backend/routes/presale.js`

This requires significant changes to handle ERC-20 token verification.

#### 7.1 Update Imports

**Find:**
```javascript
import { createPublicClient, http, parseEther } from 'viem';
import { bscTestnet } from 'viem/chains';
```

**Replace with:**
```javascript
import { createPublicClient, http, parseUnits, decodeEventLog } from 'viem';
import { bsc } from 'viem/chains';
```

**Changes:**
- ✅ `bscTestnet` → `bsc`
- ✅ Added `parseUnits` and `decodeEventLog` for ERC-20 handling

#### 7.2 Update BSC Client

**Find:**
```javascript
const bscClient = createPublicClient({
  chain: bscTestnet,
  transport: http(process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545'),
});
```

**Replace with:**
```javascript
const bscClient = createPublicClient({
  chain: bsc,
  transport: http(process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org'),
});
```

#### 7.3 Add ERC-20 ABI Constant

**Add this after the bscClient creation:**
```javascript
// ERC-20 Transfer event ABI for decoding logs
const ERC20_TRANSFER_EVENT_ABI = [{
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
}];
```

#### 7.4 Update Challenge Creation

**Find:**
```javascript
  const challenge = {
    challenge_id: challengeId,
    amount: totalAmount,
    currency: process.env.TOKEN_SYMBOL || 'tBNB',
    chain: 'bsc-testnet',
    payment_address: process.env.PRESALE_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
    quantity,
    buyer_address: address,
    expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
    created_at: Date.now(),
  };
```

**Replace with:**
```javascript
  const challenge = {
    challenge_id: challengeId,
    amount: totalAmount,
    currency: process.env.TOKEN_SYMBOL || 'TOKEN',
    token_address: process.env.TOKEN_CONTRACT_ADDRESS,  // NEW: Add token contract
    chain: 'bsc',  // Changed to mainnet
    payment_address: process.env.PRESALE_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000',
    quantity,
    buyer_address: address,
    expires_at: Date.now() + (15 * 60 * 1000), // 15 minutes
    created_at: Date.now(),
  };
```

**Changes:**
- ✅ Added `token_address` field
- ✅ Changed `chain` to `'bsc'`

#### 7.5 Update Transaction Verification (CRITICAL CHANGE)

This is the most complex change - we need to verify ERC-20 token transfers instead of native transfers.

**Find (Native BNB Verification):**
```javascript
  try {
    // Step 1: Verify transaction exists and is successful on BSC Testnet
    const transaction = await bscClient.getTransaction({ hash: tx_hash });

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found on blockchain' });
    }

    // Step 2: Wait for transaction receipt to check if it was successful
    const receipt = await bscClient.getTransactionReceipt({ hash: tx_hash });

    if (!receipt) {
      return res.status(400).json({ error: 'Transaction not yet confirmed' });
    }

    if (receipt.status !== 'success') {
      return res.status(400).json({ error: 'Transaction failed on blockchain' });
    }

    // Step 3: Verify transaction details
    const expectedRecipient = challenge.payment_address.toLowerCase();
    const actualRecipient = transaction.to?.toLowerCase();

    if (actualRecipient !== expectedRecipient) {
      return res.status(400).json({
        error: 'Payment sent to wrong address',
        expected: expectedRecipient,
        actual: actualRecipient
      });
    }

    // Step 4: Verify amount (with small tolerance for precision)
    const expectedAmount = parseEther(challenge.amount);
    const actualAmount = transaction.value;

    if (actualAmount < expectedAmount) {
      return res.status(400).json({
        error: 'Insufficient payment amount',
        expected: challenge.amount,
        actual: actualAmount.toString()
      });
    }

    // Step 5: Verify sender matches buyer address
    const actualSender = transaction.from.toLowerCase();
    const expectedSender = challenge.buyer_address.toLowerCase();

    if (actualSender !== expectedSender) {
      return res.status(400).json({
        error: 'Transaction sender does not match buyer address',
        expected: expectedSender,
        actual: actualSender
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to verify transaction on blockchain',
      details: error.message
    });
  }
```

**Replace with (ERC-20 Token Verification):**
```javascript
  try {
    // Step 1: Get transaction receipt
    const receipt = await bscClient.getTransactionReceipt({ hash: tx_hash });

    if (!receipt) {
      return res.status(400).json({ error: 'Transaction not yet confirmed' });
    }

    if (receipt.status !== 'success') {
      return res.status(400).json({ error: 'Transaction failed on blockchain' });
    }

    // Step 2: Get transaction to verify sender
    const transaction = await bscClient.getTransaction({ hash: tx_hash });

    if (!transaction) {
      return res.status(400).json({ error: 'Transaction not found on blockchain' });
    }

    // Step 3: Verify sender matches buyer address
    const actualSender = transaction.from.toLowerCase();
    const expectedSender = challenge.buyer_address.toLowerCase();

    if (actualSender !== expectedSender) {
      return res.status(400).json({
        error: 'Transaction sender does not match buyer address',
        expected: expectedSender,
        actual: actualSender
      });
    }

    // Step 4: Find Transfer event in logs for the token contract
    const tokenAddress = process.env.TOKEN_CONTRACT_ADDRESS.toLowerCase();
    const expectedRecipient = challenge.payment_address.toLowerCase();

    // ERC-20 Transfer event signature
    const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

    const transferLog = receipt.logs.find(log =>
      log.address.toLowerCase() === tokenAddress &&
      log.topics[0] === transferEventSignature
    );

    if (!transferLog) {
      return res.status(400).json({
        error: 'No token transfer found in transaction',
        hint: 'Make sure you sent the correct token'
      });
    }

    // Step 5: Decode the Transfer event
    const decodedLog = decodeEventLog({
      abi: ERC20_TRANSFER_EVENT_ABI,
      data: transferLog.data,
      topics: transferLog.topics,
    });

    // Step 6: Verify recipient address
    const actualRecipient = decodedLog.args.to.toLowerCase();

    if (actualRecipient !== expectedRecipient) {
      return res.status(400).json({
        error: 'Token sent to wrong address',
        expected: expectedRecipient,
        actual: actualRecipient
      });
    }

    // Step 7: Verify amount
    const decimals = parseInt(process.env.TOKEN_DECIMALS) || 18;
    const expectedAmount = parseUnits(challenge.amount, decimals);
    const actualAmount = decodedLog.args.value;

    if (actualAmount < expectedAmount) {
      return res.status(400).json({
        error: 'Insufficient token amount',
        expected: challenge.amount,
        actual: (Number(actualAmount) / Math.pow(10, decimals)).toString()
      });
    }

    // Step 8: Verify it's from the buyer (redundant but extra safety)
    const actualFrom = decodedLog.args.from.toLowerCase();
    if (actualFrom !== expectedSender) {
      return res.status(400).json({
        error: 'Token transfer from address does not match buyer',
        expected: expectedSender,
        actual: actualFrom
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to verify transaction on blockchain',
      details: error.message
    });
  }
```

**Key Changes:**
- ✅ Now looks for ERC-20 Transfer events instead of native value
- ✅ Decodes Transfer event logs
- ✅ Verifies token contract address matches
- ✅ Uses `parseUnits` with token decimals
- ✅ Extracts `from`, `to`, and `value` from Transfer event
- ✅ More comprehensive error messages

---

## 🔄 ERC-20 Payment Flow Implementation

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 USER INITIATES PURCHASE                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: Check user is on BSC Mainnet (Chain ID 56)   │
│    - If wrong network → Prompt to switch                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend → Backend: POST /api/presale/purchase         │
│    Request: { quantity: 1, address: "0x..." }             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: Generate x402 Payment Challenge               │
│    - Create challenge ID                                   │
│    - Calculate amount in tokens                            │
│    - Set expiration (15 minutes)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend → Frontend: HTTP 402 Response                  │
│    Header: X-PAYMENT: {                                    │
│      challenge_id, amount, currency, token_address,        │
│      payment_address, chain, expires_at                    │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend: Parse Challenge & Execute ERC-20 Transfer    │
│    - Parse amount with correct decimals                    │
│    - Call writeContract() with:                            │
│      * Token contract address                              │
│      * transfer(recipient, amount)                         │
│      * ERC-20 ABI                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. User's Wallet: Confirm Transaction                     │
│    - MetaMask/wallet shows token transfer                 │
│    - User approves (signs transaction)                    │
│    - Transaction broadcast to BSC Mainnet                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. BSC Mainnet: Transaction Mined                         │
│    - ERC-20 transfer() executed                            │
│    - Transfer event emitted                                │
│    - Transaction hash available                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend: Wait for Confirmation                        │
│    - useWaitForTransactionReceipt monitors tx              │
│    - Status updates shown to user                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend → Backend: POST /api/presale/verify           │
│    Request: { challenge_id, tx_hash, address }            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. Backend: Verify Transaction On-Chain                  │
│     a) Get transaction receipt                             │
│     b) Check transaction succeeded                         │
│     c) Find Transfer event in logs                         │
│     d) Verify event is from correct token contract         │
│     e) Decode Transfer event (from, to, value)             │
│     f) Verify recipient matches payment_address            │
│     g) Verify amount matches challenge amount              │
│     h) Verify sender matches buyer address                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. Backend: Record Purchase                              │
│     - Add to purchases array                               │
│     - Increment sold count                                 │
│     - Delete challenge                                     │
│     - Return success response                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. Frontend: Show Success                                │
│     - Display confirmation message                         │
│     - Update presale progress bar                          │
│     - Show transaction link to BscScan                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences from Native BNB Flow

| Aspect | Native BNB (Old) | ERC-20 Token (New) |
|--------|------------------|-------------------|
| **Hook Used** | `useSendTransaction` | `useWriteContract` |
| **Amount Parsing** | `parseEther` | `parseUnits(amount, decimals)` |
| **Transaction Type** | Native value transfer | Contract function call |
| **Transaction Data** | `{ to, value }` | `{ address, abi, functionName, args }` |
| **Verification Method** | Check `transaction.value` | Decode Transfer event from logs |
| **Contract Interaction** | None | Token contract `transfer()` |
| **Event Signature** | N/A | `0xddf252ad...` (Transfer) |

---

## 🧪 Testing Checklist

### Phase 1: Local Testing

Before deploying anything:

- [ ] All files saved and committed to git
- [ ] Environment variables updated
- [ ] Token contract address is correct
- [ ] Frontend builds without errors: `npm run build`
- [ ] Backend starts without errors: `npm start`

### Phase 2: Testnet Testing (Deploy Token on BSC Testnet First!)

**Deploy your token on BSC TESTNET first:**

- [ ] Deploy test version of token on BSC Testnet
- [ ] Update all configs to use BSC Testnet + your testnet token
- [ ] Test complete flow on testnet:
  - [ ] Wallet connects
  - [ ] Network detection works (shows testnet)
  - [ ] Can switch to testnet when on wrong network
  - [ ] Purchase button initiates request
  - [ ] Receives 402 response with challenge
  - [ ] MetaMask shows token transfer (not BNB!)
  - [ ] Token transfer executes successfully
  - [ ] Backend receives verification request
  - [ ] Backend finds Transfer event in logs
  - [ ] Backend successfully verifies token transfer
  - [ ] Purchase recorded in database
  - [ ] Presale stats update correctly
  - [ ] Progress bar updates in real-time

### Phase 3: Edge Case Testing

- [ ] **Insufficient Token Balance**
  - User has less tokens than needed
  - Should show clear error from wallet

- [ ] **Wrong Token**
  - User sends different token
  - Backend should reject (no Transfer event found)

- [ ] **Wrong Amount**
  - User modifies amount in wallet
  - Backend should reject (amount mismatch)

- [ ] **Wrong Recipient**
  - User changes recipient address
  - Backend should reject (recipient mismatch)

- [ ] **Expired Challenge**
  - Wait 15+ minutes before sending
  - Backend should reject (expired)

- [ ] **Double Spend Attempt**
  - Try to verify same tx_hash twice
  - Backend should reject (challenge not found)

- [ ] **Network Switch During Purchase**
  - Start purchase, switch network mid-flow
  - Should show error and require correct network

### Phase 4: Mainnet Pre-Launch Testing

- [ ] Deploy production token on BSC Mainnet
- [ ] Update all configs to mainnet
- [ ] Test with SMALL amounts first (1-10 tokens)
- [ ] Test complete flow with real production wallet
- [ ] Verify tokens received in production wallet
- [ ] Check transaction on BscScan
- [ ] Verify presale stats accurate

### Phase 5: Monitoring Plan

- [ ] Set up error logging/monitoring (Sentry, LogRocket, etc.)
- [ ] Monitor first 10 transactions closely
- [ ] Have rollback plan ready
- [ ] Keep test environment running for comparison

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment

1. **Backup everything:**
   ```bash
   git add .
   git commit -m "Pre-mainnet migration backup"
   git push
   ```

2. **Create deployment branch:**
   ```bash
   git checkout -b mainnet-migration
   ```

3. **Complete all file changes from this guide**

4. **Test thoroughly on testnet with your test token**

### Step 2: Deploy Token on Mainnet

1. Deploy your ERC-20 token to BSC Mainnet
2. Verify contract on BscScan
3. Save contract address
4. Test manual transfer to ensure it works

### Step 3: Update Production Config

1. Update all environment variables in hosting platforms
2. Update token addresses in code
3. Double-check production wallet address

### Step 4: Build and Deploy

**Frontend:**
```bash
cd frontend
npm install
npm run build
# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

**Backend:**
```bash
cd backend
npm install
# Deploy to your server (Heroku, AWS, DigitalOcean, etc.)
```

### Step 5: Post-Deployment Verification

1. Visit production URL
2. Connect wallet (use test wallet first with small amount)
3. Verify network detection works
4. Complete ONE small test purchase
5. Verify in BscScan token was transferred
6. Check backend logs for verification
7. Verify presale stats updated

### Step 6: Go Live

1. Announce to users
2. Monitor first transactions closely
3. Be ready to quickly fix issues
4. Have rollback plan available

---

## 🔒 Security Checklist

### Critical Security Items

- [ ] **Production wallet private key is SECURE**
  - Never committed to git
  - Not in any .env files in repository
  - Stored in secure password manager
  - Backed up offline
  - Only in production hosting environment variables

- [ ] **Token contract is verified on BscScan**
  - Contract source code is public
  - Users can see what they're buying
  - No hidden functions

- [ ] **Token contract security**
  - No pause functions that could block presale
  - No blacklist functions on your wallet
  - No admin mint functions that could inflate supply
  - Ownership renounced or clearly documented

- [ ] **Backend security**
  - Rate limiting enabled (not currently implemented - TODO)
  - Input validation on all endpoints
  - CORS properly configured
  - HTTPS enabled in production
  - Environment variables not exposed

- [ ] **Frontend security**
  - No private keys in frontend code
  - No API keys exposed in frontend
  - HTTPS enabled
  - CSP headers configured

### Additional Security Measures

- [ ] Set up monitoring/alerts for unusual activity
- [ ] Have emergency pause mechanism (if needed)
- [ ] Document incident response plan
- [ ] Keep small amount of BNB in production wallet (only for gas if needed)
- [ ] Monitor wallet balance regularly
- [ ] Set up transaction notifications

### Code Review Checklist

- [ ] All `bscTestnet` changed to `bsc`
- [ ] All `parseEther` changed to `parseUnits` (for tokens)
- [ ] All `sendTransaction` changed to `writeContract`
- [ ] Token address not hardcoded (uses env var)
- [ ] Token decimals correctly configured
- [ ] Backend verifies Transfer events not native value
- [ ] Error messages don't expose sensitive info
- [ ] No console.logs with sensitive data

---

## 📊 Quick Reference Tables

### Environment Variables Quick Reference

| Variable | Testnet Value | Mainnet Value | Location |
|----------|---------------|---------------|----------|
| **Chain ID** | 97 | 56 | Backend .env |
| **RPC URL** | testnet RPC | https://bsc-dataseed.binance.org | Backend .env |
| **Token Symbol** | tBNB | YOUR_SYMBOL | Backend .env, Frontend .env |
| **Token Address** | N/A (native) | YOUR_CONTRACT | Backend .env, Frontend .env |
| **Token Decimals** | 18 (default) | 18 (usually) | Backend .env, Frontend .env |
| **Wallet Address** | Test wallet | **Production wallet** | Backend .env |
| **Presale Price** | 0.01 (test) | Real price in tokens | Backend .env |
| **API URL** | localhost:3001 | Production API URL | Frontend .env |

### Code Import Changes Quick Reference

| File | Old Import | New Import |
|------|------------|------------|
| `wagmi.js` | `import { bscTestnet } from 'wagmi/chains'` | `import { bsc } from 'wagmi/chains'` |
| `useX402Payment.js` | `import { bscTestnet } from 'viem/chains'` | `import { bsc } from 'viem/chains'` |
| `useX402Payment.js` | `import { useSendTransaction } from 'wagmi'` | `import { useWriteContract } from 'wagmi'` |
| `useX402Payment.js` | `import { parseEther } from 'viem'` | `import { parseUnits } from 'viem'` |
| `useX402Payment.js` | N/A | `import { TOKEN_ADDRESS, ERC20_ABI } from '../config/wagmi'` |
| `PresalePage.jsx` | `import { bscTestnet } from 'wagmi/chains'` | `import { bsc } from 'wagmi/chains'` |
| `presale.js` (backend) | `import { bscTestnet } from 'viem/chains'` | `import { bsc } from 'viem/chains'` |
| `presale.js` (backend) | `import { parseEther } from 'viem'` | `import { parseUnits, decodeEventLog } from 'viem'` |

### Function Call Changes Quick Reference

| Function | Old (Native BNB) | New (ERC-20) |
|----------|------------------|--------------|
| **Amount Parsing** | `parseEther(amount)` | `parseUnits(amount, decimals)` |
| **Send Transaction** | `sendTransaction({ to, value })` | `writeContract({ address, abi, functionName, args })` |
| **Verify Amount** | Check `transaction.value` | Decode Transfer event, check `value` from event |
| **Verify Recipient** | Check `transaction.to` | Decode Transfer event, check `to` from event |
| **Verify Sender** | Check `transaction.from` | Check `transaction.from` AND Transfer event `from` |

### Network Information Quick Reference

| Network | Chain ID | RPC URL | Block Explorer |
|---------|----------|---------|----------------|
| **BSC Testnet** | 97 | https://data-seed-prebsc-1-s1.binance.org:8545 | https://testnet.bscscan.com |
| **BSC Mainnet** | 56 | https://bsc-dataseed.binance.org | https://bscscan.com |

### ERC-20 Transfer Event Reference

**Event Signature:**
```
Transfer(address indexed from, address indexed to, uint256 value)
```

**Event Signature Hash:**
```
0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

**Event Structure:**
```javascript
{
  address: "0x..." // Token contract address
  topics: [
    "0xddf252ad...",  // Event signature
    "0x000...from",   // Indexed: from address
    "0x000...to"      // Indexed: to address
  ],
  data: "0x..."       // Non-indexed: amount (uint256)
}
```

---

## 🆘 Troubleshooting Guide

### Common Issues and Solutions

#### Issue: "Transaction not found on blockchain"
**Cause:** Transaction hasn't been mined yet
**Solution:** Wait a few seconds and retry verification

#### Issue: "No token transfer found in transaction"
**Possible Causes:**
1. User sent wrong token
2. User sent native BNB instead of tokens
3. Transaction failed

**Solution:** Check transaction on BscScan, verify correct token was sent

#### Issue: "Token sent to wrong address"
**Cause:** User modified recipient in wallet
**Solution:** User needs to send again to correct address

#### Issue: "Insufficient token amount"
**Cause:** User sent less than required or has wrong decimals
**Solution:** Verify token decimals are correct in config

#### Issue: MetaMask shows "Insufficient funds" but user has tokens
**Cause:** User doesn't have BNB for gas fees
**Solution:** User needs small amount of BNB (~$1) for gas

#### Issue: Network keeps switching back to wrong network
**Cause:** Wagmi config only includes one chain
**Solution:** This is expected - config only has BSC mainnet

---

## 📞 Support Resources

- **BSC Docs:** https://docs.bnbchain.org
- **Wagmi Docs:** https://wagmi.sh
- **Viem Docs:** https://viem.sh
- **BscScan:** https://bscscan.com
- **BSC Testnet Faucet:** https://testnet.bnbchain.org/faucet-smart
- **ERC-20 Standard:** https://eips.ethereum.org/EIPS/eip-20

---

## ✅ Final Pre-Launch Checklist

Print this out and check off before going live:

### Configuration
- [ ] All 7 files updated per this guide
- [ ] Token contract deployed and verified on BSC Mainnet
- [ ] Production wallet configured and backed up
- [ ] All environment variables updated
- [ ] No testnet references remaining in code

### Testing
- [ ] Tested on testnet with test token
- [ ] Tested all edge cases
- [ ] Tested on mainnet with small amounts
- [ ] Presale stats update correctly
- [ ] Progress bar updates in real-time

### Security
- [ ] Production wallet private key is secure
- [ ] Token contract has no backdoors
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] Rate limiting considered (implement if needed)

### Deployment
- [ ] Code committed to git
- [ ] Frontend built and deployed
- [ ] Backend deployed to production
- [ ] Environment variables set in hosting
- [ ] DNS configured correctly

### Monitoring
- [ ] Error monitoring set up
- [ ] Transaction monitoring enabled
- [ ] Wallet balance monitoring
- [ ] Backup plan documented
- [ ] Support system ready

---

## 🎉 You're Ready!

Once all items are checked, you're ready to launch your presale on BSC Mainnet with your custom ERC-20 token!

**Remember:**
1. Test with small amounts first
2. Monitor the first transactions closely
3. Have a rollback plan
4. Keep this document for reference

**Good luck with your launch! 🚀**

---

**Document Version:** 1.0
**Last Updated:** 2025
**Maintained by:** Your Team
**Questions?** Review this document thoroughly before reaching out.
