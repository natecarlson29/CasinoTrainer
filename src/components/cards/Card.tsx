import type { Card as CardType } from '../../types/card';
import { suitColor, suitSymbol } from '../../types/card';
import './Card.css';

interface CardProps {
  card: CardType;
  style?: React.CSSProperties;
  className?: string;
}

export function CardComponent({ card, style, className = '' }: CardProps) {
  if (!card.faceUp) {
    return (
      <div className={`card card-back ${className}`} style={style}>
        <div className="card-back-pattern" />
      </div>
    );
  }

  const color = suitColor(card.suit);
  const symbol = suitSymbol(card.suit);

  return (
    <div className={`card card-face ${className}`} style={style}>
      <div className={`card-corner card-corner-top color-${color}`}>
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
      <div className={`card-center color-${color}`}>
        <span className="card-suit-large">{symbol}</span>
      </div>
      <div className={`card-corner card-corner-bottom color-${color}`}>
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
    </div>
  );
}
