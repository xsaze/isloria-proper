import { useState } from 'react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

/**
 * Hook to handle x402 payment protocol flow with native tBNB
 *
 * Flow:
 * 1. Request purchase from server
 * 2. Server responds with 402 + payment challenge
 * 3. Parse challenge and execute native BNB transfer
 * 4. Submit tx hash to server for verification
 * 5. Server verifies transaction on BSC Testnet
 */
export function useX402Payment() {
  const { address, isConnected } = useAccount()
  const { sendTransaction, data: hash, isPending: isWriting, error: writeError } = useSendTransaction()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const [status, setStatus] = useState('idle') // idle | requesting | paying | confirming | confirmed | error
  const [error, setError] = useState(null)
  const [challengeData, setChallengeData] = useState(null)

  /**
   * Initiate purchase request and handle x402 flow
   */
  const purchaseWithX402 = async (quantity = 1) => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      setStatus('error')
      return
    }

    try {
      setStatus('requesting')
      setError(null)

      // Step 1: Request purchase from backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/presale/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, address }),
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

        console.log('x402 Payment Challenge:', challenge)
        /*
        Expected challenge format:
        {
          "challenge_id": "uuid",
          "amount": "0.01",
          "currency": "tBNB",
          "chain": "bsc-testnet",
          "payment_address": "0x...",
          "expires_at": timestamp
        }
        */

        // Step 3: Execute native tBNB transfer
        setStatus('paying')

        const amountInWei = parseEther(challenge.amount)

        sendTransaction({
          to: challenge.payment_address,
          value: amountInWei,
        })

        // Note: We'll handle confirmation in useEffect watching the tx status

      } else if (res.ok) {
        // No payment required (whitelist, free mint, etc.)
        const data = await res.json()
        console.log('Purchase confirmed without payment:', data)
        setStatus('confirmed')
        return data
      } else {
        // Error response
        const errorText = await res.text()
        throw new Error(`Purchase failed: ${errorText}`)
      }

    } catch (err) {
      console.error('x402 Purchase Error:', err)
      setError(err.message || 'Purchase failed')
      setStatus('error')
    }
  }

  /**
   * Submit transaction hash to backend for verification
   */
  const submitPaymentProof = async (txHash, challengeId) => {
    try {
      setStatus('confirming')

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/presale/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          tx_hash: txHash,
          address,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Verification failed: ${errorText}`)
      }

      const data = await res.json()
      console.log('Payment verified:', data)
      setStatus('confirmed')
      return data

    } catch (err) {
      console.error('Payment verification error:', err)
      setError(err.message || 'Verification failed')
      setStatus('error')
    }
  }

  // Auto-submit proof when transaction is confirmed
  if (isConfirmed && hash && challengeData && status === 'paying') {
    submitPaymentProof(hash, challengeData.challenge_id)
  }

  return {
    purchaseWithX402,
    submitPaymentProof,
    status,
    error,
    isWriting,
    isConfirming,
    isConfirmed,
    txHash: hash,
    challengeData,
  }
}
