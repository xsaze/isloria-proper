import { BRANDING } from '../config/branding';
import { usePresaleStatus } from '../hooks/usePresaleStatus';
import './Presale.css';

export const Presale = () => {
  const { isActive, isLoading } = usePresaleStatus();

  const handlePresaleClick = () => {
    if (!isActive) return;
    // Route to island subdomain
    window.location.href = BRANDING.presaleUrl;
  };

  return (
    <div className="presale-container">
      <button
        onClick={handlePresaleClick}
        className={`presale-btn ${!isActive ? 'presale-btn-disabled' : ''}`}
        disabled={!isActive || isLoading}
        title={!isActive ? 'Presale not yet active' : 'Visit presale page'}
      >
        {isLoading ? 'Loading...' : isActive ? 'Presale' : 'Presale (Soon)'}
      </button>
    </div>
  );
};
