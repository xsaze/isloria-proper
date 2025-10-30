import {
  Application,
  extend
} from '@pixi/react'
import {
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
} from 'pixi.js'
import { Npc } from "./Npc";
import { IslandRenderer } from "./IslandRenderer";
import { OceanBackground } from "./OceanBackground";
import { Roadmap } from "./Roadmap";
import { tileLoader } from '../helpers/TileLoader';
import { useEffect, useState } from 'react';


extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite
})

export const GameCanvas = ({ frames, gameState, socket }) => {

  // Track tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Price polling state
  const [priceAddress, setPriceAddress] = useState('...pump');
  const [isPolling, setIsPolling] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);

  // Control panel minimize state
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Load tiles on mount
  useEffect(() => {
    const loadTiles = async () => {
      try {
        await tileLoader.load();
        setTilesLoaded(true);
      } catch (error) {
        console.error('Failed to load tiles:', error);
      }
    };

    loadTiles();
  }, []);

  // Listen for price polling status updates
  useEffect(() => {
    if (!socket) return;

    const handlePriceStatus = (status) => {
      setIsPolling(status.isPolling);
      setPriceAddress(status.address);
      setLastPrice(status.lastPrice);
    };

    socket.on('price:status', handlePriceStatus);

    // Request initial status
    socket.emit('price:getStatus');

    return () => {
      socket.off('price:status', handlePriceStatus);
    };
  }, [socket]);

  // Get MC and island data from backend gameState
  const mc = gameState?.mc || 0;
  const islandData = gameState?.island || null;
  const walkableGrid = islandData?.walkableGrid || null;

  // MC control functions - emit socket events to backend
  const increaseMc = () => {
    if (socket) {
      socket.emit('mc:increase', 10000);
    }
  };

  const decreaseMc = () => {
    if (socket) {
      socket.emit('mc:decrease', 10000);
    }
  };

  const resetState = () => {
    if (socket) {
      socket.emit('game:reset');
    }
  };

  // Price polling control functions
  const startPolling = () => {
    if (socket) {
      socket.emit('price:start');
    }
  };

  const stopPolling = () => {
    if (socket) {
      socket.emit('price:stop');
    }
  };

  const updateAddress = () => {
    if (socket && priceAddress) {
      socket.emit('price:setAddress', priceAddress);
    }
  };

  if (!frames) {
    return <div>Loading frames...</div>;
  }

  // Extract NPCs array from gameState, or use empty array as fallback
  const npcs = gameState?.npcs ? Object.entries(gameState.npcs) : [];

  // Calculate offset to center everything on screen
  // The island's center tile should be at the screen center
  const gridSize = islandData?.gridSize || 5;
  const centerTile = Math.floor(gridSize / 2);

  // Calculate where the center tile is in world coordinates (backend coordinate system)
  const TILE_WIDTH = 64;
  const TILE_HEIGHT = 32;
  const backendOriginX = 400;
  const backendOriginY = 200;
  const islandCenterX = ((centerTile - centerTile) * (TILE_WIDTH / 2)) + backendOriginX;
  const islandCenterY = ((centerTile + centerTile) * (TILE_HEIGHT / 2)) + backendOriginY;

  // Calculate offset to center the island's center tile on screen
  const centerOffsetX = (window.innerWidth / 2) - islandCenterX;
  const centerOffsetY = (window.innerHeight / 2) - islandCenterY;

  return (
    <>
      {/* Roadmap */}
      <Roadmap />

      {/* MC Control Interface - Hidden in production */}
      {import.meta.env.VITE_NODE_ENV !== 'production' && (
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: isPanelMinimized ? '8px' : '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        minWidth: isPanelMinimized ? 'auto' : '280px',
        transition: 'all 0.3s ease'
      }}>
        {isPanelMinimized ? (
          <button
            onClick={() => setIsPanelMinimized(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
        ) : (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                MC Control Panel
              </div>
              <button
                onClick={() => setIsPanelMinimized(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                −
              </button>
            </div>
            <div style={{
              fontSize: '24px',
              marginBottom: '15px',
              textAlign: 'center',
              color: mc >= 0 ? '#4ade80' : '#f87171'
            }}>
              {mc.toLocaleString()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
              <button
                onClick={increaseMc}
                style={{
                  padding: '8px 12px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                + 10,000
              </button>
              <button
                onClick={decreaseMc}
                style={{
                  padding: '8px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                - 10,000
              </button>
              <button
                onClick={resetState}
                style={{
                  padding: '8px 12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Reset
              </button>
            </div>

            {/* Price Polling Section */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '15px'
            }}>
              <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>
                Birdseye Price Polling
              </div>

              {/* Status Indicator */}
              <div style={{
                marginBottom: '10px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isPolling ? '#22c55e' : '#6b7280'
                }} />
                <span>
                  {isPolling ? 'Polling Active' : 'Polling Stopped'}
                </span>
              </div>

              {/* Last Price Display */}
              {lastPrice !== null && (
                <div style={{
                  marginBottom: '10px',
                  fontSize: '11px',
                  color: '#9ca3af'
                }}>
                  Last Price: ${lastPrice.toFixed(8)}
                </div>
              )}

              {/* Address Input */}
              <input
                type="text"
                value={priceAddress}
                onChange={(e) => setPriceAddress(e.target.value)}
                placeholder="Token Address"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />

              {/* Update Address Button */}
              <button
                onClick={updateAddress}
                disabled={isPolling}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  marginBottom: '8px',
                  background: isPolling ? '#374151' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isPolling ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: isPolling ? 0.5 : 1
                }}
              >
                Update Address
              </button>

              {/* Start/Stop Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={startPolling}
                  disabled={isPolling}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: isPolling ? '#065f46' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isPolling ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: isPolling ? 0.5 : 1
                  }}
                >
                  Start
                </button>
                <button
                  onClick={stopPolling}
                  disabled={!isPolling}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: !isPolling ? '#7f1d1d' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !isPolling ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    opacity: !isPolling ? 0.5 : 1
                  }}
                >
                  Stop
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* Game Canvas */}
      <div
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <Application resizeTo={window}>
          <container
            sortableChildren
          >
            {/* Render Ocean Background (simple colored rectangle) */}
            <OceanBackground />

            {/* Render Island (if tiles are loaded) */}
            {tilesLoaded && islandData && (
              <IslandRenderer
                islandData={islandData}
                x={0}
                y={0}
              />
            )}

            {/* Render NPCs on top of island */}
            {npcs.map(([npcId, npcData]) => {
              // Adjust NPC position by half tile north to align with visual tile center
              // In isometric view, half tile = 16px up
              const npcYAdjustment = -24;
              return (
                <Npc
                  key={npcId}
                  frames={frames}
                  npcType={npcData.npcType || 'stag'}
                  x={npcData.x + centerOffsetX}
                  y={npcData.y + centerOffsetY + npcYAdjustment}
                  state={npcData.state || 'idle'}
                  direction={npcData.direction || 'NE'}
                />
              );
            })}
          </container>
        </Application>
      </div>
    </>
  )
}