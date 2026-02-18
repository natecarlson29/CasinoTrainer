import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

export function useGameFlow() {
  const { state, dispatch } = useGame();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track dealer cards length to re-trigger on each new card
  const dealerCardCount = state.dealer.cards.length;
  // Track player hands to re-trigger AI steps
  const activePlayer = state.activePlayerIndex >= 0 ? state.players[state.activePlayerIndex] : null;
  const activeHandCards = activePlayer?.hands[activePlayer.activeHandIndex]?.cards.length ?? 0;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Deal one card at a time, 1200ms apart, left-to-right each round then dealer
    if (state.phase === 'dealing') {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'DEAL_ONE_CARD' });
      }, 900);
      return;
    }

    // Auto-play AI turns - one step at a time
    if (state.phase === 'player-turn' && state.activePlayerIndex >= 0) {
      const player = state.players[state.activePlayerIndex];
      if (player && !player.isHuman && player.isActive) {
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'AI_PLAY_STEP' });
        }, 700);
        return;
      }
    }

    // Dealer turn: first reveal, then hit one card at a time
    if (state.phase === 'dealer-turn') {
      const dealerCards = state.dealer.cards;
      const hasHoleCard = dealerCards.some(c => !c.faceUp);

      if (hasHoleCard) {
        // First step: reveal the hole card
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'DEALER_REVEAL' });
        }, 600);
      } else {
        // Subsequent steps: hit or finish
        timerRef.current = setTimeout(() => {
          dispatch({ type: 'DEALER_HIT' });
        }, 800);
      }
      return;
    }

    // Auto-settle
    if (state.phase === 'settlement') {
      timerRef.current = setTimeout(() => {
        dispatch({ type: 'SETTLE' });
      }, 500);
      return;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.phase, state.activePlayerIndex, dealerCardCount, activeHandCards, dispatch, state.players, state.dealer.cards]);
}
