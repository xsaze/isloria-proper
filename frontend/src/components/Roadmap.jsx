import { useState } from 'react';
import './Roadmap.css';

export const Roadmap = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  const roadmapItems = [
    { phase: 'Phase 1', title: 'Foundation', status: 'completed', items: ['Launch Token', 'Build Community', 'Initial Island'] },
    { phase: 'Phase 2', title: 'Expansion', status: 'current', items: ['Dynamic Island Growth', 'NPC System', 'Island Presale'] },
    { phase: 'Phase 3', title: 'Adventure', status: 'upcoming', items: ['Quest System', 'Player Interactions', 'Rewards'] },
    { phase: 'Phase 4', title: 'Evolution', status: 'upcoming', items: ['Personal Island', 'Partnerships', 'Ecosystem Growth'] }
  ];

  return (
    <div className={`roadmap-container ${isMinimized ? 'minimized' : ''}`}>
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="roadmap-expand-btn"
        >
          Roadmap
        </button>
      ) : (
        <>
          <div className="roadmap-header">
            <h2 className="roadmap-title">Roadmap</h2>
            <button
              onClick={() => setIsMinimized(true)}
              className="roadmap-minimize-btn"
            >
              −
            </button>
          </div>

          <div className="roadmap-content">
            {roadmapItems.map((item, index) => (
              <div key={index} className={`roadmap-phase ${item.status}`}>
                <div className="phase-header">
                  <span className="phase-name">{item.phase}</span>
                  <span className="phase-title">{item.title}</span>
                </div>
                <ul className="phase-items">
                  {item.items.map((task, taskIndex) => (
                    <li key={taskIndex}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
