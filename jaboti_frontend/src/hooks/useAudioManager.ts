import { useCallback, useRef } from 'react';

export const useAudioManager = () => {
  const currentPlayingAudioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((audio: HTMLAudioElement) => {
    // Se há outro áudio tocando, pausa ele
    if (currentPlayingAudioRef.current && currentPlayingAudioRef.current !== audio) {
      currentPlayingAudioRef.current.pause();
    }

    // Define este áudio como o atual
    currentPlayingAudioRef.current = audio;
  }, []);

  const pauseAudio = useCallback((audio: HTMLAudioElement) => {
    // Se este áudio é o que está tocando, limpa a referência
    if (currentPlayingAudioRef.current === audio) {
      currentPlayingAudioRef.current = null;
    }
  }, []);

  const stopAllAudios = useCallback((excludeAudio?: HTMLAudioElement) => {
    // Pausar o áudio atual registrado (se não for o que queremos excluir)
    if (currentPlayingAudioRef.current && currentPlayingAudioRef.current !== excludeAudio) {
      currentPlayingAudioRef.current.pause();
      currentPlayingAudioRef.current = null;
    }

    // Pausar todos os outros áudios da página (exceto o excluído)
    const allAudios = document.querySelectorAll('audio');
    allAudios.forEach((audio) => {
      if (!audio.paused && audio !== excludeAudio) {
        audio.pause();
      }
    });
  }, []);

  const registerAudio = useCallback((audio: HTMLAudioElement) => {
    // Registrar este áudio como o atual quando ele começar a tocar
    currentPlayingAudioRef.current = audio;
  }, []);

  return {
    playAudio,
    pauseAudio,
    stopAllAudios,
    registerAudio,
    currentPlayingAudio: currentPlayingAudioRef.current,
  };
};
