import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Welcome } from './pages/Welcome';

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
          <Route path="*" element={<RequireParent><Navigate to="/children" replace /></RequireParent>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
