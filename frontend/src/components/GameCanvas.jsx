import {
  Application,
  extend
} from '@pixi/react'
import {
  Container,
  Graphics,
  AnimatedSprite,
  Sprite,
  Text
} from 'pixi.js'
import { Npc } from "./Npc";
import { IslandRenderer } from "./IslandRenderer";
import { OceanBackground } from "./OceanBackground";
import { Roadmap } from "./Roadmap";
import { MobileTutorialOverlay } from "./MobileTutorialOverlay";
import { tileLoader } from '../helpers/TileLoader';
import { CustomViewport } from '../helpers/CustomViewport';
import { pixiState } from '../helpers/pixiState';
import { getDefaultZoom } from '../helpers/viewportZoom';
import { useEffect, useState, useMemo, useRef } from 'react';


extend({
  Container,
  Graphics,
  AnimatedSprite,
  Sprite,
  Text,
  Viewport: CustomViewport
})

export const GameCanvas = ({ frames, gameState, socket }) => {

  // Track tile loading state
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // Track when Pixi Application is ready
  const [isAppReady, setIsAppReady] = useState(false);

  // Viewport ref
  const viewportRef = useRef(null);

  // Track if viewport has been initially centered (to prevent re-centering on updates)
  const hasInitializedViewport = useRef(false);

  // Price polling state
  const [priceAddress, setPriceAddress] = useState('...pump');
  const [isPolling, setIsPolling] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);

  // Control panel minimize state
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Mobile tutorial overlay state
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if tutorial should be shown on mobile
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    const hasSeenTutorial = localStorage.getItem('hasSeenMobileTutorial');

    if (isMobile && !hasSeenTutorial && isAppReady) {
      setShowTutorial(true);
    }
  }, [isAppReady]);

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenMobileTutorial', 'true');
  };

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

  // Calculate world bounds based on ocean (not island)
  // Ocean spans (0, 0) to (10000, 10000) in positive coordinate space
  const worldBounds = useMemo(() => {
    return {
      worldWidth: 10000,   // Match OceanBackground size
      worldHeight: 10000,  // Match OceanBackground size
      centerX: 5000,       // Ocean center in positive coordinate space
      centerY: 5000        // Ocean center in positive coordinate space
    };
  }, []); // Static - ocean size doesn't change

  // Handle Application initialization
  const handleAppInit = (app) => {
    // Store app in global state
    pixiState.pixiApp = app;

    // Mark app as ready
    setIsAppReady(true);
  };

  // Center viewport on ocean/island center when ready (only once at initialization)
  useEffect(() => {
    // Only center once, when app first becomes ready
    if (!isAppReady || !viewportRef.current || hasInitializedViewport.current) {
      return;
    }

    // Mobile needs double-resize to ensure dimensions are correct
    const isMobile = window.innerWidth <= 768;
    const defaultZoom = getDefaultZoom(mc, isMobile);

    const timer = setTimeout(() => {
      if (viewportRef.current) {
        // Force viewport to sync with current window dimensions
        viewportRef.current.resize(window.innerWidth, window.innerHeight);

        // Mobile: Second resize after brief delay to ensure dimensions are fully updated
        if (isMobile) {
          setTimeout(() => {
            if (viewportRef.current) {
              viewportRef.current.resize(window.innerWidth, window.innerHeight);

              // Center viewport on ocean center (5000, 5000) with default zoom 1.0
              viewportRef.current.moveCenter(5000, 5000);
              viewportRef.current.setZoom(1.0, false);

              hasInitializedViewport.current = true; // Mark as initialized

              // Immediately animate to the MC-based zoom level for smooth transition
              setTimeout(() => {
                if (viewportRef.current) {
                  viewportRef.current.animate({
                    scale: defaultZoom,
                    time: 500,
                    ease: 'easeInOutSine'
                  });
                }
              }, 100);
            }
          }, 50);
        } else {
          // Desktop: Center and set default zoom 1.0
          viewportRef.current.moveCenter(5000, 5000);
          viewportRef.current.setZoom(1.0, false);

          hasInitializedViewport.current = true; // Mark as initialized

          // Immediately animate to the MC-based zoom level for smooth transition
          setTimeout(() => {
            if (viewportRef.current) {
              viewportRef.current.animate({
                scale: defaultZoom,
                time: 500,
                ease: 'easeInOutSine'
              });
            }
          }, 100);
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isAppReady, islandData, tilesLoaded, mc]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewportRef.current) {
        viewportRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle double click/tap to reset viewport
  useEffect(() => {
    if (!viewportRef.current || !isAppReady) return;

    const viewport = viewportRef.current;
    const isMobile = window.innerWidth <= 768;
    let lastClickTime = 0;

    const handleClick = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastClickTime;

      // If two clicks/taps within 400ms, it's a double click/tap
      if (timeDiff < 400 && timeDiff > 0) {
        // Calculate default zoom based on current MC
        const defaultZoom = getDefaultZoom(mc, isMobile);

        // Animate viewport to center with smooth transition
        viewport.animate({
          position: { x: 5000, y: 5000 },
          scale: defaultZoom,
          time: 500,
          ease: 'easeInOutSine'
        });
        lastClickTime = 0; // Reset to prevent triple click
      } else {
        lastClickTime = currentTime;
      }
    };

    // Use pixi-viewport's 'clicked' event
    viewport.on('clicked', handleClick);

    return () => {
      viewport.off('clicked', handleClick);
    };
  }, [isAppReady, mc]);

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

  return (
    <>
      {/* Roadmap */}
      <Roadmap />

      {/* Mobile Tutorial Overlay */}
      <MobileTutorialOverlay
        isVisible={showTutorial}
        onDismiss={handleTutorialDismiss}
      />

      {/* MC Control Interface - Hidden in production */}
      {/* {import.meta.env.DEV && ( */}
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
      {/* )} */}

      {/* Game Canvas */}
      <div
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <Application resizeTo={window} onInit={handleAppInit}>
          {/* Only render viewport after app is ready */}
          {isAppReady && (
            <pixiViewport
              ref={viewportRef}
              screenWidth={window.innerWidth}
              screenHeight={window.innerHeight}
              worldWidth={worldBounds.worldWidth}
              worldHeight={worldBounds.worldHeight}
            >
              <container sortableChildren>
                {/* Render Ocean Background (simple colored rectangle) */}
                <OceanBackground />

                {/* Render Island (if tiles are loaded) */}
                {/* Tiles position themselves at (5000, 5000) via gridToWorld() function */}
                {tilesLoaded && islandData && (
                  <IslandRenderer
                    islandData={islandData}
                    viewportRef={viewportRef}
                    x={0}
                    y={0}
                  />
                )}

                {/* Render NPCs on top of island */}
                {/* NPCs must be offset to match island position in positive coordinate space */}
                {npcs.map(([npcId, npcData]) => {
                  // Adjust NPC position by half tile north to align with visual tile center
                  // In isometric view, half tile = 16px up
                  const npcYAdjustment = -24;
                  return (
                    <Npc
                      key={npcId}
                      frames={frames}
                      npcType={npcData.npcType || 'stag'}
                      x={npcData.x + 4600}
                      y={npcData.y + 3520 + npcYAdjustment}
                      state={npcData.state || 'idle'}
                      direction={npcData.direction || 'NE'}
                    />
                  );
                })}
              </container>
            </pixiViewport>
          )}
        </Application>
      </div>
    </>
  )
}