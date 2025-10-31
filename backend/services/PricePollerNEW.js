import axios from 'axios';

export class PricePoller {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
        this.address = process.env.DEFAULT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
        this.isPolling = false;
        this.pollInterval = null;
        this.POLL_INTERVAL_MS = 1300; // 1.3s polling interval
        this.API_KEY = process.env.MORALIS_API_KEY || 'YOUR_API_KEY_HERE';
        this.lastPrice = null;
        this.chain = 'bsc'; // Change to 'bsc', 'polygon', etc. if needed
    }

    /**
     * Start polling the Moralis API
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

        // Then poll periodically
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

        if (wasPolling) {
            this.stop();
        }

        console.log(`📝 Updating address from ${this.address} to ${newAddress}`);
        this.address = newAddress;
        this.lastPrice = null;

        if (wasPolling) {
            this.start();
        }
    }

    /**
     * Fetch price from Moralis API
     */
    async fetchPrice() {
        const url = `https://deep-index.moralis.io/api/v2.2/erc20/${this.address}/price?chain=${this.chain}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    accept: 'application/json',
                    'X-API-Key': this.API_KEY,
                },
            });

            if (response.data && response.data.usdPrice !== undefined) {
                const price = response.data.usdPrice;

                // Convert price to MC value (example scaling, same as before)
                const mcValue = Math.floor(price * 1_000_000_000);

                if (this.lastPrice !== price) {
                    console.log(`💰 Price updated: $${price.toFixed(6)} → MC: ${mcValue.toLocaleString()}`);
                    this.gameState.setMc(mcValue);
                    this.lastPrice = price;

                    // Immediately broadcast updated game state
                    if (this.networkManager && this.networkManager.io) {
                        this.networkManager.io.emit('gameState', this.gameState.getState());
                        console.log('📤 Immediate broadcast sent for price update');
                    }
                }
            } else {
                console.warn('⚠️ Invalid API response format:', response.data);
            }
        } catch (error) {
            console.error('❌ Error fetching price from Moralis API:', error.message);
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
            lastPrice: this.lastPrice,
        };
    }
}
