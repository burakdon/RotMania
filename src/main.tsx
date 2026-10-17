import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/styles.css';
import { App } from './App';
import { useStore } from './store';
import { apply } from './game/engine';
import { botAnswer } from './game/bots';
import { Comic, ComicGrid } from './comic/Comic';
import { DarthCloseup, Gallery } from './toys/Gallery';
import { Handbook } from './ui/Handbook';

const route = location.hash.replace('#', '');
if (import.meta.env.DEV) {
  // dev helper: play the current game out with bots and jump to the results
  (window as unknown as { __finish: () => void }).__finish = () => {
    let g = useStore.getState().game;
    while (g && g.phase !== 'over') g = apply(g, botAnswer(g));
    useStore.setState({ game: g, screen: 'results' });
  };
}
// dev: #bots watches an all-bot game at high speed
if (route === 'bots') {
  useStore.getState().setBotSpeed(0.04);
  useStore.getState().start([0, 1, 2].map((i) => ({ name: ['Cell Rossa', 'Cell Blu', 'Cell Giallo'][i], bot: true })));
}
createRoot(document.getElementById('root')!).render(<StrictMode>{route === 'comicgrid' ? <ComicGrid /> : route === 'comic' ? <Comic onDone={() => (location.hash = '')} /> : route === 'gallery' ? <Gallery /> : route === 'darth' ? <DarthCloseup /> : route === 'handbook' ? <Handbook /> : <App />}</StrictMode>);
