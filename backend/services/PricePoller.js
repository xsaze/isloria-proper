/**
 * PricePoller - Polls Birdseye API for token price and updates MC
 */

import axios from 'axios';

export class PricePoller {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
        this.address = '5UwJMRYzXQNSyi7z7dPbFXP8Vzu7csD35bdyU8P9pump'; // Default address
        this.isPolling = false;
        this.pollInterval = null;
        this.POLL_INTERVAL_MS = 1100; // 1100ms polling interval
        this.API_KEY = 'cdb14cd3cc944cc5aaaaef35e3b2be76';
        this.lastPrice = null;
    }

    /**
     * Start polling the Birdseye API
     */
    start() {
        if (this.isPolling) {
            console.log('⚠️ Price polling already active');
            return;
        }

        console.log(`🚀 Starting price polling for address: ${this.address}`);
        this.isPolling = true;

        // Make initial request immediately
        this.fetchPrice();

        // Then poll every 1100ms
        this.pollInterval = setInterval(() => {
            this.fetchPrice();
        }, this.POLL_INTERVAL_MS);
    }

    /**
     * Stop polling
     */
    stop() {
        if (!this.isPolling) {
            console.log('⚠️ Price polling not active');
            return;
        }

        console.log('🛑 Stopping price polling');
        this.isPolling = false;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Update the token address
     */
    setAddress(newAddress) {
        const wasPolling = this.isPolling;

        // Stop polling if active
        if (wasPolling) {
            this.stop();
        }

        console.log(`📝 Updating address from ${this.address} to ${newAddress}`);
        this.address = newAddress;
        this.lastPrice = null; // Reset last price

        // Restart polling if it was active
        if (wasPolling) {
            this.start();
        }
    }

    /**
     * Fetch price from Birdseye API
     */
    async fetchPrice() {
        try {
            const response = await axios.get('https://public-api.birdeye.so/defi/price', {
                params: {
                    address: this.address,
                    ui_amount_mode: 'raw'
                },
                headers: {
                    'X-API-KEY': this.API_KEY,
                    'x-chain': 'solana'
                }
            });

            if (response.data && response.data.data && response.data.data.value !== undefined) {
                const price = response.data.data.value;

                // Convert price to MC value (multiply by 1,000,000 for better scale)
                const mcValue = Math.floor(price * 1000000000);

                // Update MC if price changed
                if (this.lastPrice !== price) {
                    console.log(`💰 Price updated: ${price} → MC: ${mcValue.toLocaleString()}`);
                    this.gameState.setMc(mcValue);
                    this.lastPrice = price;

                    // Immediately broadcast full state to ensure all tile changes are sent at once
                    // This bypasses the throttled delta system to prevent batching
                    if (this.networkManager && this.networkManager.io) {
                        this.networkManager.io.emit('gameState', this.gameState.getState());
                        console.log(`📤 Immediate broadcast sent for price update`);
                    }
                }
            } else {
                console.warn('⚠️ Invalid API response format:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching price from Birdseye API:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
        }
    }

    /**
     * Get current polling status
     */
    getStatus() {
        return {
            isPolling: this.isPolling,
            address: this.address,
            lastPrice: this.lastPrice
        };
    }
}
