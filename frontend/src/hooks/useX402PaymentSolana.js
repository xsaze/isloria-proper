import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js'
import { PRESALE_WALLET_ADDRESS } from '../config/solana'

/**
 * Hook to handle x402 payment protocol flow with Solana
 *
 * Flow:
 * 1. Request purchase from server
 * 2. Server responds with 402 + payment challenge
 * 3. Parse challenge and execute SOL transfer
 * 4. Submit tx signature to server for verification
 * 5. Server verifies transaction on Solana
 */
export function useX402PaymentSolana() {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, connected } = useWallet()

  const [status, setStatus] = useState('idle') // idle | requesting | paying | confirming | confirmed | error
  const [error, setError] = useState(null)
  const [challengeData, setChallengeData] = useState(null)
  const [txSignature, setTxSignature] = useState(null)

  /**
   * Initiate purchase request and handle x402 flow
   */
  const purchaseWithX402 = async (quantity = 1) => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first')
      setStatus('error')
      return
    }

    try {
      setStatus('requesting')
      setError(null)
      setTxSignature(null)

      // Step 1: Request purchase from backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/presale/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity,
          address: publicKey.toBase58()
        }),
      })

      // Step 2: Check for x402 payment required response
      if (res.status === 402) {
        // Parse x402 payment challenge
        const paymentChallenge = res.headers.get('X-PAYMENT') || res.headers.get('x-payment-request')

        if (!paymentChallenge) {
          throw new Error('402 response missing payment challenge header')
        }

        const challenge = JSON.parse(paymentChallenge)
        setChallengeData(challenge)

        // Step 3: Execute SOL transfer
        setStatus('paying')

        // Convert SOL amount to lamports (1 SOL = 1,000,000,000 lamports)
        const amountInLamports = Math.floor(parseFloat(challenge.amount) * LAMPORTS_PER_SOL)

        // Create recipient public key
        const recipientPubkey = new PublicKey(challenge.payment_address)

        // Create transaction
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: amountInLamports,
          })
        )

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        // Send transaction
        const signature = await sendTransaction(transaction, connection)
        setTxSignature(signature)

        // Wait for confirmation
        setStatus('confirming')
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        })

        if (confirmation.value.err) {
          throw new Error('Transaction failed on Solana blockchain')
        }

        // Step 4: Submit proof to backend
        await submitPaymentProof(signature, challenge.challenge_id)

      } else if (res.ok) {
        // No payment required (whitelist, free mint, etc.)
        const data = await res.json()
        setStatus('confirmed')
        return data
      } else {
        // Error response
        const errorData = await res.json()
        throw new Error(errorData.error || 'Purchase failed')
      }

    } catch (err) {
      console.error('Purchase error:', err)
      setError(err.message || 'Purchase failed')
      setStatus('error')
    }
  }

  /**
   * Submit transaction signature to backend for verification
   */
  const submitPaymentProof = async (signature, challengeId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/presale/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          tx_signature: signature,
          address: publicKey.toBase58(),
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Verification failed')
      }

      const data = await res.json()
      setStatus('confirmed')
      return data

    } catch (err) {
      console.error('Verification error:', err)
      setError(err.message || 'Verification failed')
      setStatus('error')
    }
  }

  return {
    purchaseWithX402,
    submitPaymentProof,
    status,
    error,
    txSignature,
    challengeData,
    isConnected: connected,
    walletAddress: publicKey?.toBase58(),
  }
}
