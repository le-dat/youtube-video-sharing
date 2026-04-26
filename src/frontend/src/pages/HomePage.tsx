import { useEffect } from 'react';
import { VideoGrid } from '../components/VideoGrid';
import { useVideoStore } from '../stores/videoStore';

export function HomePage() {
  const { fetchVideos, page, totalPages, isLoading } = useVideoStore();

  useEffect(() => {
    fetchVideos(1);
  }, []);

  const loadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchVideos(page + 1);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Recent Videos</h1>
        <p className="text-text-secondary mt-1">Discover and share YouTube videos</p>
      </div>

      <VideoGrid />

      {page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="bg-secondary text-surface font-bold px-6 py-3 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
