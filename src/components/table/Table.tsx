import { useGame } from '../../context/GameContext';
import { useGameFlow } from '../../hooks/useGameFlow';
import { DealerArea } from './DealerArea';
import { PlayerSeat } from './PlayerSeat';
import { BettingArea } from '../chips/BettingArea';
import { ActionButtons } from '../controls/ActionButtons';
import { StrategyHint } from '../controls/StrategyHint';
import { ResultOverlay } from '../ui/ResultOverlay';
import './Table.css';

export function Table() {
  const { state, dispatch, isUserTurn } = useGame();
  useGameFlow();

  const isBetting = state.phase === 'betting';
  const isRoundEnd = state.phase === 'round-end';
  const humanPlayer = state.players.find(p => p.isHuman);

  // Get the human's primary hand result for the big center overlay
  const humanResult = isRoundEnd && humanPlayer?.hands[0]?.result
    ? humanPlayer.hands[0].result
    : null;

  return (
    <div className="table-container">
      <div className="table-header">
        <button className="btn-back" onClick={() => dispatch({ type: 'GO_TO_MENU' })}>
          &larr; Menu
        </button>
        <div className="round-info">Round {state.roundNumber}</div>
        <div className="shoe-info">
          Cards left: {state.shoe.length}
        </div>
      </div>

      <div className="table-felt">
        <DealerArea />

        <div className="seats-row">
          {state.players.map((player, idx) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isActive={state.activePlayerIndex === idx && state.phase === 'player-turn'}
              showAddRemove={isBetting || isRoundEnd}
              onAdd={!player.isHuman && !player.isActive
                ? () => dispatch({ type: 'ADD_AI_PLAYER', position: player.seatPosition as 'left' | 'right' })
                : undefined
              }
              onRemove={!player.isHuman && player.isActive
                ? () => dispatch({ type: 'REMOVE_AI_PLAYER', position: player.seatPosition as 'left' | 'right' })
                : undefined
              }
            />
          ))}
        </div>

        {isBetting && <BettingArea />}

        {isUserTurn && (
          <div className="player-controls">
            <StrategyHint />
            <ActionButtons />
          </div>
        )}

        {isRoundEnd && (
          <div className="round-end-controls">
            <button
              className="btn btn-primary btn-large"
              onClick={() => dispatch({ type: 'NEW_ROUND' })}
            >
              Next Hand
            </button>
          </div>
        )}

        {state.message && !isBetting && (
          <div className="table-message">{state.message}</div>
        )}

        <ResultOverlay result={humanResult} />
      </div>

      {humanPlayer && (
        <div className="my-bankroll">
          Your Bankroll: <span className="my-bankroll-amount">${humanPlayer.chips}</span>
        </div>
      )}
    </div>
  );
}
