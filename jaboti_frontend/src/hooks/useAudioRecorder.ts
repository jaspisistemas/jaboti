import { useState, useRef, useCallback } from 'react'

interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  error: string | null
}

export const useAudioRecorder = () => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    error: null
  })



  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const durationIntervalRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      // Verificar se a API está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de mídia não suportada neste navegador')
      }
      
      // Verificar se há dispositivos de áudio disponíveis
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(device => device.kind === 'audioinput')
      
      if (audioDevices.length === 0) {
        throw new Error('Nenhum dispositivo de áudio encontrado')
      }
      
      console.log('🎤 Dispositivos de áudio disponíveis:', audioDevices.map(d => d.label || d.deviceId))
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Tentar usar formato mais compatível para conversão
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType })
      streamRef.current = stream
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Configurar para gerar chunks a cada 1 segundo
      const chunkInterval = window.setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try {
            mediaRecorderRef.current.requestData()
          } catch (error) {
            // requestData pode não ser suportado em todos os navegadores
          }
        }
      }, 1000)
      
             mediaRecorderRef.current.onstop = () => {
         // Limpar o intervalo de chunks
         clearInterval(chunkInterval)
         
         // Usar formato mais compatível para conversão
         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
         console.log('🎵 Blob criado ao parar:', audioBlob.size, 'bytes')

         setState(prev => ({ ...prev, audioBlob, isRecording: false, isPaused: true }))
         
         // Parar o stream de áudio
         if (streamRef.current && streamRef.current.getTracks) {
           streamRef.current.getTracks().forEach(track => {
             track.stop()
             console.log('🔇 Track de áudio parada:', track.kind)
           })
           streamRef.current = null
         }
       }
      
      mediaRecorderRef.current.start()
      startTimeRef.current = Date.now()
      
      // Iniciar contador de duração
      durationIntervalRef.current = window.setInterval(() => {
        setState(prev => ({ ...prev, duration: Date.now() - startTimeRef.current }))
      }, 100)
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        duration: 0, 
        error: null 
      }))
      
    } catch (error: any) {
      console.error('❌ Erro ao acessar microfone:', error)
      
      let errorMessage = 'Erro ao acessar microfone. Verifique as permissões.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão negada. Clique no ícone de microfone na barra de endereços e permita o acesso.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhum microfone encontrado. Verifique se há um dispositivo de áudio conectado.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Seu navegador não suporta gravação de áudio. Tente usar Chrome, Firefox ou Edge.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microfone está sendo usado por outro aplicativo. Feche outros apps que usem áudio.'
      } else if (error.message && error.message.includes('API de mídia não suportada')) {
        errorMessage = 'Seu navegador não suporta gravação de áudio. Use Chrome, Firefox ou Edge.'
      } else if (error.message && error.message.includes('Nenhum dispositivo de áudio encontrado')) {
        errorMessage = 'Nenhum microfone detectado. Verifique se há um dispositivo de áudio conectado.'
      } else if (error.message) {
        errorMessage = `Erro: ${error.message}`
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }))
    }
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      // Parar a gravação - o onstop vai cuidar do resto
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Limpar o contador de duração
      if (durationIntervalRef.current) {
        window.clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      
      // Não definir estado aqui - deixar o onstop fazer isso
      console.log('⏹️ Finalizando gravação - aguardando onstop')
    }
  }, [state.isRecording])

  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isPaused) {
      // Como agora pausar para a gravação, não podemos retomar
      // Apenas permitir que o usuário envie o áudio gravado
      console.log('ℹ️ Gravação já finalizada, não é possível retomar')
      setState(prev => ({ ...prev, isPaused: false }))
    }
  }, [state.isPaused])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      
      if (durationIntervalRef.current) {
        window.clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      
      setState(prev => ({ ...prev, isRecording: false, isPaused: false }))
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Parar o MediaRecorder
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      // Limpar intervalos
      if (durationIntervalRef.current) {
        window.clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      
      // Parar o stream de áudio
      if (streamRef.current && streamRef.current.getTracks) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log('🔇 Track de áudio parada no cancel:', track.kind)
        })
        streamRef.current = null
      }
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false, 
        duration: 0, 
        audioBlob: null 
      }))
    }
  }, [])

  const reset = useCallback(() => {
    // Limpar intervalos
    if (durationIntervalRef.current) {
      window.clearInterval(durationIntervalRef.current)
      durationIntervalRef.current = null
    }
    
    // Parar e limpar MediaRecorder se existir
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop()
        } catch (error) {
          console.log('MediaRecorder já estava parado')
        }
      }
      
      // Parar o stream de áudio
      if (streamRef.current && streamRef.current.getTracks) {
        streamRef.current.getTracks().forEach(track => {
          track.stop()
          console.log('🔇 Track de áudio parada no reset:', track.kind)
        })
        streamRef.current = null
      }
      
      mediaRecorderRef.current = null
    }
    
    // Limpar chunks
    audioChunksRef.current = []
    
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      error: null
    })
  }, [])

  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  return {
    ...state,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    reset,
    formatDuration
  }
}
