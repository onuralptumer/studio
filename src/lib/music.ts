
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
      source: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1819c48b43.mp3',
    },
    {
      id: 2,
      title: 'Morning Garden',
      artist: 'Olexy',
      source: 'https://cdn.pixabay.com/download/audio/2022/02/08/audio_2fd426c62c.mp3',
    },
    {
      id: 3,
      title: 'Jazzy Abstract',
      artist: 'Coma-Media',
      source: 'https://cdn.pixabay.com/download/audio/2023/04/14/audio_3b4b234d31.mp3',
    },
];
