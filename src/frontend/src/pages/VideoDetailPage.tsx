import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { BackButton } from "../components/BackButton";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../stores/authStore";
import { useVideoStore } from "../stores/videoStore";

export function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { currentVideo, fetchVideo, vote, isLoading, error } = useVideoStore();
  const { isAuthenticated } = useAuthStore();
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVideo(id);
    }
  }, [id]);

  const handleVote = async (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      toast.error("Please login to vote");
      return;
    }

    if (!id || isVoting) return;

    setIsVoting(true);
    try {
      await vote(id, voteType);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to vote");
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
        <Link
          to={ROUTES.HOME}
          className="text-secondary hover:underline mt-4 inline-block font-bold"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${currentVideo.youtube_id}`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>

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
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            {currentVideo.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-text-secondary">
                Shared by{" "}
                <span className="text-secondary font-bold">
                  {currentVideo.shared_by.username}
                </span>
              </span>
              <span className="text-text-secondary font-mono text-sm">
                {new Date(currentVideo.created_at).toLocaleDateString()}
              </span>
            </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote("up")}
                  disabled={!isAuthenticated || isVoting || isLoading || currentVideo.user_vote === "up"}
                  className={`p-3 border-3 border-text-primary font-bold transition-all ${
                    currentVideo.user_vote === "up"
                      ? "bg-success text-surface opacity-70 cursor-not-allowed"
                      : `bg-surface text-text-primary ${(!isAuthenticated || isVoting || isLoading) ? "opacity-50 cursor-not-allowed" : "hover:bg-success hover:text-surface"}`
                  }`}
                  title={!isAuthenticated ? "Login to like" : (currentVideo.user_vote === "up" ? "You liked this" : "Like")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.708C19.712 10 20.5 10.788 20.5 11.765c0 .247-.052.49-.153.712l-2.94 6.47c-.38.835-1.22 1.353-2.137 1.353H9V10l5-5c.44-.44 1.16-.44 1.6 0 .44.44.44 1.16 0 1.6L14 10zM9 10H5v10h4V10z"
                    />
                  </svg>
                </button>
                <span className="text-xl font-bold text-text-primary font-mono">
                  {currentVideo.upvote_count - currentVideo.downvote_count}
                </span>
                <button
                  onClick={() => handleVote("down")}
                  disabled={!isAuthenticated || isVoting || isLoading || currentVideo.user_vote === "down"}
                  className={`p-3 border-3 border-text-primary font-bold transition-all ${
                    currentVideo.user_vote === "down"
                      ? "bg-danger text-surface opacity-70 cursor-not-allowed"
                      : `bg-surface text-text-primary ${(!isAuthenticated || isVoting || isLoading) ? "opacity-50 cursor-not-allowed" : "hover:bg-danger hover:text-surface"}`
                  }`}
                  title={!isAuthenticated ? "Login to dislike" : (currentVideo.user_vote === "down" ? "You disliked this" : "Dislike")}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14H5.292C4.288 14 3.5 13.212 3.5 12.235c0-.247.052-.49.153-.712l2.94-6.47C6.973 4.218 7.813 3.7 8.73 3.7H15v10l-5 5c-.44.44-1.16.44-1.6 0-.44-.44-.44-1.16 0-1.6l1.6-3.4zM15 14h4V4h-4v10z"
                    />
                  </svg>
                </button>
              </div>
          </div>

          {currentVideo.description && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-text-primary mb-2">
                Description
              </h3>
              <p className="text-text-secondary whitespace-pre-wrap">
                {currentVideo.description}
              </p>
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
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
