import type { Card } from '../types/card';
import { SUITS, RANKS } from '../types/card';
import { DECK_COUNT, CUT_CARD_RATIO } from '../types/common';

export function createShoe(deckCount: number = DECK_COUNT): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ suit, rank, faceUp: true });
      }
    }
  }
  return shuffleShoe(shoe);
}

export function shuffleShoe(shoe: Card[]): Card[] {
  const shuffled = [...shoe];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function drawCard(shoe: Card[], faceUp: boolean = true): { card: Card; shoe: Card[] } {
  if (shoe.length === 0) {
    const newShoe = createShoe();
    const card = { ...newShoe[0], faceUp };
    return { card, shoe: newShoe.slice(1) };
  }
  const card = { ...shoe[0], faceUp };
  return { card, shoe: shoe.slice(1) };
}

export function needsReshuffle(currentShoeSize: number, originalShoeSize: number): boolean {
  const dealt = originalShoeSize - currentShoeSize;
  return dealt >= originalShoeSize * CUT_CARD_RATIO;
}
