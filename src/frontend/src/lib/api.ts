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
  (response) => {
    // If the response follows our standard wrapper, unwrap it
    if (response.data && response.data.success === true && "data" in response.data) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, we could trigger a logout or just reject
        // For now, let the error propagate so the store can handle it
        return Promise.reject(refreshError);
      }
    }

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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export const authApi = {
  register: (username: string, email: string, password: string): Promise<{ user: User }> =>
    api.post("/auth/register", { username, email, password }),

  login: (email: string, password: string): Promise<{ user: User }> => 
    api.post("/auth/login", { email, password }),

  logout: (): Promise<void> => api.post("/auth/logout"),

  me: (): Promise<User> => api.get("/auth/me"),
};

export const videosApi = {
  list: (page = 1): Promise<PaginatedResponse<Video>> => 
    api.get("/videos", { params: { page } }),

  show: (id: string): Promise<Video> => api.get(`/videos/${id}`),

  create: (youtubeUrl: string): Promise<Video> => 
    api.post("/videos", { youtubeUrl }),

  vote: (videoId: string, voteType: "up" | "down"): Promise<{ video: { upvote_count: number, downvote_count: number } }> =>
    api.post(`/videos/${videoId}/vote`, { voteType }),
};
