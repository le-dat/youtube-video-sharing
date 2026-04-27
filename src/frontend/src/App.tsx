import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SharePage } from './pages/SharePage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { useAuthStore } from './stores/authStore';
import { connectSocket, onVideoNotification, disconnectSocket } from './lib/socket';
import { useVideoStore } from './stores/videoStore';
import { useNotificationStore } from './stores/notificationStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
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

          addNotification({
            id: notification.id,
            type: 'new_video',
            message: `${notification.sharedByUsername} shared: ${notification.videoTitle}`,
          });
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
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/video/:id" element={<VideoDetailPage />} />
            <Route
              path="/share"
              element={
                <ProtectedRoute>
                  <SharePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
