import './Presale.css';

export const Presale = () => {
  const handlePresaleClick = () => {
    // Route to island subdomain
    window.location.href = 'https://island.binaria.fun';
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
