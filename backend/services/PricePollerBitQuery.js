/**
 * PricePoller - Polls BitQuery GraphQL API for Four.meme token price and updates MC
 */

export class PricePoller {
    constructor(gameState, networkManager) {
        this.gameState = gameState;
        this.networkManager = networkManager;
        this.address = process.env.DEFAULT_TOKEN_ADDRESS || 'coming soon';
        this.isPolling = false;
        this.pollInterval = null;
        this.POLL_INTERVAL_MS = 1300; // 1300ms polling interval
        this.API_KEY = process.env.BITQUERY_API_KEY;
        this.lastPrice = null;
    }

    /**
     * Start polling the BitQuery API
     */
    start() {
        if (this.isPolling) {
            console.log('⚠️ Price polling already active');
            return;
        }

        console.log(`🚀 Starting price polling for Four.meme token: ${this.address}`);
        this.isPolling = true;

        // Make initial request immediately
        this.fetchPrice();

        // Then poll every 1300ms
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
     * Fetch price from BitQuery GraphQL API
     */
    async fetchPrice() {
        try {
            // Build GraphQL query for Four.meme token price
            const query = `
            {
                Trading {
                    Pairs(
                        where: {
                            Price: {IsQuotedInUsd: true}
                            Market: {
                                Protocol: {is: "fourmeme_v1"}
                                Network: {is: "Binance Smart Chain"}
                            }
                            Token: {Address: {is: "${this.address}"}}
                        }
                    ) {
                        Price {
                            Average {Mean}
                        }
                    }
                }
            }
            `;

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({ query })
            };

            const response = await fetch('https://streaming.bitquery.io/graphql', options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check for GraphQL errors
            if (result.errors) {
                console.error('❌ GraphQL errors:', result.errors);
                return;
            }

            // BitQuery returns: { data: { Trading: { Pairs: [{ Price: { Average: { Mean: number } } }] } } }
            const pairs = result.data?.Trading?.Pairs;

            if (pairs && pairs.length > 0 && pairs[0].Price?.Average?.Mean !== undefined) {
                const price = pairs[0].Price.Average.Mean;

                // Convert price to MC value (multiply by 1,000,000,000 for better scale)
                const mcValue = Math.floor(price * 1000000000);

                // Update MC if price changed
                if (this.lastPrice !== price) {
                    console.log(`💰 Price updated: $${price} → MC: ${mcValue.toLocaleString()}`);
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
                console.warn('⚠️ No trading pairs found for token:', this.address);
            }
        } catch (error) {
            console.error('❌ Error fetching price from BitQuery API:', error.message);
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
