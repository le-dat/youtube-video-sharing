export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  SHARE: '/share',
  VIDEO_DETAIL: (id: string) => `/video/${id}`,
  VIDEO_DETAIL_PATH: '/video/:id',
} as const;
