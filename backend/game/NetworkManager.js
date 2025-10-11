/**
 * Manages network broadcasting to clients
 */

import { gameConfig } from '../config/gameConfig.js';

export class NetworkManager {
    constructor(io, gameState) {
        this.io = io;
        this.gameState = gameState;
        this.lastBroadcastTime = 0;
        this.connectedClients = 0;
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
     * Broadcast game state to all clients (throttled)
     * Called every frame but only broadcasts at configured rate
     */
    broadcastState(currentTime) {
        // Throttle broadcasts to configured rate (e.g., 30 FPS)
        if (currentTime - this.lastBroadcastTime >= gameConfig.BROADCAST_INTERVAL) {
            const state = this.gameState.getState();
            this.io.emit('gameState', state);
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
