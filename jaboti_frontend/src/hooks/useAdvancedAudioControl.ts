import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioControlState {
  currentAudio: HTMLAudioElement | null;
  currentContainer: HTMLElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  showFloatingControl: boolean;
}

export const useAdvancedAudioControl = () => {
  console.log('🔧 useAdvancedAudioControl hook inicializado');
  
  // Estado principal
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentContainer, setCurrentContainer] = useState<HTMLElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showFloatingControl, setShowFloatingControl] = useState(false);

  // Refs para controle
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const floatingControlRef = useRef<HTMLDivElement | null>(null);

  // Função para pausar todos os outros áudios
  const pauseAllOtherAudios = useCallback((currentAudio: HTMLAudioElement) => {
    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== currentAudio && !audio.paused) {
        audio.pause();
        // Atualizar UI dos outros áudios
        const container = audio.closest('.audio-message');
        if (container) {
          container.classList.remove('playing');
          const playBtn = container.querySelector('.audio-play-button');
          if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play" style="margin-left: 2px;"></i>';
          }
        }
      }
    });
  }, []);

  // Função para verificar visibilidade do controle flutuante
  const checkFloatingControlVisibility = useCallback(() => {
    if (!currentAudio || !currentContainer || !messagesContainerRef.current) {
      setShowFloatingControl(false);
      return;
    }

    const containerRect = messagesContainerRef.current.getBoundingClientRect();
    const audioRect = currentContainer.getBoundingClientRect();

    const isVisible = (
      audioRect.top >= containerRect.top &&
      audioRect.bottom <= containerRect.bottom
    );

    setShowFloatingControl(!isVisible);
  }, [currentAudio, currentContainer]);

  // Função para alternar reprodução
  const toggleAudioPlayback = useCallback((audioElement: HTMLAudioElement, container: HTMLElement) => {
    if (audioElement.paused) {
      // Pausar outros áudios antes de tocar este
      pauseAllOtherAudios(audioElement);
      
      // Configurar como áudio atual
      setCurrentAudio(audioElement);
      setCurrentContainer(container);
      setPlaybackRate(audioElement.playbackRate || 1);
      
      // Tocar o áudio
      audioElement.play();
      setIsPlaying(true);
      
      // Atualizar UI
      container.classList.add('playing');
      const playBtn = container.querySelector('.audio-play-button');
      if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
      }
      
      // Verificar se deve mostrar controle flutuante
      checkFloatingControlVisibility();
    } else {
      // Pausar o áudio
      audioElement.pause();
      setIsPlaying(false);
      
      // Atualizar UI
      container.classList.remove('playing');
      const playBtn = container.querySelector('.audio-play-button');
      if (playBtn) {
        playBtn.innerHTML = '<i class="fas fa-play" style="margin-left: 2px;"></i>';
      }
    }
  }, [pauseAllOtherAudios, checkFloatingControlVisibility]);

  // Função para alternar velocidade
  const cycleAudioSpeed = useCallback(() => {
    if (!currentAudio) return;
    
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    
    setPlaybackRate(newSpeed);
    currentAudio.playbackRate = newSpeed;
  }, [currentAudio, playbackRate]);

  // Função para localizar o áudio atual
  const locateCurrentAudio = useCallback(() => {
    if (!currentContainer || !messagesContainerRef.current) return;
    
    currentContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Destacar a mensagem
    currentContainer.classList.add('highlight-blink');
    setTimeout(() => {
      currentContainer.classList.remove('highlight-blink');
    }, 1500);
    
    // Esconder controle flutuante após um tempo
    setTimeout(() => {
      setShowFloatingControl(false);
    }, 1000);
  }, [currentContainer]);

  // Função para fechar controle flutuante
  const closeFloatingControl = useCallback(() => {
    if (currentAudio && !currentAudio.paused) {
      currentAudio.pause();
      setIsPlaying(false);
      
      // Atualizar UI
      if (currentContainer) {
        currentContainer.classList.remove('playing');
        const playBtn = currentContainer.querySelector('.audio-play-button');
        if (playBtn) {
          playBtn.innerHTML = '<i class="fas fa-play" style="margin-left: 2px;"></i>';
        }
      }
    }
    
    setCurrentAudio(null);
    setCurrentContainer(null);
    setShowFloatingControl(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentAudio, currentContainer]);

  // Função para definir tempo do áudio
  const seekAudio = useCallback((time: number) => {
    if (!currentAudio || !isFinite(time) || isNaN(time)) return;
    
    const newTime = Math.max(0, Math.min(time, duration));
    currentAudio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [currentAudio, duration]);

  // Função para definir container de mensagens
  const setMessagesContainer = useCallback((container: HTMLDivElement | null) => {
    messagesContainerRef.current = container;
  }, []);

  // Função para definir controle flutuante
  const setFloatingControl = useCallback((control: HTMLDivElement | null) => {
    floatingControlRef.current = control;
  }, []);

  // Atualizar progresso do áudio
  useEffect(() => {
    if (!currentAudio) return;

    const updateProgress = () => {
      setCurrentTime(currentAudio.currentTime);
      setDuration(currentAudio.duration || 0);
    };

    const onTimeUpdate = () => updateProgress();
    const onLoadedMetadata = () => updateProgress();
    const onEnded = () => {
      closeFloatingControl();
    };

    currentAudio.addEventListener('timeupdate', onTimeUpdate);
    currentAudio.addEventListener('loadedmetadata', onLoadedMetadata);
    currentAudio.addEventListener('ended', onEnded);

    return () => {
      currentAudio.removeEventListener('timeupdate', onTimeUpdate);
      currentAudio.removeEventListener('loadedmetadata', onLoadedMetadata);
      currentAudio.removeEventListener('ended', onEnded);
    };
  }, [currentAudio, closeFloatingControl]);

  // Verificar visibilidade do controle flutuante quando há scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      checkFloatingControlVisibility();
    };

    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [checkFloatingControlVisibility]);

  // Listener para tecla ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFloatingControl) {
        closeFloatingControl();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showFloatingControl, closeFloatingControl]);

  return {
    // Estado
    currentAudio,
    currentContainer,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    showFloatingControl,
    
    // Funções
    toggleAudioPlayback,
    cycleAudioSpeed,
    locateCurrentAudio,
    closeFloatingControl,
    seekAudio,
    setMessagesContainer,
    setFloatingControl,
    
    // Utilitários
    formatTime: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };
};
