// Basic strategy tables for 4+ deck, dealer hits soft 17 (H17), DAS allowed
// Keys: player hand value -> dealer upcard value (2-11, where 11=Ace) -> action
// Actions: 'H' = hit, 'S' = stand, 'D' = double (hit if can't), 'P' = split

type ActionCode = 'H' | 'S' | 'D' | 'P';
type StrategyRow = Record<number, ActionCode>;

// Dealer upcards: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11(A)
const d = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function row(...actions: ActionCode[]): StrategyRow {
  const r: StrategyRow = {};
  d.forEach((v, i) => { r[v] = actions[i]; });
  return r;
}

// Hard totals (player has no ace counted as 11, or hard total)
export const HARD_TOTALS: Record<number, StrategyRow> = {
  5:  row('H','H','H','H','H','H','H','H','H','H'),
  6:  row('H','H','H','H','H','H','H','H','H','H'),
  7:  row('H','H','H','H','H','H','H','H','H','H'),
  8:  row('H','H','H','H','H','H','H','H','H','H'),
  9:  row('H','D','D','D','D','H','H','H','H','H'),
  10: row('D','D','D','D','D','D','D','D','H','H'),
  11: row('D','D','D','D','D','D','D','D','D','D'),
  12: row('H','H','S','S','S','H','H','H','H','H'),
  13: row('S','S','S','S','S','H','H','H','H','H'),
  14: row('S','S','S','S','S','H','H','H','H','H'),
  15: row('S','S','S','S','S','H','H','H','H','H'),
  16: row('S','S','S','S','S','H','H','H','H','H'),
  17: row('S','S','S','S','S','S','S','S','S','S'),
  18: row('S','S','S','S','S','S','S','S','S','S'),
  19: row('S','S','S','S','S','S','S','S','S','S'),
  20: row('S','S','S','S','S','S','S','S','S','S'),
  21: row('S','S','S','S','S','S','S','S','S','S'),
};

// Soft totals (player has ace counted as 11)
export const SOFT_TOTALS: Record<number, StrategyRow> = {
  13: row('H','H','H','D','D','H','H','H','H','H'),
  14: row('H','H','H','D','D','H','H','H','H','H'),
  15: row('H','H','D','D','D','H','H','H','H','H'),
  16: row('H','H','D','D','D','H','H','H','H','H'),
  17: row('H','D','D','D','D','H','H','H','H','H'),
  18: row('D','D','D','D','D','S','S','H','H','H'),
  19: row('S','S','S','S','D','S','S','S','S','S'),
  20: row('S','S','S','S','S','S','S','S','S','S'),
  21: row('S','S','S','S','S','S','S','S','S','S'),
};

// Pair splitting (by card value: 2-10, 11=Ace)
export const PAIRS: Record<number, StrategyRow> = {
  2:  row('P','P','P','P','P','P','H','H','H','H'),
  3:  row('P','P','P','P','P','P','H','H','H','H'),
  4:  row('H','H','H','P','P','H','H','H','H','H'),
  5:  row('D','D','D','D','D','D','D','D','H','H'), // Never split 5s, play as hard 10
  6:  row('P','P','P','P','P','H','H','H','H','H'),
  7:  row('P','P','P','P','P','P','H','H','H','H'),
  8:  row('P','P','P','P','P','P','P','P','P','P'), // Always split 8s
  9:  row('P','P','P','P','P','S','P','P','S','S'),
  10: row('S','S','S','S','S','S','S','S','S','S'), // Never split 10s
  11: row('P','P','P','P','P','P','P','P','P','P'), // Always split Aces
};
