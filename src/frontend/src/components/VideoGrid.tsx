import { useVideoStore } from '../stores/videoStore';
import { VideoCard } from './VideoCard';
import { useAuthStore } from '../stores/authStore';

export function VideoGrid() {
  const { videos, isLoading, vote } = useVideoStore();
  const { isAuthenticated } = useAuthStore();

  const handleVote = async (videoId: string, voteType: 'up' | 'down') => {
    if (!isAuthenticated) return;
    try {
      await vote(videoId, voteType);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  if (isLoading && videos.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary text-lg">No videos shared yet.</p>
        <p className="text-text-secondary mt-2">Be the first to share a YouTube video!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          isLoading={isLoading}
          onVote={isAuthenticated ? (type) => handleVote(video.id, type) : undefined}
        />
      ))}
    </div>
  );
}
