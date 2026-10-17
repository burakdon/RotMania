import { Comic } from './comic/Comic';
import { useStore } from './store';
import { GameScreen, Lobby, Results, Title } from './ui/Screens';

export function App() {
  const screen = useStore((s) => s.screen);
  const go = useStore((s) => s.go);
  switch (screen) {
    case 'title':
      return <Title />;
    case 'film':
      return <Comic onDone={() => go('lobby')} />;
    case 'lobby':
      return <Lobby />;
    case 'game':
      return <GameScreen />;
    case 'results':
      return <Results />;
  }
}
