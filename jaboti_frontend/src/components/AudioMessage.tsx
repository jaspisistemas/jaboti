import React, { useEffect, useRef, useState } from 'react';

interface AudioMessageProps {
  url: string;
  duration?: number;
  messageId: string;
}

export const AudioMessage: React.FC<AudioMessageProps> = ({ url, messageId }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const retryCountRef = useRef(0); // Usar useRef para manter contador persistente
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [previewTime, setPreviewTime] = useState(0); // Tempo de preview durante drag
  const maxRetries = 2; // Máximo de tentativas de recarregar

  // Listener para pausar outros áudios quando este começar a tocar
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) {
      console.error('❌ AudioMessage: audioElement é null no useEffect');
      return;
    }

    // Não configurar listeners se já há erro
    if (hasError) {
      return;
    }

    const handlePlay = () => {
      // Pausar todos os outros áudios ANTES de registrar este
      if (window.audioManager) {
        // IMPORTANTE: pausar outros áudios ANTES de registrar este
        // Passar o áudio atual para não pausá-lo
        window.audioManager.stopAllAudios(audioElement);
        // Registrar este áudio como o atual APÓS pausar os outros
        window.audioManager.registerAudio(audioElement);
      } else {
        console.warn('⚠️ window.audioManager não está disponível');
      }

      // Notificar o componente pai sobre o áudio ativo
      if (window.setCurrentAudioElement) {
        console.log('📢 Notificando componente pai sobre áudio ativo');
        window.setCurrentAudioElement(audioElement, messageId);
      } else {
        console.warn('⚠️ window.setCurrentAudioElement não está disponível');
      }

      setIsPlaying(true);
    };

    const handlePause = () => {
      // Notificar o componente pai sobre o áudio pausado
      if (window.setCurrentAudioElement) {
        window.setCurrentAudioElement(null, null);
      }
      setIsPlaying(false);
    };

    const handleEnded = () => {
      // Notificar o componente pai sobre o áudio finalizado
      if (window.setCurrentAudioElement) {
        window.setCurrentAudioElement(null, null);
      }
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleTimeUpdate = () => {
      // Só atualizar o tempo se não estiver arrastando
      // Durante o drag, o tempo é controlado pelo preview
      if (!isDragging) {
        setCurrentTime(audioElement.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    const handleError = (e: Event) => {
      console.error('❌ AudioMessage: Erro no áudio:', e);
      console.error('❌ Detalhes do erro:', audioElement.error);

      // Tratar erro de formato com limite de tentativas
      if (audioElement.error && audioElement.error.code === 4) {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          console.warn(
            `⚠️ Formato de áudio não suportado. Tentativa ${retryCountRef.current}/${maxRetries}. Tentando recarregar...`
          );
          // Tentar recarregar o áudio
          audioElement.load();
        } else {
          console.error('❌ Máximo de tentativas atingido. Áudio não pode ser carregado.');
          setHasError(true);
          // IMPORTANTE: Não tentar mais recarregar este áudio
          return;
        }
      } else {
        // Para outros tipos de erro, marcar como erro imediatamente
        setHasError(true);
      }
    };

    const handleCanPlay = () => {
      // Áudio pode ser reproduzido
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('canplay', handleCanPlay);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [isDragging, messageId, hasError]);

  // Resetar previewTime quando drag terminar
  useEffect(() => {
    if (!isDragging && previewTime > 0) {
      // Aguardar um frame para garantir que o currentTime foi atualizado
      requestAnimationFrame(() => {
        setPreviewTime(0);
      });
    }
  }, [isDragging, previewTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('❌ AudioMessage: audioRef.current é null');
      return;
    }

    // Não tentar reproduzir se houve erro
    if (hasError) {
      console.warn('⚠️ Não é possível reproduzir áudio com erro');
      return;
    }

    // Não tentar reproduzir se já atingiu o limite de tentativas
    if (retryCountRef.current >= maxRetries) {
      console.warn('⚠️ Máximo de tentativas atingido para este áudio');
      setHasError(true);
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // Verificar se o áudio está carregado
        if (audio.readyState < 2) {
          // HAVE_CURRENT_DATA
          await audio.load();
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Áudio iniciado com sucesso
              setHasError(false); // Resetar erro se conseguir reproduzir
              retryCountRef.current = 0; // Resetar contador de tentativas
            })
            .catch((error) => {
              console.error('❌ Erro ao iniciar áudio:', error);
              // Não tentar recarregar automaticamente aqui
              setHasError(true);
            });
        }
      }
    } catch (error) {
      console.error('❌ Erro em togglePlayback:', error);
      setHasError(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
      setPlaybackRate(newSpeed);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !audioRef.current || !duration) return;

    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * duration;

      if (isFinite(newTime) && !isNaN(newTime)) {
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        // Resetar preview time para sincronizar
        setPreviewTime(0);
      }
    } catch (error) {
      console.error('❌ Erro ao clicar na barra de progresso:', error);
    }
  };

  const handleProgressHover = () => {
    setIsHovering(true);
  };

  const handleProgressLeave = () => {
    if (!isDragging) {
      setIsHovering(false);
    }
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setIsHovering(true); // Manter knob visível durante o drag

    // Armazenar referência para o elemento da barra de progresso
    const progressBarElement = e.currentTarget;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging || !audioRef.current || !duration) return;

      try {
        const rect = progressBarElement.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
        const newPreviewTime = percent * duration;

        // Atualizar preview em tempo real (sem modificar o áudio)
        setPreviewTime(newPreviewTime);
      } catch (error) {
        console.error('❌ Erro no mouse move da barra de progresso:', error);
        setIsDragging(false);
        setIsHovering(false);
        setPreviewTime(0); // Resetar preview em caso de erro
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDragging(false);

      try {
        if (audioRef.current && duration) {
          // Usar o previewTime atual para sincronizar
          if (isFinite(previewTime) && !isNaN(previewTime)) {
            // AGORA sim alterar o áudio para a posição final
            audioRef.current.currentTime = previewTime;
            setCurrentTime(previewTime);
          }
        }
      } catch (error) {
        console.error('❌ Erro no mouse up da barra de progresso:', error);
      }

      // Verificar se ainda está no hover da barra
      if (!progressBarElement.matches(':hover')) {
        setIsHovering(false);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Usar previewTime durante drag, senão usar currentTime normal
  const progressPercentage =
    duration > 0
      ? Math.max(
          0,
          Math.min(
            100,
            ((isDragging && previewTime > 0 ? previewTime : currentTime) / duration) * 100
          )
        )
      : 0;

  return (
    <div className={`audio-message ${isPlaying ? 'playing' : ''} ${hasError ? 'error' : ''}`}>
      {/* Botão play/pause */}
      <button
        type="button"
        className="audio-play-button"
        onClick={togglePlayback}
        disabled={hasError}
        title={hasError ? 'Áudio com erro - clique para tentar novamente' : ''}
      >
        <i
          className={`fas fa-${hasError ? 'exclamation-triangle' : isPlaying ? 'pause' : 'play'}`}
        />
      </button>

      {/* Controles de áudio */}
      <div className="audio-controls-container">
        {/* Barra de progresso */}
        <div
          className="audio-progress-bar"
          onClick={handleProgressClick}
          onMouseDown={handleProgressDrag}
          onMouseEnter={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          <div
            className="audio-progress-fill"
            style={{
              width: `${progressPercentage}%`,
              transition: isDragging ? 'none' : 'width 0.1s ease',
            }}
          />
          <div
            className="audio-progress-knob"
            style={{
              left: `${progressPercentage}%`,
              opacity: isHovering || isDragging ? 1 : 0,
            }}
          />
        </div>

        {/* Tempo e velocidade */}
        <div className="audio-time-speed-container">
          <div className="audio-time-display">
            {hasError
              ? 'Erro no áudio'
              : `${formatTime(isDragging && previewTime > 0 ? previewTime : currentTime)} / ${formatTime(duration)}`}
          </div>
          {hasError ? (
            retryCountRef.current < maxRetries ? (
              <button
                type="button"
                className="audio-retry-button"
                onClick={() => {
                  setHasError(false);
                  retryCountRef.current = 0;
                  if (audioRef.current) {
                    audioRef.current.load();
                  }
                }}
                title="Tentar novamente"
              >
                🔄
              </button>
            ) : (
              <span className="audio-error-text" title="Máximo de tentativas atingido">
                ❌
              </span>
            )
          ) : (
            <button type="button" className="audio-speed-button" onClick={cycleSpeed}>
              {playbackRate}x
            </button>
          )}
        </div>
      </div>

      {/* Elemento de áudio oculto */}
      <audio ref={audioRef} src={url} preload="metadata" style={{ display: 'none' }} />
    </div>
  );
};
