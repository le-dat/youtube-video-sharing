import { VideoShareForm } from '../components/VideoShareForm';
import { BackButton } from '../components/BackButton';

export function SharePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

      <div className="bg-surface border-3 border-text-primary p-8 shadow-neo">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Share a YouTube Video</h1>
        <p className="text-text-secondary mb-6">
          Paste a YouTube URL to share it with the community
        </p>

        <VideoShareForm />

        <div className="mt-6 p-4 bg-surface border-3 border-text-primary">
          <h3 className="text-sm font-bold text-text-primary mb-2">Supported formats:</h3>
          <ul className="text-sm text-text-secondary space-y-1 font-mono">
            <li>• https://www.youtube.com/watch?v=...</li>
            <li>• https://youtu.be/...</li>
            <li>• https://www.youtube.com/embed/...</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
