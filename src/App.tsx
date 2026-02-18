import { GameProvider, useGame } from './context/GameContext';
import { MainMenu } from './components/layout/MainMenu';
import { ChipSelect } from './components/layout/ChipSelect';
import { Table } from './components/table/Table';
import './styles/variables.css';
import './App.css';

function AppRouter() {
  const { state, dispatch } = useGame();

  if (state.phase === 'menu') {
    return (
      <MainMenu
        onSelectBlackjack={() => {
          // Directly start the chip select phase
          dispatch({ type: 'START_GAME', startingChips: 0 });
        }}
      />
    );
  }

  if (state.phase === 'chip-select' || (state.phase === 'betting' && state.players.find(p => p.isHuman)?.chips === 0)) {
    return (
      <ChipSelect
        onStart={(chips) => dispatch({ type: 'START_GAME', startingChips: chips })}
        onBack={() => dispatch({ type: 'GO_TO_MENU' })}
        message={state.message || undefined}
      />
    );
  }

  return <Table />;
}

function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}

export default App;
