import { Comic } from './comic/Comic';
import { useStore } from './store';
import { GameScreen } from './ui/Game';
import { Lobby, Results, Title } from './ui/Screens';

export function App() {
  const screen = useStore((s) => s.screen);
  const go = useStore((s) => s.go);
  switch (screen) {
    case 'title':
      return <Title />;
    case 'comic':
      return <Comic onDone={() => go('lobby')} />;
    case 'lobby':
      return <Lobby />;
    case 'game':
      return <GameScreen />;
    case 'results':
      return <Results />;
  }
}
