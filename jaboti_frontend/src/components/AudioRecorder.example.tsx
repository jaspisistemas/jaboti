import React, { useState } from 'react'
import { AudioRecorder } from './AudioRecorder'

// Exemplo de uso do componente AudioRecorder
export const AudioRecorderExample: React.FC = () => {
  const [showRecorder, setShowRecorder] = useState(true)

  const handleSendAudio = (audioBlob: Blob) => {
    console.log('Áudio recebido:', audioBlob)
    console.log('Tamanho:', audioBlob.size, 'bytes')
    console.log('Tipo:', audioBlob.type)
    
    // Aqui você pode enviar o áudio para o servidor
    // Por exemplo, usando FormData e fetch
    
    // Criar URL para preview
    const audioUrl = URL.createObjectURL(audioBlob)
    
    // Criar elemento de áudio para reproduzir
    const audio = new Audio(audioUrl)
    audio.controls = true
    
    // Adicionar ao DOM para teste
    const container = document.getElementById('audio-preview')
    if (container) {
      container.innerHTML = ''
      container.appendChild(audio)
    }
    
    // Limpar URL após uso
    setTimeout(() => URL.revokeObjectURL(audioUrl), 1000)
  }

  const handleCancel = () => {
    console.log('Gravação cancelada')
    setShowRecorder(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Exemplo do Gravador de Áudio</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowRecorder(!showRecorder)}
          style={{ padding: '10px 20px', fontSize: '16px' }}
        >
          {showRecorder ? 'Ocultar' : 'Mostrar'} Gravador
        </button>
      </div>

      <div style={{ 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>Interface do Chat</h3>
        
                 {/* Simular a área de composição do chat */}
         <div style={{ 
           display: 'flex', 
           alignItems: 'flex-end', 
           gap: '10px',
           padding: '15px',
           backgroundColor: 'white',
           borderRadius: '8px',
           border: '1px solid #e0e0e0'
         }}>
           {/* Botões de anexo (sempre visíveis) */}
           <div style={{ display: 'flex', gap: '8px' }}>
             <button style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
               📎
             </button>
             <button style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
               📷
             </button>
           </div>
           
           {/* Input de texto (sempre visível) */}
           <textarea
             placeholder="Digite uma mensagem..."
             style={{ 
               flex: 1, 
               padding: '10px', 
               borderRadius: '8px', 
               border: '1px solid #ccc',
               resize: 'none',
               minHeight: '40px'
             }}
             rows={1}
           />
           
           {/* Botão de enviar ou gravador de áudio */}
           {showRecorder ? (
             <AudioRecorder
               onSendAudio={handleSendAudio}
               onCancel={handleCancel}
               isVisible={true}
             />
           ) : (
             <button style={{ 
               padding: '10px 20px', 
               backgroundColor: '#007bff', 
               color: 'white', 
               border: 'none', 
               borderRadius: '8px',
               cursor: 'pointer'
             }}>
               Enviar
             </button>
           )}
         </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Preview do Áudio Gravado</h3>
        <div id="audio-preview" style={{ 
          padding: '20px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '8px',
          minHeight: '60px'
        }}>
          <p style={{ color: '#666', fontStyle: 'italic' }}>
            Grave um áudio para ver o preview aqui...
          </p>
        </div>
      </div>

             <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
         <h3>Como Funciona:</h3>
         <ul>
           <li>Por padrão, todos os elementos são exibidos simultaneamente: anexos, input de texto e gravador de áudio</li>
           <li>Quando você começa a digitar, o botão de enviar texto aparece no lugar do gravador</li>
           <li>Clique no microfone para começar a gravar</li>
           <li>Durante a gravação, todos os elementos permanecem visíveis</li>
           <li>Use o botão de pausa para pausar/continuar a gravação</li>
           <li>Quando pausado, você pode enviar ou cancelar o áudio</li>
           <li>O contador mostra a duração da gravação em tempo real</li>
         </ul>
       </div>
    </div>
  )
}
