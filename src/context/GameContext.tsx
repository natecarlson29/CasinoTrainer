import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { GameState } from '../types/blackjack';
import type { GameAction } from './gameReducer';
import { gameReducer, createInitialState } from './gameReducer';
import { getOptimalAction } from '../engine/basic-strategy';
import { canSplit, canDoubleDown } from '../engine/hand';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  currentPlayer: GameState['players'][number] | null;
  isUserTurn: boolean;
  optimalPlay: { action: string; reason: string } | null;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);

  const value = useMemo(() => {
    const currentPlayer = state.activePlayerIndex >= 0
      ? state.players[state.activePlayerIndex]
      : null;
    const isUserTurn = state.phase === 'player-turn' && currentPlayer?.isHuman === true;

    let optimalPlay: { action: string; reason: string } | null = null;
    if (isUserTurn && currentPlayer) {
      const hand = currentPlayer.hands[currentPlayer.activeHandIndex];
      if (hand && hand.cards.length >= 2 && state.dealer.cards.length > 0) {
        optimalPlay = getOptimalAction(
          hand.cards,
          state.dealer.cards[0],
          canSplit(hand, currentPlayer.chips),
          canDoubleDown(hand, currentPlayer.chips)
        );
      }
    }

    return { state, dispatch, currentPlayer, isUserTurn, optimalPlay };
  }, [state]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
