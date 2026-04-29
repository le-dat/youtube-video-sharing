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

export interface JobFailedNotification {
  id: string;
  type: 'job_failed';
  jobId: string;
  jobType: 'video_share';
  error: string;
  timestamp: string;
}

export type Notification =
  | NewVideoNotification
  | VoteUpdateNotification
  | JobFailedNotification;
