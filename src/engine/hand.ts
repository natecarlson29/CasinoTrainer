import type { Card } from '../types/card';
import { rankValue } from '../types/card';
import type { Hand } from '../types/blackjack';

export function handValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    const v = rankValue(card.rank);
    value += v;
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

export function isSoft(cards: Card[]): boolean {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += rankValue(card.rank);
    if (card.rank === 'A') aces++;
  }

  // Reduce aces from 11 to 1 until we're at or under 21
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  // Soft means at least one ace is still counted as 11
  return aces > 0 && value <= 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handValue(cards) === 21;
}

export function isBusted(cards: Card[]): boolean {
  return handValue(cards) > 21;
}

export function canSplit(hand: Hand, playerChips: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.fromSplit) return false; // No re-splitting
  if (playerChips < hand.bet) return false;
  return rankValue(hand.cards[0].rank) === rankValue(hand.cards[1].rank);
}

export function canDoubleDown(hand: Hand, playerChips: number): boolean {
  if (hand.cards.length !== 2) return false;
  if (playerChips < hand.bet) return false;
  return true;
}

export function cardNumericValue(card: Card): number {
  return rankValue(card.rank);
}

export function pairRank(cards: Card[]): number | null {
  if (cards.length !== 2) return null;
  const v1 = rankValue(cards[0].rank);
  const v2 = rankValue(cards[1].rank);
  if (v1 === v2) return v1;
  return null;
}
