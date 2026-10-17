import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/styles.css';
import { App } from './App';
import { Film } from './film/Film';
import { Closeup, Gallery, GalleryPage } from './toys/Gallery';

const route = location.hash.replace('#', '');
createRoot(document.getElementById('root')!).render(<StrictMode>{route.startsWith('film@') ? <Film startAt={Number(route.slice(5))} onDone={() => (location.hash = '')} /> : route === 'gallery' ? <Gallery /> : route === 'closeup' ? <Closeup /> : route.startsWith('g') && route.length <= 3 ? <GalleryPage page={Number(route.slice(1))} /> : <App />}</StrictMode>);
