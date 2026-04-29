export const WS_EVENTS = {
  // Events from Client to Server
  AUTHENTICATE: 'authenticate',

  // Events from Server to Client
  NEW_VIDEO: 'newVideo',
  VIDEO_UPDATE: 'videoUpdate',
  JOB_FAILED: 'jobFailed',
} as const;

export type WSEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
