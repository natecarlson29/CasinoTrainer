import type { Card } from '../types/card';
import { handValue, isSoft } from './hand';
import { drawCard } from './shoe';

export function playDealerHand(
  dealerCards: Card[],
  shoe: Card[]
): { finalCards: Card[]; shoe: Card[] } {
  let cards = dealerCards.map(c => ({ ...c, faceUp: true }));
  let currentShoe = shoe;

  while (shouldDealerHit(cards)) {
    const result = drawCard(currentShoe, true);
    cards = [...cards, result.card];
    currentShoe = result.shoe;
  }

  return { finalCards: cards, shoe: currentShoe };
}

function shouldDealerHit(cards: Card[]): boolean {
  const value = handValue(cards);
  if (value < 17) return true;
  // Dealer hits soft 17
  if (value === 17 && isSoft(cards)) return true;
  return false;
}
