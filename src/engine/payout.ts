import type { Card } from '../types/card';
import type { Hand, HandResult } from '../types/blackjack';
import { handValue, isBlackjack, isBusted } from './hand';

export function settleHand(hand: Hand, dealerCards: Card[]): { result: HandResult; payout: number } {
  const playerValue = handValue(hand.cards);
  const dealerValue = handValue(dealerCards);
  const playerBJ = isBlackjack(hand.cards) && !hand.fromSplit;
  const dealerBJ = isBlackjack(dealerCards);

  // Player busted
  if (isBusted(hand.cards)) {
    return { result: 'bust', payout: -hand.bet };
  }

  // Both blackjack = push
  if (playerBJ && dealerBJ) {
    return { result: 'push', payout: 0 };
  }

  // Player blackjack pays 3:2
  if (playerBJ) {
    return { result: 'blackjack', payout: Math.floor(hand.bet * 1.5) };
  }

  // Dealer blackjack
  if (dealerBJ) {
    return { result: 'lose', payout: -hand.bet };
  }

  // Dealer busted
  if (isBusted(dealerCards)) {
    return { result: 'win', payout: hand.bet };
  }

  // Compare values
  if (playerValue > dealerValue) {
    return { result: 'win', payout: hand.bet };
  }
  if (playerValue < dealerValue) {
    return { result: 'lose', payout: -hand.bet };
  }

  return { result: 'push', payout: 0 };
}
