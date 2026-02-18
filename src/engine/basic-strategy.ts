import type { Card } from '../types/card';
import { rankValue } from '../types/card';
import type { PlayerAction } from '../types/blackjack';
import { handValue, isSoft, pairRank } from './hand';
import { HARD_TOTALS, SOFT_TOTALS, PAIRS } from './basic-strategy-data';

export interface StrategyResult {
  action: PlayerAction;
  reason: string;
}

export function getOptimalAction(
  playerCards: Card[],
  dealerUpcard: Card,
  canSplitHand: boolean,
  canDoubleHand: boolean
): StrategyResult {
  const dealerValue = rankValue(dealerUpcard.rank); // 2-11
  const playerValue = handValue(playerCards);
  const soft = isSoft(playerCards);
  const pair = canSplitHand ? pairRank(playerCards) : null;

  const dealerStr = dealerValue === 11 ? 'Ace' : String(dealerValue);

  // 1. Check pairs first
  if (pair !== null && pair in PAIRS) {
    const code = PAIRS[pair][dealerValue];
    if (code === 'P') {
      return {
        action: 'split',
        reason: getPairReason(pair, dealerStr),
      };
    }
    // If pair chart says don't split (e.g., 5s or 10s), fall through
  }

  // 2. Soft totals
  if (soft && playerValue >= 13 && playerValue <= 21) {
    const code = SOFT_TOTALS[playerValue]?.[dealerValue] ?? 'H';
    let action = codeToAction(code);
    if (action === 'double' && !canDoubleHand) action = playerValue >= 18 ? 'stand' : 'hit';
    return {
      action,
      reason: getSoftReason(playerValue, dealerStr, action),
    };
  }

  // 3. Hard totals
  const clampedValue = Math.min(Math.max(playerValue, 5), 21);
  const code = HARD_TOTALS[clampedValue]?.[dealerValue] ?? 'H';
  let action = codeToAction(code);
  if (action === 'double' && !canDoubleHand) action = 'hit';

  return {
    action,
    reason: getHardReason(playerValue, dealerStr, action),
  };
}

function codeToAction(code: string): PlayerAction {
  switch (code) {
    case 'H': return 'hit';
    case 'S': return 'stand';
    case 'D': return 'double';
    case 'P': return 'split';
    default: return 'hit';
  }
}

function getPairReason(pairValue: number, dealerStr: string): string {
  if (pairValue === 11) return 'Always split Aces. Two hands starting with an Ace are far stronger than a soft 12.';
  if (pairValue === 8) return 'Always split 8s. A hard 16 is the worst hand in blackjack, but two hands starting with 8 have much better odds.';
  if (pairValue === 9) return `Split 9s vs dealer ${dealerStr}. Two hands starting with 9 outperform standing on 18 against this upcard.`;
  if (pairValue <= 3) return `Split low pairs vs dealer ${dealerStr}. The dealer is likely to bust with this upcard, so two hands give you double the opportunity.`;
  if (pairValue === 6) return `Split 6s vs dealer ${dealerStr}. A hard 12 is weak, but two hands starting with 6 can improve against a vulnerable dealer.`;
  if (pairValue === 7) return `Split 7s vs dealer ${dealerStr}. Two hands starting with 7 beat holding a hard 14.`;
  if (pairValue === 4) return `Split 4s vs dealer ${dealerStr}. With the dealer showing a weak card, splitting gives you two chances to catch a good hand.`;
  return `Split this pair vs dealer ${dealerStr} for the best expected value.`;
}

function getSoftReason(total: number, dealerStr: string, action: PlayerAction): string {
  const aceWith = total - 11;
  const handDesc = `soft ${total} (Ace + ${aceWith})`;

  if (action === 'double') {
    return `Double down on ${handDesc} vs dealer ${dealerStr}. The dealer is vulnerable and you have a strong flexible hand that can't bust with one more card.`;
  }
  if (action === 'stand') {
    if (total >= 19) return `Stand on ${handDesc} vs dealer ${dealerStr}. ${total} is a strong hand — don't risk it.`;
    return `Stand on ${handDesc} vs dealer ${dealerStr}. Your 18 is strong enough against this dealer upcard.`;
  }
  return `Hit on ${handDesc} vs dealer ${dealerStr}. You can't bust a soft hand, and you need to improve against the dealer's strong upcard.`;
}

function getHardReason(total: number, dealerStr: string, action: PlayerAction): string {
  if (action === 'double') {
    return `Double down on hard ${total} vs dealer ${dealerStr}. You have a strong starting total and the dealer is vulnerable — maximize your bet.`;
  }
  if (action === 'stand') {
    if (total >= 17) return `Stand on hard ${total}. Any hand of 17+ is too risky to hit.`;
    return `Stand on hard ${total} vs dealer ${dealerStr}. The dealer is likely to bust with this upcard (2-6), so don't risk busting yourself.`;
  }
  if (total <= 11) {
    return `Hit on hard ${total} vs dealer ${dealerStr}. You can't bust, so always take another card.`;
  }
  return `Hit on hard ${total} vs dealer ${dealerStr}. The dealer's strong upcard means you need to improve — the risk of busting is worth it.`;
}
