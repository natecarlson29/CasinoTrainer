import type { Player, HandResult } from '../../types/blackjack';
import { HandDisplay } from '../cards/HandDisplay';
import './PlayerSeat.css';

interface PlayerSeatProps {
  player: Player;
  isActive: boolean;
  showAddRemove: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
}

function resultLabel(result: HandResult): string {
  switch (result) {
    case 'blackjack': return 'BLACKJACK!';
    case 'win': return 'WIN';
    case 'lose': return 'LOSE';
    case 'push': return 'PUSH';
    case 'bust': return 'BUST';
    default: return '';
  }
}

function resultClass(result: HandResult): string {
  switch (result) {
    case 'blackjack':
    case 'win': return 'result-win';
    case 'push': return 'result-push';
    case 'lose':
    case 'bust': return 'result-lose';
    default: return '';
  }
}

export function PlayerSeat({ player, isActive, showAddRemove, onAdd, onRemove }: PlayerSeatProps) {
  // Empty seat - show add button
  if (!player.isActive && !player.isHuman) {
    return (
      <div className="player-seat player-seat-empty">
        {showAddRemove && onAdd && (
          <button className="btn-add-player" onClick={onAdd} title="Add AI player">
            +
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`player-seat ${isActive ? 'player-seat-active' : ''} ${player.isHuman ? 'player-seat-human' : ''}`}>
      {/* Remove button for AI */}
      {showAddRemove && onRemove && !player.isHuman && (
        <button className="btn-remove-player" onClick={onRemove} title="Remove player">
          &minus;
        </button>
      )}

      <div className="seat-name">{player.name}</div>
      {!player.isHuman && <div className="seat-chips">${player.chips}</div>}

      {/* Hands */}
      <div className="seat-hands">
        {player.hands.map((hand, hi) => (
          <div key={hi} className="seat-hand-wrapper">
            <HandDisplay
              cards={hand.cards}
              showValue={true}
              isActive={isActive && player.activeHandIndex === hi}
              label={player.hands.length > 1 ? `Hand ${hi + 1}` : undefined}
            />
            {hand.bet > 0 && (
              <div className="seat-bet">Bet: ${hand.bet}</div>
            )}
            {hand.result && (
              <div className={`seat-result ${resultClass(hand.result)}`}>
                {resultLabel(hand.result)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
