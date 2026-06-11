import { NAV_LINKS } from './layout';
import type { SiteContent } from './site';

export const fallbackSite: SiteContent = {
  siteMeta: {
    name: 'LOLA',
    description: 'LOLA — music',
  },
  navLinks: NAV_LINKS,
  heroImage: '/assets/image.jpg',
  heroAlt: 'LOLA',
  releases: [
    { title: 'Moon Song (LIVE)', image: '/assets/releases/release1.jpg' },
    { title: 'Anna Letter', image: '/assets/releases/release2.jpg' },
    { title: 'I hope the Sky is grey when I wake up', image: '/assets/releases/release3.jpg' },
    { title: 'Prayer Song (LIVE)', image: '/assets/releases/release4.jpg' },
  ],
  streaming: [
    {
      platform: 'spotify',
      label: 'Spotify',
      href: 'https://open.spotify.com/artist/3aKy2W3GntU09Uk44ECBNE',
    },
    { platform: 'bandcamp', label: 'Bandcamp', href: 'https://lola22.bandcamp.com' },
    {
      platform: 'youtube',
      label: 'YouTube',
      href: 'https://www.youtube.com/channel/UCSi_nu9PIJs9L__gi_2fEXw',
    },
    {
      platform: 'apple',
      label: 'Apple Music',
      href: 'https://music.apple.com/de/artist/lola/1702317471?l=en-GB',
    },
    { platform: 'tidal', label: 'Tidal', href: 'https://tidal.com/artist/49711600/u' },
  ],
  broadcasts: [
    {
      label: 'the nts breakfast show w/ flo — 29.04',
      url: 'https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-29th-april-2024',
    },
    {
      label: 'the nts breakfast show w/ flo — 30.09',
      url: 'https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-30th-september-2024',
    },
    {
      label: 'andras nts — 10.09.25',
      url: 'https://www.nts.live/shows/andras/episodes/andras-10th-september-2025',
    },
  ],
  playlists: [
    {
      label: 'the numero group playlist',
      url: 'https://open.spotify.com/playlist/3gyUmQhxmlYHe9UTySm4vU',
    },
    {
      label: 'public possession, ppool',
      url: 'https://open.spotify.com/playlist/6hwSVA1YrZo2updK18Oh3I',
    },
  ],
  press: [
    {
      label: 'destroy/exist: moon song (live)',
      url: 'https://www.destroyexist.com/2025/12/lola-moon-song-live.html',
    },
    {
      label: 'american pancake',
      url: 'https://www.americanpancake.com/2025/12/lola-and-beautifully-raw-textured.html',
    },
    {
      label: 'analogue trash',
      url: 'https://www.analoguetrash.com/blog/lola-moon-song-live',
    },
  ],
  videos: [
    { embedUrl: 'https://www.youtube.com/embed/Dwlp4D_zc3Y' },
    { embedUrl: 'https://www.youtube.com/embed/Lp8S0nWeHjw' },
  ],
  liveShows: [
    {
      date: '10 May 2024',
      text: 'The Shacklewell Arms: I OH YOU label presents: The Belair Lip Bombs, Man Woman Chainsaw, SORRY DJ set',
    },
    {
      date: '27 March 2025',
      text: 'Moth Club: Something in the Lake, Borough Council, Rabbitfoot',
    },
    {
      date: '7 April 2025',
      text: '@windmillbrixton: Multiple People [LA], Pazeamor, Tek lintowe (dj) @teklintowe, Able Archer (dj) @chr_st_an___',
    },
    { date: '21 May 2025', text: 'Windmill Brixton: The Rebel, Alicia Edelweiss' },
    { date: '12 July 2025', text: 'Secret Location: The Rebel, Fiscal Harm' },
    { date: '23 August 2025', text: 'Secret Location: CANTY, Spike' },
    {
      date: '2 October 2025',
      text: 'St Giles Church: The Rebel, Bell practice, Multiple People [LA]',
    },
    {
      date: '8 November 2025',
      text: 'The Blue Moon, Cambridge with Immersion, Pete Um, Visit me, Quade',
    },
    { date: '13 November 2025', text: 'Lexington with AUTOMATIC' },
    { date: '19 November 2025', text: 'Lexington with PENCIL' },
  ],
  contactEmails: ['lola_______@outlook.com'],
};
