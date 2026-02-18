import type { Card } from './card';

export type GamePhase =
  | 'menu'
  | 'chip-select'
  | 'betting'
  | 'dealing'
  | 'player-turn'
  | 'dealer-turn'
  | 'settlement'
  | 'round-end';

export type PlayerAction = 'hit' | 'stand' | 'double' | 'split';

export type HandResult = 'win' | 'lose' | 'push' | 'blackjack' | 'bust' | null;

export interface Hand {
  cards: Card[];
  bet: number;
  result: HandResult;
  isDoubledDown: boolean;
  fromSplit: boolean;
}

export type SeatPosition = 'left' | 'center' | 'right';

export interface Player {
  id: string;
  name: string;
  seatPosition: SeatPosition;
  isHuman: boolean;
  chips: number;
  hands: Hand[];
  activeHandIndex: number;
  isActive: boolean;
  lastResult: HandResult;
  betMultiplier: number;
}

export interface DealerState {
  cards: Card[];
}

export interface GameState {
  phase: GamePhase;
  shoe: Card[];
  shoeSize: number;
  players: Player[];
  dealer: DealerState;
  activePlayerIndex: number;
  roundNumber: number;
  message: string;
}

export function createEmptyHand(bet: number = 0): Hand {
  return {
    cards: [],
    bet,
    result: null,
    isDoubledDown: false,
    fromSplit: false,
  };
}

export function createPlayer(
  id: string,
  name: string,
  seatPosition: SeatPosition,
  isHuman: boolean,
  chips: number,
  isActive: boolean = true
): Player {
  return {
    id,
    name,
    seatPosition,
    isHuman,
    chips,
    hands: [],
    activeHandIndex: 0,
    isActive,
    lastResult: null,
    betMultiplier: 1,
  };
}
