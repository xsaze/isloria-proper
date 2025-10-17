/**
 * Manages network broadcasting to clients
 */

import { gameConfig } from '../config/gameConfig.js';

export class NetworkManager {
    constructor(io, gameState) {
        this.io = io;
        this.gameState = gameState;
        this.lastBroadcastTime = 0;
        this.lastFullStateBroadcast = 0;
        this.connectedClients = 0;

        // OPTIMIZATION: Adaptive broadcast configuration
        this.DELTA_BROADCAST_INTERVAL = gameConfig.BROADCAST_INTERVAL;  // 50ms (20 FPS)
        this.FULL_STATE_INTERVAL = 1000;  // 1 second - periodic full sync
    }

    /**
     * Initialize network event handlers
     */
    initialize() {
        this.io.on('connection', (socket) => {
            this.connectedClients++;
            console.log(`✅ Client connected: ${socket.id} (Total: ${this.connectedClients})`);

            // Send initial game state to new client
            const initialState = this.gameState.getState();
            socket.emit('gameState', initialState);
            console.log(`📤 Sent initial state to ${socket.id}`);

            // MC Control Events
            socket.on('mc:increase', (amount) => {
                this.gameState.increaseMc(amount);
                // Immediately broadcast updated state
                this.io.emit('gameState', this.gameState.getState());
            });

            socket.on('mc:decrease', (amount) => {
                this.gameState.decreaseMc(amount);
                // Immediately broadcast updated state
                this.io.emit('gameState', this.gameState.getState());
            });

            socket.on('mc:reset', () => {
                this.gameState.resetMc();
                // Immediately broadcast updated state
                this.io.emit('gameState', this.gameState.getState());
            });

            socket.on('mc:set', (value) => {
                this.gameState.setMc(value);
                // Immediately broadcast updated state
                this.io.emit('gameState', this.gameState.getState());
            });

            socket.on('disconnect', () => {
                this.connectedClients--;
                console.log(`❌ Client disconnected: ${socket.id} (Total: ${this.connectedClients})`);
            });

            socket.on('error', (error) => {
                console.error(`⚠️ Socket error from ${socket.id}:`, error);
            });
        });

        console.log('✅ NetworkManager initialized');
    }

    /**
     * Broadcast game state to all clients (throttled with delta compression)
     * Called every frame but only broadcasts at configured rate
     * OPTIMIZED: Sends delta updates (only changes) most of the time,
     * with periodic full state for synchronization
     */
    broadcastState(currentTime) {
        // Check if it's time to broadcast
        if (currentTime - this.lastBroadcastTime < this.DELTA_BROADCAST_INTERVAL) {
            return;  // Not time yet
        }

        // Determine if we should send full state or delta
        const shouldSendFullState = (currentTime - this.lastFullStateBroadcast >= this.FULL_STATE_INTERVAL);

        if (shouldSendFullState) {
            // Send full state (periodic sync)
            const state = this.gameState.getState();
            this.io.emit('gameState', state);
            this.lastFullStateBroadcast = currentTime;
            this.lastBroadcastTime = currentTime;
            this.gameState.clearDeltaState();  // Clear delta tracking
        } else {
            // Send delta update (only changes)
            const delta = this.gameState.getDeltaState();

            if (delta) {
                // Only broadcast if there are changes
                this.io.emit('gameStateDelta', delta);
                this.gameState.clearDeltaState();
            }

            this.lastBroadcastTime = currentTime;
        }
    }

    /**
     * Get number of connected clients
     */
    getClientCount() {
        return this.connectedClients;
    }
}
