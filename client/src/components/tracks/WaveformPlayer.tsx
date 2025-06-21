import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Slider, Typography, Paper, Stack } from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as MuteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import WaveSurfer from 'wavesurfer.js';

interface WaveformPlayerProps {
  audioUrl: string;
  trackName: string;
  onTimeUpdate?: (time: number) => void;
  onMarkerClick?: (id: string, time: number) => void;
  markers?: { id: string; time: number; label: string; color?: string }[];
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioUrl,
  trackName,
  onTimeUpdate,
  onMarkerClick,
  markers = [],
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(50);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current) {
      // WaveSurfer configuration
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#3f51b5',
        progressColor: '#f50057',
        cursorColor: '#999',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 80,
        barGap: 2,
        responsive: true,
      });

      // Load audio file
      wavesurfer.current.load(audioUrl);

      // Set initial volume
      wavesurfer.current.setVolume(volume / 100);

      // Events
      wavesurfer.current.on('ready', () => {
        setDuration(wavesurfer.current?.getDuration() || 0);
      });

      wavesurfer.current.on('audioprocess', (time: number) => {
        setCurrentTime(time);
        if (onTimeUpdate) onTimeUpdate(time);
      });

      wavesurfer.current.on('seek', (progress: number) => {
        const time = progress * (wavesurfer.current?.getDuration() || 0);
        setCurrentTime(time);
        if (onTimeUpdate) onTimeUpdate(time);
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));

      // Add markers
      if (markers.length > 0 && wavesurfer.current) {
        markers.forEach((marker) => {
          // Note: In a real implementation, you would add markers to the waveform
          // This is a simplified version for example purposes
          console.log(`Adding marker at ${marker.time}s: ${marker.label}`);
        });
      }

      // Cleanup
      return () => {
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
        }
      };
    }
  }, [audioUrl, markers, onTimeUpdate, volume]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  // Handle volume change
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const newVolume = newValue as number;
    setVolume(newVolume);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume / 100);
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    if (wavesurfer.current) {
      if (isMuted) {
        wavesurfer.current.setVolume(volume / 100);
        setIsMuted(false);
      } else {
        wavesurfer.current.setVolume(0);
        setIsMuted(true);
      }
    }
  };

  // Handle zoom
  const handleZoomChange = (event: Event, newValue: number | number[]) => {
    const newZoom = newValue as number;
    setZoom(newZoom);
    if (wavesurfer.current) {
      // Set zoom level (this is simplified, in real implementation you'd use wavesurfer's zoom method)
      console.log(`Setting zoom to ${newZoom}`);
    }
  };

  // Format time for display (mm:ss)
  const formatTime = (time: number): string => {
    if (!time) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        {trackName}
      </Typography>
      
      {/* Waveform Container */}
      <Box ref={waveformRef} sx={{ mb: 2 }} />
      
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton onClick={togglePlayPause} size="large">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
        
        <Typography sx={{ width: 60, textAlign: 'center' }}>
          {formatTime(currentTime)}
        </Typography>
        
        <Box sx={{ flexGrow: 1, mx: 2 }}>
          <Slider
            value={currentTime}
            max={duration}
            onChange={(_, value) => {
              const time = value as number;
              if (wavesurfer.current) {
                wavesurfer.current.seekTo(time / duration);
              }
            }}
            aria-labelledby="track-progress"
          />
        </Box>
        
        <Typography sx={{ width: 60, textAlign: 'center' }}>
          {formatTime(duration)}
        </Typography>
      </Box>
      
      {/* Additional Controls (Volume & Zoom) */}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={toggleMute} size="small">
          {isMuted ? <MuteIcon /> : <VolumeIcon />}
        </IconButton>
        
        <Slider
          size="small"
          value={volume}
          onChange={handleVolumeChange as any}
          aria-labelledby="volume-slider"
          sx={{ width: 100 }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <IconButton size="small">
            <ZoomOutIcon />
          </IconButton>
          
          <Slider
            size="small"
            value={zoom}
            onChange={handleZoomChange as any}
            aria-labelledby="zoom-slider"
            sx={{ width: 80, mx: 1 }}
          />
          
          <IconButton size="small">
            <ZoomInIcon />
          </IconButton>
        </Box>
      </Stack>
    </Paper>
  );
};

export default WaveformPlayer;
