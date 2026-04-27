import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVideoStore } from '../stores/videoStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentVideo, fetchVideo, vote, isLoading, error } = useVideoStore();
  const { isAuthenticated } = useAuthStore();
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo(id);
    }
  }, [id]);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }

    if (!id || isVoting) return;

    setIsVoting(true);
    try {
      await vote(id, voteType);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading && !currentVideo) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error || !currentVideo) {
    return (
      <div className="text-center py-20">
        <p className="text-danger text-lg font-bold">Video not found</p>
        <Link to="/" className="text-secondary hover:underline mt-4 inline-block font-bold">
          Back to home
        </Link>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${currentVideo.youtube_id}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface border-3 border-text-primary overflow-hidden shadow-neo">
        <div className="aspect-video bg-black">
          <iframe
            src={embedUrl}
            title={currentVideo.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-text-primary mb-4">{currentVideo.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">
                Shared by{' '}
                <span className="text-secondary font-bold">{currentVideo.shared_by.username}</span>
              </span>
              <span className="text-text-secondary font-mono text-sm">
                {new Date(currentVideo.created_at).toLocaleDateString()}
              </span>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('up')}
                  disabled={isVoting}
                  className={`p-3 border-3 border-text-primary font-bold transition-all ${
                    currentVideo.user_vote === 'up'
                      ? 'bg-success text-surface'
                      : 'bg-surface text-text-primary hover:bg-success hover:text-surface'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className="text-xl font-bold text-text-primary font-mono">
                  {currentVideo.upvote_count - currentVideo.downvote_count}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  disabled={isVoting}
                  className={`p-3 border-3 border-text-primary font-bold transition-all ${
                    currentVideo.user_vote === 'down'
                      ? 'bg-danger text-surface'
                      : 'bg-surface text-text-primary hover:bg-danger hover:text-surface'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {currentVideo.description && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-text-primary mb-2">Description</h3>
              <p className="text-text-secondary whitespace-pre-wrap">{currentVideo.description}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4 text-sm text-text-secondary font-mono">
            <span>{currentVideo.view_count.toLocaleString()} views</span>
            <span>{currentVideo.upvote_count.toLocaleString()} upvotes</span>
            {currentVideo.duration && (
              <span>Duration: {formatDuration(currentVideo.duration)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-text-secondary hover:text-text-primary font-bold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
    </div>
  );
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
