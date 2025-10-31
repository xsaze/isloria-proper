import { Viewport as BaseViewport } from 'pixi-viewport';
import { pixiState } from './pixiState';

/**
 * Custom Viewport class that extends pixi-viewport.
 * Automatically accesses the Application from global state and configures plugins.
 */
export class CustomViewport extends BaseViewport {
  constructor(options) {
    // Ensure the Pixi Application is available
    if (!pixiState.pixiApp) {
      throw new Error('Pixi Application must be initialized before creating Viewport');
    }

    // Merge user options with required events system
    super({
      ...options,
      events: pixiState.pixiApp.renderer.events
    });

    // Detect mobile device
    const isMobile = window.innerWidth <= 768;

    // Configure default plugins for camera controls
    this.drag({
      mouseButtons: 'left',
      wheel: false,
      pressDrag: true
    })
    .wheel({
      percent: 0.1,
      smooth: 5,
      trackpadPinch: true,
      center: null
    })
    .pinch({
      noDrag: false,
      percent: 1.0
    })
    .clamp({
      left: 0,        // Ocean left edge (positive coordinate space)
      right: 10000,   // Ocean right edge
      top: 0,         // Ocean top edge
      bottom: 10000,  // Ocean bottom edge
      direction: 'all',
      underflow: 'center'
    })
    .decelerate({
      friction: 0.9,
      bounce: 0.5,
      minSpeed: 0.01
    })
    .clampZoom({
      minScale: isMobile ? 0.15 : 0.5,  // Allow more zoom-out on mobile
      maxScale: 2.0
    });
  }
}
