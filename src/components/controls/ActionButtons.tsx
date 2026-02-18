import { useGame } from '../../context/GameContext';
import { canSplit, canDoubleDown } from '../../engine/hand';
import type { PlayerAction } from '../../types/blackjack';
import './ActionButtons.css';

export function ActionButtons() {
  const { state, dispatch, optimalPlay } = useGame();
  const playerIdx = state.activePlayerIndex;
  const player = state.players[playerIdx];
  if (!player || !player.isHuman) return null;

  const hand = player.hands[player.activeHandIndex];
  if (!hand || hand.cards.length < 2) return null;

  const canSplitNow = canSplit(hand, player.chips);
  const canDoubleNow = canDoubleDown(hand, player.chips);
  const optimal = optimalPlay?.action;

  const actions: { action: PlayerAction; label: string; disabled: boolean }[] = [
    { action: 'hit', label: 'Hit', disabled: false },
    { action: 'stand', label: 'Stand', disabled: false },
    { action: 'double', label: 'Double', disabled: !canDoubleNow },
    { action: 'split', label: 'Split', disabled: !canSplitNow },
  ];

  return (
    <div className="action-buttons">
      {actions.map(({ action, label, disabled }) => (
        <button
          key={action}
          className={`action-btn ${optimal === action ? 'action-btn-optimal' : ''}`}
          disabled={disabled}
          onClick={() => dispatch({ type: 'PLAYER_ACTION', action })}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
