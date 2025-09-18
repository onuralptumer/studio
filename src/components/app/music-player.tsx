
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music4,
  ChevronUp,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { musicTracks, MusicTrack } from '@/lib/music';

export function MusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = musicTracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setIsMuted(volume === 0);
    }
  }, [volume]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleTrackChange = (index: number) => {
    setCurrentTrackIndex(index);
    if (!isPlaying) {
        setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-full bg-card/80 backdrop-blur-sm border shadow-lg">
      <audio ref={audioRef} src={currentTrack.source} loop />

      <Button variant="ghost" size="icon" onClick={handlePlayPause}>
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </Button>

      <div className="flex items-center gap-2 w-40">
        <Music4 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium truncate w-full">{currentTrack.title}</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <ChevronUp className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="top" align="center">
          <div className="grid gap-4">
            <h4 className="font-medium leading-none">Tracks</h4>
            <div className="flex flex-col gap-2">
              {musicTracks.map((track, index) => (
                <Button
                  key={track.id}
                  variant={index === currentTrackIndex ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleTrackChange(index)}
                  className="justify-start"
                >
                  {track.title}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-2 w-32">
        <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
          {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          onValueChange={(value) => setVolume(value[0])}
          max={1}
          step={0.05}
          className="w-full"
        />
      </div>
    </div>
  );
}
