
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
      artist: 'FASSounds',
      source: '/music/lofi-study.mp3',
    },
    {
      id: 2,
      title: 'Morning Garden',
      artist: 'Olexy',
      source: '/music/morning-garden.mp3',
    },
    {
      id: 3,
      title: 'Jazzy Abstract',
      artist: 'Coma-Media',
      source: '/music/jazzy-abstract.mp3',
    },
];
