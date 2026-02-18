# CasinoTrainer — Blackjack Architecture Reference

This document describes how the blackjack section of the app is structured and how all the pieces connect. Use this as the primary reference when making changes.

---

## Tech Stack

- React 19 + TypeScript + Vite
- State managed via `useReducer` + React Context (no external state library)
- Deployed to GitHub Pages via GitHub Actions (`/.github/workflows/deploy.yml`)
- Vite base path set to `/CasinoTrainer/` in `vite.config.ts`

---

## Directory Structure (src/)

```
src/
├── types/
│   ├── card.ts          # Card, Suit, Rank types + rankValue/suitSymbol helpers
│   ├── blackjack.ts     # GameState, Player, Hand, GamePhase, HandResult types
│   └── common.ts        # Constants: DECK_COUNT, chip denominations, AI config
├── engine/
│   ├── shoe.ts          # Shoe creation, shuffling, drawing, reshuffle check
│   ├── hand.ts          # handValue, isBlackjack, isBusted, isSoft, canSplit, canDoubleDown
│   ├── dealer.ts        # (dealer logic lives in gameReducer DEALER_HIT/DEALER_REVEAL)
│   ├── payout.ts        # settleHand — determines HandResult and chip payout
│   ├── basic-strategy.ts      # getOptimalAction — returns best action + human-readable reason
│   └── basic-strategy-data.ts # Raw lookup tables: HARD_TOTALS, SOFT_TOTALS, PAIRS
├── context/
│   ├── GameContext.tsx  # GameProvider, useGame hook, optimalPlay computation
│   └── gameReducer.ts   # All game state transitions (the core of the app)
├── hooks/
│   └── useGameFlow.ts   # Auto-advances phases via timed dispatches
└── components/
    ├── table/
    │   ├── Table.tsx        # Root game UI, wires everything together
    │   ├── DealerArea.tsx   # Renders dealer cards
    │   └── PlayerSeat.tsx   # Renders a player's cards + chips
    ├── controls/
    │   ├── ActionButtons.tsx  # Hit / Stand / Double / Split buttons
    │   └── StrategyHint.tsx   # Shows basic strategy hint for human's turn
    ├── chips/
    │   └── BettingArea.tsx    # Chip selector shown during betting phase
    ├── ui/
    │   └── ResultOverlay.tsx  # Fading result popup (BLACKJACK!, YOU WIN!, etc.)
    └── layout/
        ├── MainMenu.tsx       # Start screen
        └── ChipSelect.tsx     # Choose starting chip count
```

---

## Game Phases

The game moves through these phases in order, stored in `GameState.phase`:

```
menu → chip-select → betting → dealing → player-turn → dealer-turn → settlement → round-end → (back to betting)
```

| Phase | What happens |
|---|---|
| `menu` | Main menu shown |
| `chip-select` | Human picks starting chip amount |
| `betting` | Human places a bet; AI bets are set on confirm |
| `dealing` | `useGameFlow` auto-fires `DEAL_INITIAL` after 500ms |
| `player-turn` | Human acts (or AI auto-plays via `AI_PLAY_STEP`) |
| `dealer-turn` | Dealer reveals hole card, then hits until done |
| `settlement` | `SETTLE` computes results and pays out chips |
| `round-end` | Results shown; "Next Hand" button starts a new round |

---

## State Shape (`GameState`)

Defined in `src/types/blackjack.ts`:

```ts
GameState {
  phase: GamePhase
  shoe: Card[]               // Remaining cards in the shoe
  shoeSize: number           // Original shoe size (for reshuffle detection)
  players: Player[]          // Always 3: [left AI, human center, right AI]
  dealer: { cards: Card[] }
  activePlayerIndex: number  // Index into players[]; -1 when no one is acting
  roundNumber: number
  message: string            // Transient status text shown on the table
}

Player {
  id, name, seatPosition
  isHuman: boolean
  isActive: boolean          // false = AI seat is empty this round
  chips: number
  hands: Hand[]              // Usually 1; 2 after a split
  activeHandIndex: number
  lastResult: HandResult
  betMultiplier: number      // AI progressive betting (1–4x)
}

Hand {
  cards: Card[]
  bet: number
  result: HandResult         // null during play; set after SETTLE
  isDoubledDown: boolean
  fromSplit: boolean         // Blackjack on a split hand does not pay 3:2
}
```

---

## Key Dispatched Actions (`gameReducer.ts`)

| Action | Trigger | What it does |
|---|---|---|
| `START_GAME` | Menu button | Creates shoe, sets phase to `betting` |
| `PLACE_BET` | Chip click | Adds chip value to human's hand bet |
| `CLEAR_BET` | Clear button | Removes human's hand |
| `CONFIRM_BETS` | Deal button | Sets AI bets, deducts chips, transitions to `dealing` |
| `DEAL_ONE_CARD` | Auto (300ms each) | Deals one card at a time in order: left player → center → right → dealer, repeated for round 2; dealer's 2nd card is face-down; transitions to `player-turn` after the last card |
| `PLAYER_ACTION` | Hit/Stand/Double/Split buttons | Applies the action to the human's active hand |
| `AI_PLAY_STEP` | Auto (700ms) | One step of AI play using `getOptimalAction` |
| `DEALER_REVEAL` | Auto (600ms) | Flips dealer's hole card face-up |
| `DEALER_HIT` | Auto (800ms) | Dealer hits or ends turn (hits on <17 or soft 17) |
| `SETTLE` | Auto (500ms) | Calls `settleHand` for every hand; updates chips |
| `NEW_ROUND` | "Next Hand" button | Resets hands/dealer, checks reshuffle, carries over human's last bet |
| `ADD_AI_PLAYER` / `REMOVE_AI_PLAYER` | +/- seat buttons | Toggles AI players during betting or round-end |

---

## Auto-Advance: `useGameFlow.ts`

`useGameFlow` is a hook used in `Table.tsx`. It watches `state.phase` and fires timed dispatches to keep the game moving automatically. Humans only need to act during `player-turn`.

```
dealing      → DEAL_ONE_CARD     (300ms per card; fires repeatedly until all cards dealt)
player-turn  → AI_PLAY_STEP      (700ms, only if current player is AI)
dealer-turn  → DEALER_REVEAL     (600ms, first step — flip hole card)
             → DEALER_HIT        (800ms, each subsequent step)
settlement   → SETTLE            (500ms)
```

Human turns are not auto-advanced — `useGameFlow` skips them, and `ActionButtons` waits for user input.

---

## Engine Functions

### `src/engine/hand.ts`
- `handValue(cards)` — sums card values, reduces aces from 11→1 to avoid bust
- `isSoft(cards)` — true if at least one ace is still counted as 11
- `isBlackjack(cards)` — exactly 2 cards totaling 21
- `isBusted(cards)` — value > 21
- `canSplit(hand, chips)` — 2 cards of equal rank, not from a split, enough chips
- `canDoubleDown(hand, chips)` — exactly 2 cards, enough chips

### `src/engine/shoe.ts`
- Shoe = 4 decks (208 cards), Fisher-Yates shuffled
- Reshuffle triggered when 75% of the shoe has been dealt (`CUT_CARD_RATIO = 0.75`)
- `drawCard(shoe, faceUp)` — returns top card + remaining shoe (immutable)

### `src/engine/payout.ts` — `settleHand(hand, dealerCards)`
Payout priority order:
1. Player busted → `bust` (lose bet)
2. Both blackjack → `push` (bet returned)
3. Player blackjack (not from split) → `blackjack` (3:2 payout)
4. Dealer blackjack → `lose`
5. Dealer busted → `win`
6. Compare values → `win` / `lose` / `push`

### `src/engine/basic-strategy.ts` — `getOptimalAction(...)`
Returns the statistically optimal `PlayerAction` + a human-readable `reason` string.
Priority: **pairs → soft totals → hard totals**.
Lookup tables are in `basic-strategy-data.ts` (keys are numeric dealer upcard values 2–11).

---

## UI Components

### `Table.tsx`
The root component for a game in progress. Renders:
- `DealerArea` — always visible during a hand
- `PlayerSeat` × 3 — one per player slot
- `BettingArea` — only during `betting` phase
- `ActionButtons` + `StrategyHint` — only during `player-turn` when `isUserTurn` is true
- `ResultOverlay` — fading result popup keyed to the human's `hand[0].result`
- "Next Hand" button — only during `round-end`

### `ActionButtons.tsx`
Renders Hit / Stand / Double / Split for the human player.
- Returns `null` if it is not the human's turn, the hand has < 2 cards, or **the hand is a blackjack** (game auto-advances in that case)
- The button matching the `optimalPlay.action` gets the `action-btn-optimal` CSS class

### `ResultOverlay.tsx`
Triggered when `humanResult` changes to a non-null `HandResult` after `round-end`.
- `blackjack` → "BLACKJACK!" + 50-piece confetti, gold styling
- `win` → "YOU WIN!" green
- `lose` / `bust` → "YOU LOSE" / "BUST!" red
- `push` → "PUSH" grey
- Fades out after 1800ms, hidden after 2500ms

### `StrategyHint.tsx`
Displays the `optimalPlay.reason` string from `GameContext` during the human's turn.

---

## AI Player Behavior

- AI seats (left and right) are optional and can be toggled during betting/round-end
- AI bets: `AI_BASE_BET ($25) × betMultiplier`, capped at available chips
- `betMultiplier` increases by 1 (max 4) on a win/blackjack, resets to 1 on a loss
- AI actions are driven by `getOptimalAction` — same basic strategy as the hint shown to the human
- AI plays one step per `AI_PLAY_STEP` dispatch (triggered every 700ms by `useGameFlow`)
- AI blackjack hands are automatically skipped (no action needed)

---

## Blackjack Special Case (Important)

When a player is dealt a natural blackjack (Ace + 10-value on the initial deal):
- **Human**: `ActionButtons` returns `null` (no buttons shown); `useGameFlow` does not auto-advance human turns, so the reducer moves forward when the next non-human step fires
- **AI**: `AI_PLAY_STEP` detects `isBlackjack(hand.cards) && !hand.fromSplit` and immediately advances to the next player without acting
- **Settlement**: `settleHand` checks `isBlackjack` on both player and dealer. Player blackjack pays 3:2 unless the dealer also has blackjack (push). A blackjack from a split hand is treated as a regular 21 (no 3:2 bonus).
- **Overlay**: After `SETTLE`, `hand[0].result` becomes `'blackjack'`, which triggers `ResultOverlay` to show "BLACKJACK!" with confetti animation.
