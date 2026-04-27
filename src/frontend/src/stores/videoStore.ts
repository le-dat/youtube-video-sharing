import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { videosApi } from '../lib/api';
import type { Video } from '../lib/api';

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  fetchVideos: (page?: number) => Promise<void>;
  fetchVideo: (id: string) => Promise<void>;
  shareVideo: (youtubeUrl: string) => Promise<Video>;
  vote: (videoId: string, voteType: 'up' | 'down') => Promise<void>;
  prependVideo: (video: Video) => void;
  updateVoteCount: (videoId: string, upvoteCount: number, downvoteCount: number) => void;
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set, get) => ({
      videos: [],
      currentVideo: null,
      page: 1,
      totalPages: 1,
      isLoading: false,
      error: null,

      fetchVideos: async (page = 1) => {
        set({ isLoading: true, error: null });
        try {
          const data = await videosApi.list(page);
          set({
            videos: page === 1 ? data.data : [...get().videos, ...data.data],
            page: data.pagination.current_page,
            totalPages: data.pagination.total_pages,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Failed to fetch videos',
            isLoading: false,
          });
        }
      },

      fetchVideo: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await videosApi.show(id);
          set({ currentVideo: data, isLoading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Failed to fetch video',
            isLoading: false,
          });
        }
      },

      shareVideo: async (youtubeUrl: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await videosApi.create(youtubeUrl);
          const newVideo = data;
          set((state) => ({
            videos: [newVideo, ...state.videos],
            isLoading: false,
          }));
          return newVideo;
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Failed to share video',
            isLoading: false,
          });
          throw err;
        }
      },

      vote: async (videoId: string, voteType: 'up' | 'down') => {
        const videos = get().videos;
        const videoIndex = videos.findIndex((v) => v.id === videoId);

        if (videoIndex !== -1) {
          const video = videos[videoIndex];
          let newUpvoteCount = video.upvote_count;
          let newDownvoteCount = video.downvote_count;

          if (video.user_vote === voteType) {
            if (voteType === 'up') newUpvoteCount--;
            else newDownvoteCount--;
          } else if (video.user_vote === null) {
            if (voteType === 'up') newUpvoteCount++;
            else newDownvoteCount++;
          } else {
            if (voteType === 'up') {
              newUpvoteCount++;
              newDownvoteCount--;
            } else {
              newUpvoteCount--;
              newDownvoteCount++;
            }
          }

          const updatedVideos = [...videos];
          updatedVideos[videoIndex] = {
            ...video,
            upvote_count: newUpvoteCount,
            downvote_count: newDownvoteCount,
            user_vote: video.user_vote === voteType ? null : voteType,
          };
          set({ videos: updatedVideos });
        }

        try {
          const data = await videosApi.vote(videoId, voteType);
          const { upvote_count, downvote_count } = data.video;
          get().updateVoteCount(videoId, upvote_count, downvote_count);
        } catch (err: any) {
          set({ videos });
          throw err;
        }
      },

      prependVideo: (video: Video) => {
        set((state) => ({
          videos: [video, ...state.videos],
        }));
      },

      updateVoteCount: (videoId: string, upvoteCount: number, downvoteCount: number) => {
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === videoId
              ? { ...v, upvote_count: upvoteCount, downvote_count: downvoteCount }
              : v
          ),
        }));
      },
    }),
    {
      name: 'video-storage',
      partialize: () => ({}),
    }
  )
);
