import { useGame } from '../../context/GameContext';
import './StrategyHint.css';

export function StrategyHint() {
  const { optimalPlay } = useGame();
  if (!optimalPlay) return null;

  return (
    <div className="strategy-hint">
      <div className="hint-icon">💡</div>
      <div className="hint-text">{optimalPlay.reason}</div>
    </div>
  );
}
