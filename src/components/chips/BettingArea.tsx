import { useGame } from '../../context/GameContext';
import { CHIP_DENOMINATIONS } from '../../types/common';
import { Chip } from './Chip';
import './BettingArea.css';

export function BettingArea() {
  const { state, dispatch } = useGame();
  const humanPlayer = state.players.find(p => p.isHuman);
  if (!humanPlayer) return null;

  const currentBet = humanPlayer.hands.length > 0 ? humanPlayer.hands[0].bet : 0;
  const chips = humanPlayer.chips;

  return (
    <div className="betting-area">
      <div className="betting-current">
        <span className="betting-label">Your Bet</span>
        <span className="betting-amount">${currentBet}</span>
      </div>
      <div className="betting-chips">
        {CHIP_DENOMINATIONS.map(d => (
          <Chip
            key={d}
            denomination={d}
            onClick={() => dispatch({ type: 'PLACE_BET', amount: d })}
            disabled={d > chips - currentBet}
          />
        ))}
      </div>
      <div className="betting-actions">
        <button
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'CLEAR_BET' })}
          disabled={currentBet === 0}
        >
          Clear
        </button>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'CONFIRM_BETS' })}
          disabled={currentBet === 0}
        >
          Deal
        </button>
      </div>
    </div>
  );
}
