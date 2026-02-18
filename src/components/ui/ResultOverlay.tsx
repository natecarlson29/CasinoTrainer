import { useEffect, useState, useRef } from 'react';
import type { HandResult } from '../../types/blackjack';
import './ResultOverlay.css';

interface ResultOverlayProps {
  result: HandResult;
}

interface Confetto {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

const CONFETTI_COLORS = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#ff9ff3', '#54a0ff', '#5f27cd'];

function generateConfetti(count: number): Confetto[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 6,
  }));
}

function getOverlayText(result: HandResult): string {
  switch (result) {
    case 'blackjack': return 'BLACKJACK!';
    case 'win': return 'YOU WIN!';
    case 'lose': return 'YOU LOSE';
    case 'bust': return 'BUST!';
    case 'push': return 'PUSH';
    default: return '';
  }
}

function getOverlayClass(result: HandResult): string {
  switch (result) {
    case 'blackjack': return 'overlay-blackjack';
    case 'win': return 'overlay-win';
    case 'lose':
    case 'bust': return 'overlay-lose';
    case 'push': return 'overlay-push';
    default: return '';
  }
}

export function ResultOverlay({ result }: ResultOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const confettiRef = useRef<Confetto[]>([]);
  const prevResult = useRef<HandResult>(null);

  useEffect(() => {
    if (result && result !== prevResult.current) {
      prevResult.current = result;
      if (result === 'blackjack') {
        confettiRef.current = generateConfetti(50);
      } else {
        confettiRef.current = [];
      }
      setVisible(true);
      setFading(false);

      const fadeTimer = setTimeout(() => setFading(true), 1800);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 2500);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } else if (!result) {
      prevResult.current = null;
      setVisible(false);
    }
  }, [result]);

  if (!visible || !result) return null;

  const text = getOverlayText(result);
  const cls = getOverlayClass(result);
  const isBlackjack = result === 'blackjack';

  return (
    <div className={`result-overlay ${fading ? 'result-overlay-fade' : ''}`}>
      {isBlackjack && (
        <div className="confetti-container">
          {confettiRef.current.map(c => (
            <div
              key={c.id}
              className="confetto"
              style={{
                left: `${c.left}%`,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                backgroundColor: c.color,
                width: `${c.size}px`,
                height: `${c.size * 0.6}px`,
                transform: `rotate(${c.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div className={`result-overlay-text ${cls}`}>
        {text}
      </div>
    </div>
  );
}
