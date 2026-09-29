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
import { RatePage } from './pages/RatePage';
import { ProgressPage } from './pages/ProgressPage';
import { LearnMenu } from './learn/LearnMenu';
import { LearnRound } from './learn/LearnRound';
import { Guide } from './pages/Guide';
import { Library } from './pages/Library';
import { Stories } from './pages/Stories';
import { ChildSettings } from './pages/ChildSettings';
import { Recordings } from './pages/Recordings';
import { Account } from './pages/Account';

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
          <Route path="/guide" element={<RequireParent><Guide /></RequireParent>} />
          <Route path="/account" element={<RequireParent><Account /></RequireParent>} />
          <Route path="/child/:childId" element={<RequireParent><ChildLayout /></RequireParent>}>
            <Route index element={<ChildHome />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="rate" element={<RatePage />} />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="voice" element={<VoiceGames />} />
            <Route path="voice/:game" element={<VoiceGame />} />
            <Route path="learn" element={<LearnMenu />} />
            <Route path="learn/:subject" element={<LearnMenu />} />
            <Route path="learn/:subject/:game" element={<LearnRound />} />
            <Route path="stories" element={<Stories />} />
            <Route path="stories/:storyId" element={<Stories />} />
            <Route path="stickers" element={<StickerBook />} />
            <Route path="library" element={<Library />} />
            <Route path="settings" element={<ChildSettings />} />
            <Route path="recordings" element={<Recordings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
