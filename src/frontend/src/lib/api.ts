import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Video {
  id: string;
  youtube_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  view_count: number;
  upvote_count: number;
  downvote_count: number;
  shared_by: {
    id: string;
    username: string;
  };
  user_vote: "up" | "down" | null;
  created_at: string;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post("/auth/register", { username, email, password }),

  login: (email: string, password: string) => api.post("/auth/login", { email, password }),

  logout: () => api.delete("/auth/logout"),

  me: () => api.get("/auth/me"),
};

export const videosApi = {
  list: (page = 1) => api.get("/videos", { params: { page } }),

  show: (id: string) => api.get(`/videos/${id}`),

  create: (youtubeUrl: string) => api.post("/videos", { youtube_url: youtubeUrl }),

  vote: (videoId: string, voteType: "up" | "down") =>
    api.post(`/videos/${videoId}/vote`, { vote_type: voteType }),
};
