import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useAdvancedAudioControl } from '../hooks/useAdvancedAudioControl';

interface FloatingAudioControlProps {
  audioControl: ReturnType<typeof useAdvancedAudioControl>;
}

export const FloatingAudioControl: React.FC<FloatingAudioControlProps> = ({ audioControl }) => {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    showFloatingControl,
    toggleAudioPlayback,
    cycleAudioSpeed,
    locateCurrentAudio,
    closeFloatingControl,
    seekAudio,
    formatTime
  } = audioControl;

  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressKnobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Função para alternar reprodução
  const handleTogglePlayback = () => {
    if (audioControl.currentAudio && audioControl.currentContainer) {
      toggleAudioPlayback(audioControl.currentAudio, audioControl.currentContainer);
    }
  };

  // Função para alternar velocidade
  const handleSpeedChange = () => {
    cycleAudioSpeed();
  };

  // Função para localizar áudio
  const handleLocateAudio = () => {
    locateCurrentAudio();
  };

  // Função para fechar controle
  const handleClose = () => {
    closeFloatingControl();
  };

  // Função para clicar na barra de progresso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    
    seekAudio(newTime);
  };

  // Função para iniciar drag do knob
  const handleKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging || !progressBarRef.current || !duration) return;
      
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
      if (!isDragging || !progressBarRef.current || !duration) return;
      
      setIsDragging(false);
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
      const newTime = percent * duration;
      
      seekAudio(newTime);
      
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

  // Atualizar posição do progresso
  useEffect(() => {
    if (!progressFillRef.current || !progressKnobRef.current || !duration) return;
    
    const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    progressFillRef.current.style.width = `${clampedPercentage}%`;
    progressKnobRef.current.style.left = `${clampedPercentage}%`;
  }, [currentTime, duration]);

  if (!showFloatingControl) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: '#ffffff',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: 6,
        px: 2,
        py: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        zIndex: 1000,
        minWidth: 320,
        maxWidth: 400,
        width: '90vw',
        opacity: showFloatingControl ? 1 : 0,
        visibility: showFloatingControl ? 'visible' : 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Barra de progresso */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, width: '100%' }}>
        <Box
          ref={progressBarRef}
          onClick={handleProgressClick}
          onMouseDown={handleProgressMouseDown}
          className="audio-progress-bar"
          sx={{
            position: 'relative',
            width: '100%',
            height: 6,
            bgcolor: 'divider',
            borderRadius: 3,
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
              borderRadius: 3,
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
              width: 14,
              height: 14,
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
        
        {/* Display de tempo */}
        <Typography
          variant="caption"
          color="text.secondary"
          className="audio-time-display"
          sx={{
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}
        >
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>

      {/* Controles */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
        <Tooltip title="Localizar áudio">
          <IconButton
            size="small"
            onClick={handleLocateAudio}
            className="audio-locate-button"
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            <VolumeUpIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <IconButton
          size="small"
          onClick={handleTogglePlayback}
          className="audio-play-button"
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'grey.100',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { bgcolor: 'grey.200' }
          }}
        >
          {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>

        <Tooltip title="Velocidade de reprodução">
          <Box
            onClick={handleSpeedChange}
            className="audio-speed-button"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'auto',
              minWidth: 40,
              height: 36,
              px: 1,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600,
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            {playbackRate}x
          </Box>
        </Tooltip>

        <Tooltip title="Fechar controle">
          <IconButton
            size="small"
            onClick={handleClose}
            className="audio-close-button"
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'grey.100',
              border: '1px solid',
              borderColor: 'divider',
              color: 'error.main',
              '&:hover': { bgcolor: 'error.50' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};
