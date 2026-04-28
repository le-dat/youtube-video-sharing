import { Link } from 'react-router-dom';
import type { Video } from '../lib/api';
import { ROUTES } from '../constants/routes';

interface VideoCardProps {
  video: Video;
  isLoading?: boolean;
  onVote?: (voteType: 'up' | 'down') => void;
}

export function VideoCard({ video, isLoading, onVote }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail_url?.replace('hqdefault', 'mqdefault');

  return (
    <div className="bg-surface border-3 border-text-primary shadow-neo hover:shadow-none transition-all">
      <Link to={ROUTES.VIDEO_DETAIL(video.id)}>
        <div className="relative">
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="w-full aspect-video object-cover"
          />
          {video.duration && (
            <span className="absolute bottom-2 right-2 bg-text-primary text-surface text-xs px-2 py-1 font-mono">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={ROUTES.VIDEO_DETAIL(video.id)}>
          <h3 className="font-bold text-text-primary line-clamp-2 hover:text-secondary">
            {video.title}
          </h3>
        </Link>

        <p className="text-text-secondary text-sm mt-1">
          Shared by {video.shared_by.username}
        </p>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 mt-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-secondary font-mono">
              {formatCount(video.view_count)} views
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onVote?.('up')}
              disabled={!onVote || isLoading || video.user_vote === 'up'}
              className={`flex-1 md:flex-none p-2 border-3 border-text-primary font-bold transition-all flex items-center justify-center gap-1 ${
                video.user_vote === 'up'
                  ? 'bg-success text-surface opacity-70 cursor-not-allowed'
                  : `bg-surface text-text-primary ${(!onVote || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success hover:text-surface'}`
              }`}
              title={!onVote ? "Login to like" : (video.user_vote === 'up' ? "You liked this" : "Like")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.708C19.712 10 20.5 10.788 20.5 11.765c0 .247-.052.49-.153.712l-2.94 6.47c-.38.835-1.22 1.353-2.137 1.353H9V10l5-5c.44-.44 1.16-.44 1.6 0 .44.44.44 1.16 0 1.6L14 10zM9 10H5v10h4V10z" />
              </svg>
              <span className="text-sm font-mono">{video.upvote_count}</span>
            </button>

            <button
              onClick={() => onVote?.('down')}
              disabled={!onVote || isLoading || video.user_vote === 'down'}
              className={`flex-1 md:flex-none p-2 border-3 border-text-primary font-bold transition-all flex items-center justify-center gap-1 ${
                video.user_vote === 'down'
                  ? 'bg-danger text-surface opacity-70 cursor-not-allowed'
                  : `bg-surface text-text-primary ${(!onVote || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-danger hover:text-surface'}`
              }`}
              title={!onVote ? "Login to dislike" : (video.user_vote === 'down' ? "You disliked this" : "Dislike")}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.292C4.288 14 3.5 13.212 3.5 12.235c0-.247.052-.49.153-.712l2.94-6.47C6.973 4.218 7.813 3.7 8.73 3.7H15v10l-5 5c-.44.44-1.16.44-1.6 0-.44-.44-.44-1.16 0-1.6l1.6-3.4zM15 14h4V4h-4v10z" />
              </svg>
              <span className="text-sm font-mono">{video.downvote_count}</span>
            </button>
          </div>
        </div>
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

function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
