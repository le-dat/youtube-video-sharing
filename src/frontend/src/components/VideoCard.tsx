import { Link } from 'react-router-dom';
import type { Video } from '../lib/api';

interface VideoCardProps {
  video: Video;
  onVote?: (voteType: 'up' | 'down') => void;
}

export function VideoCard({ video, onVote }: VideoCardProps) {
  const thumbnailUrl = video.thumbnail_url?.replace('hqdefault', 'mqdefault');

  return (
    <div className="bg-surface border-3 border-text-primary shadow-neo hover:shadow-none transition-all">
      <Link to={`/video/${video.id}`}>
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
        <Link to={`/video/${video.id}`}>
          <h3 className="font-bold text-text-primary line-clamp-2 hover:text-secondary">
            {video.title}
          </h3>
        </Link>

        <p className="text-text-secondary text-sm mt-1">
          Shared by {video.shared_by.username}
        </p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-secondary font-mono">
              {formatCount(video.view_count)} views
            </span>
          </div>

          {onVote && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onVote('up')}
                className={`p-2 border-3 border-text-primary font-bold transition-all ${
                  video.user_vote === 'up'
                    ? 'bg-success text-surface'
                    : 'bg-surface text-text-primary hover:bg-success hover:text-surface'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="ml-1 text-sm font-mono">{video.upvote_count}</span>
              </button>

              <button
                onClick={() => onVote('down')}
                className={`p-2 border-3 border-text-primary font-bold transition-all ${
                  video.user_vote === 'down'
                    ? 'bg-danger text-surface'
                    : 'bg-surface text-text-primary hover:bg-danger hover:text-surface'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="ml-1 text-sm font-mono">{video.downvote_count}</span>
              </button>
            </div>
          )}
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
