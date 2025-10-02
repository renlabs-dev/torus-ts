export interface Prophet {
  name: string;
  handle: string;
  displayName?: string;
  twitterUrl: string;
  imageSrc: string;
  followers: number;
  tweetsCurrent: number;
  tweetsTotal: number;
  // 0-100 percentage of collected/scraped profile data
  collectionProgress: number;
}
