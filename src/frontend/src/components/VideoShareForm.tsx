import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useVideoStore } from '../stores/videoStore';

export function VideoShareForm() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { shareVideo, isLoading, error } = useVideoStore();
  const navigate = useNavigate();

  const validateUrl = (url: string) => {
    const patterns = [
      /youtube\.com\/watch\?v=[\w-]+/,
      /youtu\.be\/[\w-]+/,
      /youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(youtubeUrl)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    try {
      await shareVideo(youtubeUrl);
      toast.success('Video shared successfully!');
      navigate(`/`);
    } catch {
      toast.error(error || 'Failed to share video');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="youtubeUrl" className="block text-sm font-bold text-text-primary mb-2">
          YouTube URL
        </label>
        <input
          type="text"
          id="youtubeUrl"
          value={youtubeUrl}
          onChange={(e) => {
            setYoutubeUrl(e.target.value);
            setIsValid(e.target.value ? validateUrl(e.target.value) : null);
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className={`w-full px-4 py-3 bg-surface border-3 text-text-primary placeholder-text-secondary focus:outline-none ${
            isValid === false ? 'border-danger' : 'border-text-primary'
          }`}
        />
        {isValid === false && (
          <p className="mt-1 text-sm text-danger font-mono">Please enter a valid YouTube URL</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !youtubeUrl}
        className="w-full bg-primary text-text-primary font-bold py-3 px-4 border-3 border-text-primary shadow-neo hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sharing...' : 'Share Video'}
      </button>
    </form>
  );
}
