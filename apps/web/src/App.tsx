import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Welcome } from './pages/Welcome';
import { Children } from './pages/Children';
import { ChildLayout } from './pages/ChildLayout';
import { ChildHome } from './pages/ChildHome';
import { StickerBook } from './pages/StickerBook';
import { VoiceGame, VoiceGames } from './pages/VoiceGames';
import { SessionPage } from './session/SessionPage';

export function RequireParent({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === 'loading') return <div className="page" aria-busy="true" />;
  if (state.status === 'guest') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/children" element={<RequireParent><Children /></RequireParent>} />
          <Route path="/child/:childId" element={<RequireParent><ChildLayout /></RequireParent>}>
            <Route index element={<ChildHome />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="stickers" element={<StickerBook />} />
            <Route path="voice" element={<VoiceGames />} />
            <Route path="voice/:game" element={<VoiceGame />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
