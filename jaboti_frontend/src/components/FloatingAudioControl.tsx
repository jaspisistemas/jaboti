import React, { useEffect, useRef, useState } from 'react';

interface FloatingAudioControlProps {
  isVisible: boolean;
  audioElement: HTMLAudioElement | null;
  onClose: () => void;
  onLocate: () => void;
}

export const FloatingAudioControl: React.FC<FloatingAudioControlProps> = ({
  isVisible,
  audioElement,
  onClose,
  onLocate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(audioElement.currentTime);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setPlaybackRate(audioElement.playbackRate);
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Sincronizar estado inicial
    setIsPlaying(!audioElement.paused);
    setCurrentTime(audioElement.currentTime);
    setPlaybackRate(audioElement.playbackRate);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audioElement, isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };

  const cycleSpeed = () => {
    if (!audioElement) return;

    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    audioElement.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !audioElement || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;

    if (isFinite(newTime) && !isNaN(newTime)) {
      audioElement.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging || !audioElement || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const previewTime = percent * duration;
      setCurrentTime(previewTime);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);

      if (audioElement && duration) {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
        const newTime = percent * duration;

        if (isFinite(newTime) && !isNaN(newTime)) {
          audioElement.currentTime = newTime;
          setCurrentTime(newTime);
        }
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isVisible || !audioElement) return null;

  return (
    <div className="floating-audio-control">
      {/* Barra de progresso */}
      <div
        ref={progressRef}
        className="audio-progress-bar"
        onClick={handleProgressClick}
        onMouseDown={handleProgressDrag}
      >
        <div className="audio-progress-fill" style={{ width: `${progressPercentage}%` }} />
        <div className="audio-progress-knob" style={{ left: `${progressPercentage}%` }} />
      </div>

      {/* Controles principais */}
      <div className="floating-controls-container">
        {/* Botão de localizar */}
        <button
          type="button"
          className="audio-locate-button"
          onClick={onLocate}
          title="Ir para o áudio"
        >
          <i className="fas fa-volume-up"></i>
        </button>

        {/* Botão play/pause */}
        <button type="button" className="audio-play-button" onClick={togglePlayback}>
          <i
            className={`fas fa-${isPlaying ? 'pause' : 'play'}`}
            style={{ marginLeft: isPlaying ? 0 : 2 }}
          ></i>
        </button>

        {/* Tempo */}
        <div className="audio-time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Botão de velocidade */}
        <button
          type="button"
          className="audio-speed-button"
          onClick={cycleSpeed}
          title="Velocidade de reprodução"
        >
          {playbackRate}x
        </button>

        {/* Botão fechar */}
        <button
          type="button"
          className="audio-close-button"
          onClick={onClose}
          title="Fechar controle"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};
