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
    console.log('🎯 [Floating] handleProgressDrag iniciado');
    e.preventDefault();
    setIsDragging(true);

    // Armazenar referência para o elemento da barra de progresso
    const progressBarElement = e.currentTarget;
    console.log('🎯 [Floating] ProgressBar element:', progressBarElement);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      console.log('🎯 [Floating] Mouse move:', {
        isDragging,
        hasAudio: !!audioElement,
        hasDuration: !!duration,
        clientX: moveEvent.clientX,
        rectLeft: progressBarElement.getBoundingClientRect().left,
        rectWidth: progressBarElement.getBoundingClientRect().width,
      });

      if (!isDragging || !audioElement || !duration) {
        console.log('🎯 [Floating] Condições não atendidas, retornando');
        return;
      }

      try {
        const rect = progressBarElement.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
        const previewTime = percent * duration;

        console.log('🎯 [Floating] Calculando preview:', {
          percent: percent.toFixed(3),
          previewTime: previewTime.toFixed(2),
          duration: duration.toFixed(2),
        });

        // Atualizar visualmente em tempo real (sem modificar o áudio)
        setCurrentTime(previewTime);
        console.log('🎯 [Floating] Current time atualizado para:', previewTime.toFixed(2));
      } catch (error) {
        console.error('❌ [Floating] Erro no mouse move da barra de progresso flutuante:', error);
        setIsDragging(false);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      console.log('🎯 [Floating] Mouse up, finalizando drag');
      setIsDragging(false);

      try {
        if (audioElement && duration) {
          // Calcular a posição final baseada na posição do mouse
          const rect = progressBarElement.getBoundingClientRect();
          const percent = Math.max(0, Math.min(1, (upEvent.clientX - rect.left) / rect.width));
          const finalTime = percent * duration;

          console.log('🎯 [Floating] Posição final calculada:', {
            percent: percent.toFixed(3),
            finalTime: finalTime.toFixed(2),
            duration: duration.toFixed(2),
          });

          // AGORA sim alterar o áudio para a posição final
          if (isFinite(finalTime) && !isNaN(finalTime)) {
            console.log('🎯 [Floating] Definindo currentTime do áudio para:', finalTime.toFixed(2));
            audioElement.currentTime = finalTime;
            setCurrentTime(finalTime);
          }
        }
      } catch (error) {
        console.error('❌ [Floating] Erro no mouse up da barra de progresso flutuante:', error);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      console.log('🎯 [Floating] Event listeners removidos');
    };

    console.log('🎯 [Floating] Adicionando event listeners para mousemove e mouseup');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  console.log('🎯 [Floating] Progress percentage calculado:', {
    isDragging,
    currentTime: currentTime.toFixed(2),
    duration: duration.toFixed(2),
    progressPercentage: progressPercentage.toFixed(2),
  });

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
        <div
          className={`audio-progress-fill ${isDragging ? 'dragging' : ''}`}
          style={{
            width: `${progressPercentage}%`,
            transition: isDragging ? 'none' : 'width 0.1s linear',
          }}
        />
        <div
          className={`audio-progress-knob ${isDragging ? 'dragging' : ''}`}
          style={{ left: `${progressPercentage}%` }}
        />
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
