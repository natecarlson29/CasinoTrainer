import type { Card } from '../types/card';
import type { GameState, Player } from '../types/blackjack';
import { createEmptyHand, createPlayer } from '../types/blackjack';
import { AI_STARTING_CHIPS, AI_BASE_BET } from '../types/common';
import { createShoe, drawCard, needsReshuffle } from '../engine/shoe';
import { handValue, isSoft, isBlackjack, isBusted, canSplit, canDoubleDown } from '../engine/hand';
import { settleHand } from '../engine/payout';
import { getOptimalAction } from '../engine/basic-strategy';
import { DECK_COUNT } from '../types/common';

export type GameAction =
  | { type: 'START_GAME'; startingChips: number }
  | { type: 'GO_TO_MENU' }
  | { type: 'ADD_AI_PLAYER'; position: 'left' | 'right' }
  | { type: 'REMOVE_AI_PLAYER'; position: 'left' | 'right' }
  | { type: 'PLACE_BET'; amount: number }
  | { type: 'CLEAR_BET' }
  | { type: 'CONFIRM_BETS' }
  | { type: 'DEAL_ONE_CARD' }
  | { type: 'PLAYER_ACTION'; action: 'hit' | 'stand' | 'double' | 'split' }
  | { type: 'AI_PLAY_STEP' }
  | { type: 'DEALER_REVEAL' }
  | { type: 'DEALER_HIT' }
  | { type: 'SETTLE' }
  | { type: 'NEW_ROUND' }
  | { type: 'SET_MESSAGE'; message: string };

const SHOE_SIZE = DECK_COUNT * 52;

export function createInitialState(): GameState {
  return {
    phase: 'menu',
    shoe: [],
    shoeSize: SHOE_SIZE,
    players: [
      createPlayer('left', 'Player L', 'left', false, AI_STARTING_CHIPS, false),
      createPlayer('center', 'You', 'center', true, 0, true),
      createPlayer('right', 'Player R', 'right', false, AI_STARTING_CHIPS, false),
    ],
    dealer: { cards: [] },
    activePlayerIndex: -1,
    roundNumber: 0,
    message: '',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'GO_TO_MENU':
      return createInitialState();

    case 'START_GAME': {
      if (action.startingChips === 0) {
        return { ...state, phase: 'chip-select', message: '' };
      }
      const shoe = createShoe();
      const players = state.players.map(p =>
        p.isHuman
          ? { ...p, chips: action.startingChips, hands: [], activeHandIndex: 0 }
          : { ...p, hands: [], activeHandIndex: 0 }
      );
      return {
        ...state,
        phase: 'betting',
        shoe,
        shoeSize: SHOE_SIZE,
        players,
        dealer: { cards: [] },
        roundNumber: 1,
        message: 'Place your bet!',
      };
    }

    case 'ADD_AI_PLAYER': {
      if (state.phase !== 'betting' && state.phase !== 'round-end') return state;
      const idx = action.position === 'left' ? 0 : 2;
      const players = [...state.players];
      players[idx] = { ...players[idx], isActive: true, chips: AI_STARTING_CHIPS, hands: [], lastResult: null, betMultiplier: 1 };
      return { ...state, players };
    }

    case 'REMOVE_AI_PLAYER': {
      if (state.phase !== 'betting' && state.phase !== 'round-end') return state;
      const idx = action.position === 'left' ? 0 : 2;
      const players = [...state.players];
      players[idx] = { ...players[idx], isActive: false, hands: [] };
      return { ...state, players };
    }

    case 'PLACE_BET': {
      if (state.phase !== 'betting') return state;
      const players = state.players.map(p => {
        if (!p.isHuman) return p;
        const currentBet = p.hands.length > 0 ? p.hands[0].bet : 0;
        const newBet = currentBet + action.amount;
        if (newBet > p.chips) return p;
        return { ...p, hands: [createEmptyHand(newBet)] };
      });
      return { ...state, players };
    }

    case 'CLEAR_BET': {
      const players = state.players.map(p =>
        p.isHuman ? { ...p, hands: [] } : p
      );
      return { ...state, players };
    }

    case 'CONFIRM_BETS': {
      const humanPlayer = state.players.find(p => p.isHuman);
      if (!humanPlayer || humanPlayer.hands.length === 0 || humanPlayer.hands[0].bet === 0) {
        return { ...state, message: 'Place a bet first!' };
      }

      // Set AI bets
      const players = state.players.map(p => {
        if (p.isHuman || !p.isActive) return p;
        if (p.chips <= 0) return { ...p, isActive: false };
        const bet = getAIBet(p);
        return { ...p, hands: [createEmptyHand(bet)] };
      });

      // Deduct bets from chips
      const playersWithBets = players.map(p => {
        if (!p.isActive || p.hands.length === 0) return p;
        const bet = p.hands[0].bet;
        return { ...p, chips: p.chips - bet };
      });

      return { ...state, phase: 'dealing', players: playersWithBets, message: 'Dealing...' };
    }

    case 'DEAL_ONE_CARD': {
      // Build ordered list of active players with their state indices
      const activePlayers = state.players
        .map((p, idx) => ({ player: p, idx }))
        .filter(({ player }) => player.isActive && player.hands.length > 0);

      const n = activePlayers.length;
      const totalExpected = (n + 1) * 2; // each active player + dealer gets 2 cards

      // Count how many cards have been dealt so far
      const totalDealt = activePlayers.reduce(
        (sum, { player }) => sum + player.hands[0].cards.length, 0
      ) + state.dealer.cards.length;

      // If all cards already dealt, transition to player-turn
      if (totalDealt >= totalExpected) {
        const firstActiveIdx = state.players.findIndex(p => p.isActive && p.hands.length > 0);
        return { ...state, phase: 'player-turn', activePlayerIndex: firstActiveIdx, message: '' };
      }

      // round 0 = first pass, round 1 = second pass
      // posInRound 0..n-1 = player slot, posInRound n = dealer
      const round = Math.floor(totalDealt / (n + 1));
      const posInRound = totalDealt % (n + 1);

      let shoe = [...state.shoe];
      let newPlayers = state.players;
      let newDealer = state.dealer;

      if (posInRound < n) {
        // Deal to the player at this position
        const { player, idx } = activePlayers[posInRound];
        const result = drawCard(shoe, true);
        shoe = result.shoe;
        const players = [...state.players];
        players[idx] = {
          ...player,
          hands: player.hands.map((h, hi) =>
            hi === 0 ? { ...h, cards: [...h.cards, result.card] } : h
          ),
        };
        newPlayers = players;
      } else {
        // Deal to dealer: face up in round 0, face down (hole card) in round 1
        const faceUp = round === 0;
        const result = drawCard(shoe, faceUp);
        shoe = result.shoe;
        newDealer = { cards: [...state.dealer.cards, result.card] };
      }

      // If this was the last card, transition to player-turn immediately
      if (totalDealt + 1 >= totalExpected) {
        const firstActiveIdx = newPlayers.findIndex(p => p.isActive && p.hands.length > 0);
        return {
          ...state,
          shoe,
          players: newPlayers,
          dealer: newDealer,
          phase: 'player-turn',
          activePlayerIndex: firstActiveIdx,
          message: '',
        };
      }

      return { ...state, shoe, players: newPlayers, dealer: newDealer };
    }

    case 'AI_PLAY_STEP': {
      const playerIdx = state.activePlayerIndex;
      if (playerIdx < 0 || playerIdx >= state.players.length) return state;
      const player = state.players[playerIdx];
      if (!player || player.isHuman || !player.isActive) return state;

      let shoe = [...state.shoe];
      const currentPlayer = { ...player, hands: player.hands.map(h => ({ ...h, cards: [...h.cards] })) };
      const dealerUpcard = state.dealer.cards[0];
      const hi = currentPlayer.activeHandIndex;
      const hand = currentPlayer.hands[hi];

      // Check for blackjack - skip this hand
      if (isBlackjack(hand.cards) && !hand.fromSplit) {
        // Advance to next hand or next player
        if (hi < currentPlayer.hands.length - 1) {
          currentPlayer.activeHandIndex = hi + 1;
          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players };
        }
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        const nextIdx = findNextActivePlayer(players, playerIdx);
        return { ...state, shoe, players, activePlayerIndex: nextIdx, phase: nextIdx === -1 ? 'dealer-turn' : 'player-turn' };
      }

      // Hand is already done (busted or 21)
      if (isBusted(hand.cards) || handValue(hand.cards) === 21) {
        if (hi < currentPlayer.hands.length - 1) {
          currentPlayer.activeHandIndex = hi + 1;
          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players };
        }
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        const nextIdx = findNextActivePlayer(players, playerIdx);
        return { ...state, shoe, players, activePlayerIndex: nextIdx, phase: nextIdx === -1 ? 'dealer-turn' : 'player-turn' };
      }

      const optimal = getOptimalAction(
        hand.cards,
        dealerUpcard,
        canSplit(hand, currentPlayer.chips) && currentPlayer.hands.length === 1,
        canDoubleDown(hand, currentPlayer.chips)
      );

      if (optimal.action === 'stand') {
        // Advance to next hand or next player
        if (hi < currentPlayer.hands.length - 1) {
          currentPlayer.activeHandIndex = hi + 1;
          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players, message: `${player.name}: Stand` };
        }
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        const nextIdx = findNextActivePlayer(players, playerIdx);
        return { ...state, shoe, players, activePlayerIndex: nextIdx, phase: nextIdx === -1 ? 'dealer-turn' : 'player-turn', message: `${player.name}: Stand` };
      }

      if (optimal.action === 'split' && canSplit(hand, currentPlayer.chips) && currentPlayer.hands.length === 1) {
        const card1 = hand.cards[0];
        const card2 = hand.cards[1];
        const r1 = drawCard(shoe, true);
        shoe = r1.shoe;
        const r2 = drawCard(shoe, true);
        shoe = r2.shoe;
        currentPlayer.chips -= hand.bet;
        currentPlayer.hands = [
          { ...createEmptyHand(hand.bet), cards: [card1, r1.card], fromSplit: true },
          { ...createEmptyHand(hand.bet), cards: [card2, r2.card], fromSplit: true },
        ];
        currentPlayer.activeHandIndex = 0;
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        return { ...state, shoe, players, message: `${player.name}: Split` };
      }

      if (optimal.action === 'double' && canDoubleDown(hand, currentPlayer.chips)) {
        const r = drawCard(shoe, true);
        shoe = r.shoe;
        currentPlayer.chips -= hand.bet;
        currentPlayer.hands[hi] = { ...hand, cards: [...hand.cards, r.card], bet: hand.bet * 2, isDoubledDown: true };
        // Double ends the hand, advance
        if (hi < currentPlayer.hands.length - 1) {
          currentPlayer.activeHandIndex = hi + 1;
          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players, message: `${player.name}: Double` };
        }
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        const nextIdx = findNextActivePlayer(players, playerIdx);
        return { ...state, shoe, players, activePlayerIndex: nextIdx, phase: nextIdx === -1 ? 'dealer-turn' : 'player-turn', message: `${player.name}: Double` };
      }

      // Hit - draw one card and stay on this player (useGameFlow will re-trigger)
      {
        const r = drawCard(shoe, true);
        shoe = r.shoe;
        currentPlayer.hands[hi] = { ...hand, cards: [...hand.cards, r.card] };
        const players = [...state.players];
        players[playerIdx] = currentPlayer;
        return { ...state, shoe, players, message: `${player.name}: Hit` };
      }
    }

    case 'PLAYER_ACTION': {
      const playerIdx = state.activePlayerIndex;
      const player = state.players[playerIdx];
      if (!player || !player.isHuman) return state;

      let shoe = [...state.shoe];
      let currentPlayer = { ...player, hands: [...player.hands] };
      const handIdx = currentPlayer.activeHandIndex;
      let hand = { ...currentPlayer.hands[handIdx], cards: [...currentPlayer.hands[handIdx].cards] };

      switch (action.action) {
        case 'hit': {
          const r = drawCard(shoe, true);
          shoe = r.shoe;
          hand.cards.push(r.card);
          currentPlayer.hands[handIdx] = hand;

          if (isBusted(hand.cards) || handValue(hand.cards) === 21) {
            // Move to next hand or next player
            return advanceAfterHandComplete(state, shoe, currentPlayer, handIdx, playerIdx);
          }

          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players };
        }

        case 'stand': {
          return advanceAfterHandComplete(state, shoe, currentPlayer, handIdx, playerIdx);
        }

        case 'double': {
          const r = drawCard(shoe, true);
          shoe = r.shoe;
          currentPlayer.chips -= hand.bet;
          hand.bet *= 2;
          hand.isDoubledDown = true;
          hand.cards.push(r.card);
          currentPlayer.hands[handIdx] = hand;
          return advanceAfterHandComplete(state, shoe, currentPlayer, handIdx, playerIdx);
        }

        case 'split': {
          const card1 = hand.cards[0];
          const card2 = hand.cards[1];
          const r1 = drawCard(shoe, true);
          shoe = r1.shoe;
          const r2 = drawCard(shoe, true);
          shoe = r2.shoe;

          const originalBet = hand.bet;
          currentPlayer.chips -= originalBet;

          currentPlayer.hands = [
            { ...createEmptyHand(originalBet), cards: [card1, r1.card], fromSplit: true },
            { ...createEmptyHand(originalBet), cards: [card2, r2.card], fromSplit: true },
          ];
          currentPlayer.activeHandIndex = 0;

          const players = [...state.players];
          players[playerIdx] = currentPlayer;
          return { ...state, shoe, players };
        }

        default:
          return state;
      }
    }

    case 'DEALER_REVEAL': {
      // Flip the hole card face up
      const dealer = {
        cards: state.dealer.cards.map(c => ({ ...c, faceUp: true })),
      };

      // Check if all players busted - go straight to settlement
      const allBusted = state.players
        .filter(p => p.isActive && p.hands.length > 0)
        .every(p => p.hands.every(h => isBusted(h.cards)));

      if (allBusted) {
        return { ...state, dealer, phase: 'settlement' };
      }

      return { ...state, dealer };
    }

    case 'DEALER_HIT': {
      const dealerCards = state.dealer.cards;
      const value = handValue(dealerCards);
      const soft = isSoft(dealerCards);

      // Dealer must hit on < 17 or soft 17
      const mustHit = value < 17 || (value === 17 && soft);

      if (!mustHit) {
        // Dealer is done, go to settlement
        return { ...state, phase: 'settlement' };
      }

      // Draw one card
      const r = drawCard(state.shoe, true);
      const newDealerCards = [...dealerCards, r.card];

      return {
        ...state,
        shoe: r.shoe,
        dealer: { cards: newDealerCards },
      };
    }

    case 'SETTLE': {
      const dealerCards = state.dealer.cards;
      const players = state.players.map(p => {
        if (!p.isActive || p.hands.length === 0) return p;
        const hands = p.hands.map(h => {
          const { result } = settleHand(h, dealerCards);
          return { ...h, result };
        });
        // Chips already deducted; add back bet + payout for wins
        const chipsBack = hands.reduce((sum, h) => {
          const { result } = settleHand(h, dealerCards);
          if (result === 'blackjack') return sum + h.bet + Math.floor(h.bet * 1.5);
          if (result === 'win') return sum + h.bet * 2;
          if (result === 'push') return sum + h.bet;
          return sum; // bust or lose: nothing back
        }, 0);

        const lastResult = hands[0]?.result ?? null;
        // Update bet multiplier for AI
        let betMultiplier = p.betMultiplier;
        if (!p.isHuman) {
          if (lastResult === 'win' || lastResult === 'blackjack') {
            betMultiplier = Math.min(betMultiplier + 1, 4);
          } else if (lastResult === 'lose' || lastResult === 'bust') {
            betMultiplier = 1;
          }
        }

        return {
          ...p,
          hands,
          chips: p.chips + chipsBack,
          lastResult,
          betMultiplier,
        };
      });

      return { ...state, players, phase: 'round-end', message: '' };
    }

    case 'NEW_ROUND': {
      let shoe = state.shoe;
      let shoeSize = state.shoeSize;

      if (needsReshuffle(shoe.length, shoeSize)) {
        shoe = createShoe();
        shoeSize = SHOE_SIZE;
      }

      // Check if human is out of chips
      const humanPlayer = state.players.find(p => p.isHuman);
      if (humanPlayer && humanPlayer.chips <= 0) {
        return {
          ...state,
          phase: 'chip-select',
          message: 'You ran out of chips!',
          shoe,
          shoeSize,
        };
      }

      // Get the human's last bet to carry over
      const lastHumanBet = humanPlayer?.hands[0]?.bet ?? 0;

      // Remove busted AI players, carry over human bet
      const players = state.players.map(p => {
        if (!p.isHuman && p.isActive && p.chips <= 0) {
          return { ...p, isActive: false };
        }
        if (p.isHuman && lastHumanBet > 0 && lastHumanBet <= p.chips) {
          return { ...p, hands: [createEmptyHand(lastHumanBet)], activeHandIndex: 0 };
        }
        return { ...p, hands: [], activeHandIndex: 0 };
      });

      return {
        ...state,
        shoe,
        shoeSize,
        players,
        dealer: { cards: [] },
        phase: 'betting',
        activePlayerIndex: -1,
        roundNumber: state.roundNumber + 1,
        message: 'Place your bet!',
      };
    }

    case 'SET_MESSAGE':
      return { ...state, message: action.message };

    default:
      return state;
  }
}

function getAIBet(player: Player): number {
  const bet = AI_BASE_BET * player.betMultiplier;
  return Math.min(bet, player.chips);
}

function findNextActivePlayer(players: Player[], currentIdx: number): number {
  for (let i = currentIdx + 1; i < players.length; i++) {
    if (players[i].isActive && players[i].hands.length > 0) {
      return i;
    }
  }
  return -1; // All players done, dealer's turn
}

function advanceAfterHandComplete(
  state: GameState,
  shoe: Card[],
  currentPlayer: Player,
  handIdx: number,
  playerIdx: number
): GameState {
  // Check if there are more hands to play (split)
  if (handIdx < currentPlayer.hands.length - 1) {
    currentPlayer.activeHandIndex = handIdx + 1;
    const players = [...state.players];
    players[playerIdx] = currentPlayer;
    return { ...state, shoe, players };
  }

  // All hands done for this player, advance to next
  const players = [...state.players];
  players[playerIdx] = currentPlayer;
  const nextIdx = findNextActivePlayer(players, playerIdx);

  return {
    ...state,
    shoe,
    players,
    activePlayerIndex: nextIdx,
    phase: nextIdx === -1 ? 'dealer-turn' : 'player-turn',
  };
}
