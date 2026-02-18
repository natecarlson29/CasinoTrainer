import { useGame } from '../../context/GameContext';
import { HandDisplay } from '../cards/HandDisplay';
import './DealerArea.css';

export function DealerArea() {
  const { state } = useGame();
  const { cards } = state.dealer;

  if (cards.length === 0) {
    return (
      <div className="dealer-area">
        <div className="dealer-label">Dealer</div>
        <div className="dealer-placeholder" />
      </div>
    );
  }

  return (
    <div className="dealer-area">
      <div className="dealer-label">Dealer</div>
      <HandDisplay cards={cards} showValue={true} />
    </div>
  );
}
