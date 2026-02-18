import type { Card as CardType } from '../../types/card';
import { CardComponent } from './Card';
import { handValue } from '../../engine/hand';
import './HandDisplay.css';

interface HandDisplayProps {
  cards: CardType[];
  showValue?: boolean;
  isActive?: boolean;
  label?: string;
}

export function HandDisplay({ cards, showValue = true, isActive = false, label }: HandDisplayProps) {
  if (cards.length === 0) return null;

  const allFaceUp = cards.every(c => c.faceUp);
  const value = allFaceUp ? handValue(cards) : null;
  // Show visible value (first card only if dealer has hole card)
  const visibleValue = cards.filter(c => c.faceUp).length > 0
    ? handValue(cards.filter(c => c.faceUp))
    : null;

  return (
    <div className={`hand-display ${isActive ? 'hand-active' : ''}`}>
      {label && <div className="hand-label">{label}</div>}
      <div className="hand-cards">
        {cards.map((card, i) => (
          <CardComponent
            key={i}
            card={card}
            className="card-deal"
            style={{ marginLeft: i > 0 ? '-24px' : '0', zIndex: i }}
          />
        ))}
      </div>
      {showValue && (
        <div className="hand-value">
          {allFaceUp ? value : visibleValue !== null ? `${visibleValue}` : ''}
        </div>
      )}
    </div>
  );
}
