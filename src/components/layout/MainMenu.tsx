import './MainMenu.css';

interface MainMenuProps {
  onSelectBlackjack: () => void;
}

export function MainMenu({ onSelectBlackjack }: MainMenuProps) {
  return (
    <div className="main-menu">
      <div className="menu-header">
        <h1 className="menu-title">Casino Trainer</h1>
        <p className="menu-subtitle">Master the art of perfect play</p>
      </div>
      <div className="menu-options">
        <button className="menu-card menu-card-active" onClick={onSelectBlackjack}>
          <span className="menu-card-icon">🃏</span>
          <span className="menu-card-title">Blackjack</span>
          <span className="menu-card-desc">Learn perfect basic strategy</span>
        </button>
        <button className="menu-card menu-card-disabled" disabled>
          <span className="menu-card-icon">♠️</span>
          <span className="menu-card-title">Poker</span>
          <span className="menu-card-desc">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
