import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans-arabic/400.css';
import '@fontsource/ibm-plex-sans-arabic/600.css';
import '@fontsource/baloo-bhaijaan-2/500.css';
import '@fontsource/baloo-bhaijaan-2/700.css';
import '@fontsource/baloo-bhaijaan-2/800.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/kid.css';
import './styles/parent.css';
import './styles/games.css';
import './styles/session.css';
import { App } from './App';
import { startBackgroundSync } from './store/sync';

startBackgroundSync();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
