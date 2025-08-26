import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { useAdvancedAudioControl } from '../hooks/useAdvancedAudioControl';

interface AudioMessageProps {
  audioControl: ReturnType<typeof useAdvancedAudioControl>;
  url: string;
  duration?: number;
  messageId: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({ 
  audioControl, 
  url
}) => {
  console.log('🎵 AudioMessage renderizando com URL:', url);
  
  const {
    currentAudio,
    isPlaying,
    currentTime,
    duration: currentDuration,
    playbackRate,
    toggleAudioPlayback,
    seekAudio,
    formatTime
  } = audioControl;

  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressKnobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  // Verificar se este é o áudio ativo
  const isActiveAudio = currentAudio === audioRef.current;
  const isCurrentlyPlaying = isActiveAudio && isPlaying;

  // Função para alternar reprodução
  const handleTogglePlayback = () => {
    if (!audioRef.current || !containerRef.current) return;
    toggleAudioPlayback(audioRef.current, containerRef.current);
  };

  // Função para alternar velocidade
  const handleSpeedChange = () => {
    if (!audioRef.current) return;
    
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    audioRef.current.playbackRate = newSpeed;
  };

  // Função para clicar na barra de progresso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !progressBarRef.current || !localDuration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * localDuration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setLocalCurrentTime(newTime);
    }
    
    // Se for o áudio ativo, sincronizar com o controle principal
    if (isActiveAudio) {
      seekAudio(newTime);
    }
  };

  // Função para iniciar drag do knob
  const handleKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || !localDuration) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      
      // Atualizar visualmente
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${percent * 100}%`;
      }
      if (progressKnobRef.current) {
        progressKnobRef.current.style.left = `${percent * 100}%`;
      }
    };
    
    const handleMouseUp = (upEvent: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || !localDuration) return;
      
      setIsDragging(false);
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
      const newTime = percent * localDuration;
      
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
        setLocalCurrentTime(newTime);
      }
      
      // Se for o áudio ativo, sincronizar com o controle principal
      if (isActiveAudio) {
        seekAudio(newTime);
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Função para iniciar drag da barra
  const handleProgressMouseDown = (e: React.MouseEvent) => {
    // Só permitir se não clicou diretamente no knob
    if (e.target === progressKnobRef.current) return;
    handleKnobMouseDown(e);
  };

  // Atualizar progresso local
  useEffect(() => {
    if (!audioRef.current) return;

    const updateProgress = () => {
      if (audioRef.current) {
        setLocalCurrentTime(audioRef.current.currentTime);
        setLocalDuration(audioRef.current.duration || 0);
      }
    };

    const onTimeUpdate = () => updateProgress();
    const onLoadedMetadata = () => updateProgress();

    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
    };
  }, []);

  // Atualizar posição do progresso
  useEffect(() => {
    if (!progressFillRef.current || !progressKnobRef.current || !localDuration) return;
    
    const percentage = localDuration > 0 ? (localCurrentTime / localDuration) * 100 : 0;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    progressFillRef.current.style.width = `${clampedPercentage}%`;
    progressKnobRef.current.style.left = `${clampedPercentage}%`;
  }, [localCurrentTime, localDuration]);

  // Sincronizar com o controle principal quando for o áudio ativo
  useEffect(() => {
    if (isActiveAudio) {
      setLocalCurrentTime(currentTime);
      setLocalDuration(currentDuration);
    }
  }, [isActiveAudio, currentTime, currentDuration]);

  return (
    <Box
      ref={containerRef}
      className={`audio-message ${isCurrentlyPlaying ? 'playing' : ''} audio-message-debug`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 1,
        maxWidth: 380,
        transition: 'all 0.2s ease',
        '&.playing': {
          borderColor: 'primary.main',
          boxShadow: 2
        }
      }}
    >
              {/* Botão play/pause */}
        <IconButton
          size="small"
          onClick={handleTogglePlayback}
          className="audio-play-button"
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'grey.100',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'grey.200' }
          }}
        >
          {isCurrentlyPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>

      {/* Controles de áudio */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Barra de progresso */}
        <Box
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          className="audio-progress-bar"
          sx={{
            position: 'relative',
            height: 4,
            bgcolor: 'divider',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover .audio-progress-knob': {
              opacity: 1
            }
          }}
        >
          <Box
            ref={progressFillRef}
            className="audio-progress-fill"
            sx={{
              height: '100%',
              bgcolor: 'primary.main',
              borderRadius: 2,
              width: '0%',
              transition: 'width 0.1s linear'
            }}
          />
          <Box
            ref={progressKnobRef}
            className="audio-progress-knob"
            onMouseDown={handleKnobMouseDown}
            sx={{
              position: 'absolute',
              width: 12,
              height: 12,
              bgcolor: 'primary.main',
              border: '2px solid',
              borderColor: 'white',
              borderRadius: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              left: '0%',
              boxShadow: 2,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              '&:active': {
                cursor: 'grabbing'
              }
            }}
          />
        </Box>

        {/* Informações de tempo e velocidade */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="caption"
            color="text.secondary"
            className="audio-time-display"
            sx={{
              fontFamily: 'monospace',
              fontSize: '11px'
            }}
          >
            {formatTime(localCurrentTime)} / {formatTime(localDuration)}
          </Typography>

          <Tooltip title="Velocidade de reprodução">
            <Box
              onClick={handleSpeedChange}
              className="audio-speed-button"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'auto',
                minWidth: 30,
                height: 24,
                px: 1,
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 600,
                '&:hover': { bgcolor: 'grey.200' }
              }}
            >
              {isActiveAudio ? playbackRate : 1}x
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* Elemento de áudio oculto */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        style={{ display: 'none' }}
      />
    </Box>
  );
};
