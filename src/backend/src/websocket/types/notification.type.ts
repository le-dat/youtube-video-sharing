export interface NewVideoNotification {
  id: string;
  type: 'new_video';
  videoId: string;
  videoTitle: string;
  sharedByUsername: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface VoteUpdateNotification {
  id: string;
  type: 'vote_update';
  videoId: string;
  upvoteCount: number;
  downvoteCount: number;
}

export type Notification = NewVideoNotification | VoteUpdateNotification;
