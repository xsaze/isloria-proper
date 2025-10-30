import { useState } from 'react';
import './Roadmap.css';

export const Roadmap = () => {
  const [isMinimized, setIsMinimized] = useState(true);

  const roadmapItems = [
    {
      phase: 'Phase 1',
      title: 'Foundation',
      items: [
        { task: 'Launch Token', status: 'completed' },
        { task: 'Build Community', status: 'completed' },
        { task: 'Initial Island', status: 'completed' }
      ]
    },
    {
      phase: 'Phase 2',
      title: 'Expansion',
      items: [
        { task: 'Dynamic Island Growth', status: 'completed' },
        { task: 'NPC System', status: 'completed' },
        { task: 'Island Presale', status: 'current' }
      ]
    },
    {
      phase: 'Phase 3',
      title: 'Adventure',
      items: [
        { task: 'Quest System', status: 'upcoming' },
        { task: 'Player Interactions', status: 'upcoming' },
        { task: 'Rewards', status: 'upcoming' }
      ]
    },
    {
      phase: 'Phase 4',
      title: 'Evolution',
      items: [
        { task: 'Personal Island', status: 'upcoming' },
        { task: 'Partnerships', status: 'upcoming' },
        { task: 'Ecosystem Growth', status: 'upcoming' }
      ]
    }
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
            {roadmapItems.map((item, index) => {
              const allCompleted = item.items.every(i => i.status === 'completed');
              const hasAnyProgress = item.items.some(i => i.status === 'completed' || i.status === 'current');
              const phaseStatus = allCompleted ? 'completed' : hasAnyProgress ? 'current' : 'upcoming';

              return (
                <div key={index} className={`roadmap-phase ${phaseStatus}`}>
                  <div className="phase-header">
                    <span className="phase-name">{item.phase}</span>
                    <span className="phase-title">{item.title}</span>
                  </div>
                  <ul className="phase-items">
                    {item.items.map((task, taskIndex) => (
                      <li key={taskIndex} className={task.status}>{task.task}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
