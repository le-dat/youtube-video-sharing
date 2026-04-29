import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { connectSocket, onVideoNotification, disconnectSocket } from '../lib/socket';
import { useVideoStore } from '../stores/videoStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';

export function useSocketVideoNotifications() {
  const { user } = useAuthStore();
  const { prependVideo, updateVoteCount } = useVideoStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!user) return;

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
          shared_by: { id: '', username: notification.sharedByUsername! },
          user_vote: null,
          created_at: notification.createdAt!,
        });

        if (notification.sharedByUsername !== user.username) {
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
        updateVoteCount(notification.videoId!, notification.upvoteCount!, notification.downvoteCount!);
      }
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, [user?.username]);
}