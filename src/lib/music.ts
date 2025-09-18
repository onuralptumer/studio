
export type MusicTrack = {
    id: number;
    title: string;
    artist: string;
    source: string;
};
  
export const musicTracks: MusicTrack[] = [
    {
      id: 1,
      title: 'Lofi Study',
      artist: 'LofCosmos',
      source: '/music/focus-lofi-269097.mp3',
    },
    {
      id: 2,
      title: 'Morning Garden',
      artist: 'folk_acoustic',
      source: '/music/morning-garden-acoustic-chill-15013.mp3',
    },
    {
      id: 3,
      title: 'Jazzy Abstract',
      artist: 'ChilltapeFM',
      source: '/music/jazzy-focus-1-lofi-jazz-371178.mp3',
    },
];
