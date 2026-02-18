export type ChipDenomination = 5 | 25 | 100 | 500;

export const CHIP_DENOMINATIONS: ChipDenomination[] = [5, 25, 100, 500];

export const CHIP_COLORS: Record<ChipDenomination, string> = {
  5: '#cc2222',
  25: '#228B22',
  100: '#1a1a1a',
  500: '#6a1b9a',
};

export const CHIP_LABELS: Record<ChipDenomination, string> = {
  5: '$5',
  25: '$25',
  100: '$100',
  500: '$500',
};

export const DECK_COUNT = 4;
export const CUT_CARD_RATIO = 0.75;
export const MIN_BET = 5;
export const AI_BASE_BET = 25;
export const AI_STARTING_CHIPS = 1000;
