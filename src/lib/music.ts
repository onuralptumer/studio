
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
      source: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1b73489151.mp3',
    },
    {
      id: 2,
      title: 'Empty Mind',
      artist: 'Lofi-Lover',
      source: 'https://cdn.pixabay.com/download/audio/2023/05/08/audio_de2ce2d624.mp3',
    },
    {
      id: 3,
      title: 'Sleepy Cat',
      artist: 'Aleko',
      source: 'https://cdn.pixabay.com/download/audio/2024/02/09/audio_2731c3c965.mp3',
    },
];
