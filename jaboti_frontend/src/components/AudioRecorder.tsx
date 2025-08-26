import React, { useEffect } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import './AudioRecorder.css'

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob) => void
  onCancel: () => void
  isVisible: boolean
  onRecordingStateChange?: (isRecording: boolean, isPaused: boolean) => void
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onSendAudio,
  onCancel,
  isVisible,
  onRecordingStateChange
}) => {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    error,
    startRecording,
    pauseRecording,
    cancelRecording,
    reset,
    formatDuration
  } = useAudioRecorder()

  // Notificar mudanças no estado de gravação
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording, isPaused)
    }
  }, [isRecording, isPaused, onRecordingStateChange])

  // Limpeza automática quando o componente for desmontado
  useEffect(() => {
    return () => {
      console.log('🧹 AudioRecorder desmontado, limpando recursos')
      reset()
    }
  }, [reset])

  const handleStartRecording = async () => {
    await startRecording()
  }

  const handlePauseResume = () => {
    if (isPaused) {
      console.log('ℹ️ Gravação já finalizada')
      // Não fazer nada, apenas permitir envio
    } else {
      console.log('⏹️ Finalizando gravação')
      pauseRecording()
    }
  }

  const handleSend = () => {
    console.log('🎤 handleSend chamado com audioBlob:', audioBlob)
    if (audioBlob) {
      console.log('📤 Enviando áudio com tamanho:', audioBlob.size, 'bytes')
      onSendAudio(audioBlob)
      // Parar gravação antes de resetar
      if (isRecording || isPaused) {
        console.log('🛑 Parando gravação antes de enviar')
        // O reset já vai parar tudo
      }
      reset()
    } else {
      console.error('❌ audioBlob não está disponível para envio')
    }
  }

  const handleCancel = () => {
    console.log('❌ Cancelando gravação')
    cancelRecording()
    onCancel()
    // O reset já vai limpar tudo, não precisa chamar novamente
  }

  if (!isVisible) return null

  if (error) {
    return (
      <div className="audio-recorder-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle" />
          <div className="error-details">
            <span className="error-message">{error}</span>
            {error.includes('Permissão negada') && (
              <div className="error-help">
                <strong>Como resolver:</strong>
                <ol>
                  <li>Clique no ícone de microfone 🔒 na barra de endereços</li>
                  <li>Selecione "Permitir" para este site</li>
                  <li>Recarregue a página</li>
                </ol>
              </div>
            )}
            {error.includes('Nenhum microfone') && (
              <div className="error-help">
                <strong>Como resolver:</strong>
                <ol>
                  <li>Verifique se há um microfone conectado</li>
                  <li>Teste o microfone em outro aplicativo</li>
                  <li>Verifique as configurações de áudio do sistema</li>
                </ol>
              </div>
            )}
          </div>
        </div>
        <div className="error-actions">
          <button 
            type="button" 
            className="error-help-btn"
            onClick={() => {
              const helpText = `
🔧 SOLUÇÃO PARA PROBLEMAS DE MICROFONE:

1️⃣ PERMISSÕES DO NAVEGADOR:
   • Clique no ícone de microfone 🔒 na barra de endereços
   • Selecione "Permitir" para este site
   • Recarregue a página

2️⃣ VERIFICAR DISPOSITIVOS:
   • Teste o microfone em outro aplicativo
   • Verifique se não está sendo usado por outro app
   • Confirme se está conectado e funcionando

3️⃣ CONFIGURAÇÕES DO SISTEMA:
   • Verifique as configurações de áudio do Windows
   • Teste o microfone nas configurações do sistema
   • Verifique se não está mutado

4️⃣ NAVEGADOR:
   • Use Chrome, Firefox ou Edge (mais compatíveis)
   • Verifique se está atualizado
   • Tente em modo incógnito

5️⃣ LOCALHOST:
   • HTTPS é mais seguro para permissões
   • Tente acessar via IP local: http://192.168.100.46:3000
              `
              alert(helpText)
            }}
            title="Ver guia completo de solução"
          >
            <i className="fas fa-question-circle" />
            Guia de Solução
          </button>
          <button 
            type="button" 
            className="error-retry-btn"
            onClick={() => reset()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }


  
  if (isRecording || isPaused) {
    return (
      <div className={`audio-recorder-recording ${isPaused ? 'finalized' : ''}`}>
        <div className="recording-timer">
          <i className={`fas ${isPaused ? 'fa-check-circle' : 'fa-microphone'} recording-icon`} />
          <span className="timer-text">
            {isPaused ? `Áudio pronto para envio (${formatDuration(duration)})` : formatDuration(duration)}
          </span>
          {!isPaused && (
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span className="recording-text">Gravando...</span>
            </div>
          )}
        </div>
        
        {isPaused && audioBlob && (
          <div className="audio-preview">
            <div className="preview-header">
              <i className="fas fa-headphones" style={{ color: '#10b981', marginRight: '8px' }} />
              <span style={{ fontSize: '12px', color: '#065f46', fontWeight: '500' }}>
                Preview do áudio
              </span>
            </div>
            <audio 
              src={URL.createObjectURL(audioBlob)} 
              controls 
              preload="metadata"
            />
          </div>
        )}
        
        <div className="recording-controls">
          {isPaused ? (
            <>
              <button
                type="button"
                className="control-btn send-btn"
                onClick={handleSend}
                title="Enviar áudio"
              >
                <i className="fas fa-paper-plane" />
                <span className="btn-text">Enviar</span>
              </button>
              <button
                type="button"
                className="control-btn cancel-btn"
                onClick={handleCancel}
                title="Cancelar gravação"
              >
                <i className="fas fa-trash" />
                <span className="btn-text">Cancelar</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="control-btn stop-btn"
              onClick={handlePauseResume}
              title="Finalizar gravação"
            >
              <i className="fas fa-stop" />
              <span className="btn-text">Finalizar</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="audio-recorder-start"
      onClick={handleStartRecording}
      title="Gravar áudio"
    >
      <i className="fas fa-microphone" />
    </button>
  )
}
