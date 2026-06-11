export type SiteMeta = {
  name: string;
  description: string;
};

export type NavLink = {
  href: string;
  label: string;
};

export type Release = {
  title: string;
  image: string;
};

export type StreamingPlatform = 'spotify' | 'bandcamp' | 'youtube' | 'apple' | 'tidal';

export type StreamingLink = {
  platform: StreamingPlatform;
  label: string;
  href: string;
};

export type LinkItem = {
  label: string;
  url: string;
};

export type VideoEmbed = {
  embedUrl: string;
};

export type LiveShow = {
  date: string;
  text: string;
};

export type SiteContent = {
  siteMeta: SiteMeta;
  navLinks: NavLink[];
  heroImage: string;
  heroAlt: string;
  releases: Release[];
  streaming: StreamingLink[];
  broadcasts: LinkItem[];
  playlists: LinkItem[];
  press: LinkItem[];
  videos: VideoEmbed[];
  liveShows: LiveShow[];
  contactEmails: string[];
};
