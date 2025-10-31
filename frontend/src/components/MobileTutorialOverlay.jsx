import { useState, useEffect } from 'react';

export const MobileTutorialOverlay = ({ isVisible, onDismiss }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Fade in
      setIsAnimating(true);

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleDismiss = () => {
    setIsAnimating(false);
    // Wait for fade-out animation before calling onDismiss
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  if (!isVisible && !isAnimating) return null;

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        opacity: isAnimating ? 1 : 0,
        transition: 'opacity 0.3s ease',
        cursor: 'pointer'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #e8d5b5 0%, #d4c4a8 50%, #c4b398 100%)',
          border: '3px solid #6b5639',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '320px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          textAlign: 'center'
        }}
      >
        {/* Pinch gesture icon */}
        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'pinch 2s ease-in-out infinite'
          }}
        >
          🤏
        </div>

        {/* Instructions */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            color: '#3d2817',
            fontSize: '16px',
            fontWeight: 'bold',
            lineHeight: '1.6',
            textShadow: '0 1px 0 rgba(255, 255, 255, 0.6)'
          }}
        >
          <div style={{ marginBottom: '8px' }}>🤏 Pinch to zoom</div>
          <div style={{ marginBottom: '8px' }}>👆 Drag to pan</div>
          <div>👆👆 Double tap to reset</div>
        </div>

        {/* Tap to dismiss hint */}
        <div
          style={{
            marginTop: '16px',
            fontSize: '12px',
            color: '#6b5639',
            fontStyle: 'italic',
            fontFamily: "'Georgia', serif"
          }}
        >
          Tap anywhere to dismiss
        </div>
      </div>

      <style>{`
        @keyframes pinch {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};
