import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LangProvider } from './i18n/LangContext.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Explore from './pages/Explore.jsx';
import Editor from './pages/Editor.jsx';
import BuilderPage from './pages/BuilderPage.jsx';
import BlueprintEditor from './pages/BlueprintEditor.jsx';
import Admin from './pages/Admin.jsx';
import ProjectPanel from './pages/ProjectPanel.jsx';
import InfluencePage from './pages/InfluencePage.jsx';
import ChallengesPage from './pages/ChallengesPage.jsx';
import MarketplacePage from './pages/MarketplacePage.jsx';
import DocsPage from './pages/DocsPage.jsx';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-capable-navy dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/auth" state={{ from: location }} replace />;
}

// Admin-only route wrapper
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/builder" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
      <Route path="/builder/:id" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
      <Route path="/editor/:id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
      <Route path="/blueprint/:id" element={<ProtectedRoute><BlueprintEditor /></ProtectedRoute>} />
      <Route path="/project/:id" element={<ProtectedRoute><ProjectPanel /></ProtectedRoute>} />
      <Route path="/influence" element={<ProtectedRoute><InfluencePage /></ProtectedRoute>} />
      <Route path="/challenges" element={<ProtectedRoute><ChallengesPage /></ProtectedRoute>} />
      <Route path="/commitment" element={<Navigate to="/challenges" replace />} />
      <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LangProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LangProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
