import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SharePage } from './pages/SharePage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { useAuthStore } from './stores/authStore';
import { NotFoundPage } from './pages/NotFoundPage';
import { useSocketVideoNotifications } from './hooks/useSocketVideoNotifications';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES } from './constants/routes';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useSocketVideoNotifications();

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          }>
            <Routes>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={ROUTES.VIDEO_DETAIL_PATH} element={<VideoDetailPage />} />
              <Route
                path={ROUTES.SHARE}
                element={
                  <ProtectedRoute>
                    <SharePage />
                  </ProtectedRoute>
                }
              />
              <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
