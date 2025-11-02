export const API_BASE_URL = "https://api.twitterapi.io";

export const ENDPOINTS = {
  // User endpoints
  USER_INFO: "twitter/user/info",
  USER_BATCH_INFO: "twitter/user/batch_info_by_ids",
  USER_LAST_TWEETS: "twitter/user/last_tweets",
  USER_FOLLOWERS: "twitter/user/followers",
  USER_FOLLOWINGS: "twitter/user/followings",
  USER_MENTIONS: "twitter/user/mentions",
  USER_SEARCH: "twitter/user/search",
  USER_VERIFIED_FOLLOWERS: "twitter/user/verifiedFollowers",
  CHECK_FOLLOW_RELATIONSHIP: "twitter/user/check_follow_relationship",

  // Tweet endpoints
  GET_TWEETS: "twitter/tweets",
  TWEET_REPLIES: "twitter/tweet/replies",
  TWEET_QUOTES: "twitter/tweet/quotes",
  TWEET_RETWEETERS: "twitter/tweet/retweeters",
  TWEET_THREAD_CONTEXT: "twitter/tweet/thread_context",
  GET_ARTICLE: "twitter/article",
  TWEET_ADVANCED_SEARCH: "twitter/tweet/advanced_search",

  // Action endpoints v2
  USER_LOGIN_V2: "twitter/user_login_v2",
  UPLOAD_MEDIA_V2: "twitter/upload_media_v2",
  CREATE_TWEET_V2: "twitter/create_tweet_v2",
  DELETE_TWEET_V2: "twitter/delete_tweet_v2",
  RETWEET_TWEET_V2: "twitter/retweet_tweet_v2",
  LIKE_TWEET_V2: "twitter/like_tweet_v2",
  UNLIKE_TWEET_V2: "twitter/unlike_tweet_v2",
  FOLLOW_USER_V2: "twitter/follow_user_v2",
  UNFOLLOW_USER_V2: "twitter/unfollow_user_v2",
  GET_DM_HISTORY: "twitter/get_dm_history_by_user_id",
  SEND_DM_V2: "twitter/send_dm_to_user",

  // Community endpoints
  CREATE_COMMUNITY_V2: "twitter/create_community_v2",
  DELETE_COMMUNITY_V2: "twitter/delete_community_v2",
  JOIN_COMMUNITY_V2: "twitter/join_community_v2",
  LEAVE_COMMUNITY_V2: "twitter/leave_community_v2",
} as const;

export const DEFAULT_RETRY_CONFIG = {
  limit: 3,
  methods: ["get", "post"],
  statusCodes: [408, 413, 429, 500, 502, 503, 504],
  backoffLimit: 3000,
};

export const DEFAULT_TIMEOUT = 30000; // 30 seconds
