import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SharePage } from './pages/SharePage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { useAuthStore } from './stores/authStore';
import { NotFoundPage } from './pages/NotFoundPage';
import { connectSocket, onVideoNotification, disconnectSocket } from './lib/socket';
import { useVideoStore } from './stores/videoStore';
import { useNotificationStore } from './stores/notificationStore';

import { ROUTES } from './constants/routes';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const { prependVideo, updateVoteCount } = useVideoStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();

      const unsubscribe = onVideoNotification((notification) => {
        if (notification.type === 'new_video') {
          prependVideo({
            id: notification.videoId!,
            youtube_id: '',
            title: notification.videoTitle!,
            description: '',
            thumbnail_url: notification.thumbnailUrl!,
            duration: '',
            view_count: 0,
            upvote_count: 0,
            downvote_count: 0,
            shared_by: {
              id: '',
              username: notification.sharedByUsername!,
            },
            user_vote: null,
            created_at: notification.createdAt!,
          });

          if (notification.sharedByUsername !== user?.username) {
            addNotification({
              id: notification.id,
              type: 'new_video',
              message: `${notification.sharedByUsername} shared: ${notification.videoTitle}`,
            });

            toast.success(`${notification.sharedByUsername} shared: ${notification.videoTitle}`, {
              icon: '🎬',
              duration: 5000,
            });
          }
        } else if (notification.type === 'vote_update') {
          updateVoteCount(
            notification.videoId!,
            notification.upvoteCount!,
            notification.downvoteCount!
          );
        }
      });

      return () => {
        unsubscribe();
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user?.username]);

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
