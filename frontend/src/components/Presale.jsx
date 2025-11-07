import { BRANDING } from '../config/branding';
import './Presale.css';

export const Presale = () => {
  const handlePresaleClick = () => {
    // Route to island subdomain
    window.location.href = BRANDING.presaleUrl;
  };

  return (
    <div className="presale-container">
      <button
        onClick={handlePresaleClick}
        className="presale-btn"
      >
        Presale
      </button>
    </div>
  );
};
