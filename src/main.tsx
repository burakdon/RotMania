import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './ui/styles.css';
import { App } from './App';
import { Closeup, Gallery, GalleryPage } from './toys/Gallery';

const route = location.hash.replace('#', '');
createRoot(document.getElementById('root')!).render(<StrictMode>{route === 'gallery' ? <Gallery /> : route === 'closeup' ? <Closeup /> : route.startsWith('g') && route.length <= 3 ? <GalleryPage page={Number(route.slice(1))} /> : <App />}</StrictMode>);
