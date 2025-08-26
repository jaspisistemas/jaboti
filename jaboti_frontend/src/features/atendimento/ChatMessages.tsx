import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../../redux/store'
import type { MessageItem, MessageAttachmentType } from '../../vite-env'
import { addMessage, setChatMessages, updateMessage, removeMessage } from './slices/messagesSlice'
import { atualizarStatus, transferirDepartamento, atualizarPreview, clearSelected } from './slices/chatsSlice'
import api from '../../api'
import { fetchDepartments } from '../../redux/slices/departmentsSlice'
import { useModalManager } from './hooks/useModalManager'
import { AudioRecorder } from '../../components/AudioRecorder'

const EMPTY_MESSAGES: MessageItem[] = []

// Interface para mídia no modal de preview
interface MediaPreviewItem {
  id: string
  file: File
  url: string
  type: 'image' | 'video' | 'document'
  message: string // Mensagem personalizada para cada mídia
}

// Componente do modal de preview de mídia - Otimizado com memo
const MediaPreviewModal = memo(function MediaPreviewModal({ 
  mediaItems, 
  isOpen, 
  onClose, 
  onSend, 
  onRemoveMedia,
  onAddMoreMedia,
  onUpdateMessage,
  onReorderMedia
}: {
  mediaItems: MediaPreviewItem[]
  isOpen: boolean
  onClose: () => void
  onSend: (mediaItems: MediaPreviewItem[]) => Promise<void>
  onRemoveMedia: (id: string) => void
  onAddMoreMedia: (files: FileList) => void
  onUpdateMessage: (id: string, message: string) => void
  onReorderMedia: (fromIndex: number, toIndex: number) => void
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [darkBackground, setDarkBackground] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const hasScrollRef = useRef(false)
  const isScrolledRef = useRef(false)
  const isAtEndRef = useRef(false)
  const mediaMessageInputRef = useRef<HTMLTextAreaElement>(null)

  // Reset quando o modal abre/fecha - Consolidado em um único useEffect
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      setIsSubmitting(false)
      setDraggedIndex(null)
      setDragOverIndex(null)
      
      // Foco automático no input de mensagem sem scroll da tela
      setTimeout(() => {
        mediaMessageInputRef.current?.focus({ preventScroll: true })
      }, 100)
    }
  }, [isOpen])

  // Ajustar seleção quando mídias mudam - Otimizado
  useEffect(() => {
    if (mediaItems.length === 0) return
    
    // Se a seleção atual é inválida, ajustar
    if (selectedIndex >= mediaItems.length) {
      setSelectedIndex(mediaItems.length - 1)
    }
    
    // Foco automático no input quando mídias são adicionadas
    if (isOpen && mediaItems.length > 0) {
      setTimeout(() => {
        mediaMessageInputRef.current?.focus({ preventScroll: true })
      }, 100)
    }
  }, [mediaItems.length, selectedIndex, isOpen])

  // Verificar scroll apenas quando necessário - Otimizado
  const checkScroll = useCallback(() => {
    const element = thumbnailsRef.current
    if (!element) return
    
    const hasHorizontalScroll = element.scrollWidth > element.clientWidth
    const isAtStart = element.scrollLeft <= 1
    const isAtEndPosition = Math.abs(element.scrollLeft + element.clientWidth - element.scrollWidth) <= 1
    
    // Atualizar refs em vez de estado para evitar re-renders
    hasScrollRef.current = hasHorizontalScroll
    isScrolledRef.current = !isAtStart
    isAtEndRef.current = isAtEndPosition
  }, [])

  // Scroll para o thumbnail ativo - Otimizado
  const scrollToActiveThumbnail = useCallback(() => {
    const container = thumbnailsRef.current
    if (!container || !mediaItems || selectedIndex < 0 || selectedIndex >= mediaItems.length) return
    
    const activeThumbnail = container.querySelector('.thumbnail-item.active') as HTMLElement
    
    if (activeThumbnail) {
      const containerRect = container.getBoundingClientRect()
      const thumbnailRect = activeThumbnail.getBoundingClientRect()
      
      // Calcular se o thumbnail está visível
      const isVisible = thumbnailRect.left >= containerRect.left && thumbnailRect.right <= containerRect.right
      
      if (!isVisible) {
        // Scroll para centralizar o thumbnail ativo
        const scrollLeft = activeThumbnail.offsetLeft - (container.clientWidth / 2) + (activeThumbnail.clientWidth / 2)
        
        // Usar scroll suave apenas se necessário
        if (Math.abs(container.scrollLeft - scrollLeft) > 10) {
          container.scrollTo({
            left: Math.max(0, scrollLeft),
            behavior: 'smooth'
          })
        }
      }
    }
  }, [mediaItems, selectedIndex])

  // Handlers otimizados
  const handleSend = useCallback(async () => {
    if (!mediaItems || mediaItems.length === 0 || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await onSend(mediaItems)
      onClose()
    } catch (error) {
      console.error('Erro ao enviar mídia:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [mediaItems, isSubmitting, onSend, onClose])

  // Verificar scroll quando mídias mudam - Otimizado
  useEffect(() => {
    if (isOpen && mediaItems && mediaItems.length > 0) {
      // Usar requestAnimationFrame para evitar verificações síncronas
      requestAnimationFrame(checkScroll)
    }
  }, [mediaItems, isOpen, checkScroll])

  // Proteção adicional: resetar selectedIndex quando mediaItems mudar
  useEffect(() => {
    if (mediaItems && mediaItems.length > 0) {
      // Garantir que selectedIndex seja válido
      if (selectedIndex < 0 || selectedIndex >= mediaItems.length) {
        setSelectedIndex(0)
      }
    } else {
      // Resetar quando não há mídias
      setSelectedIndex(0)
    }
  }, [mediaItems, selectedIndex])

  // Controle de teclas - Otimizado
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
      
      // Enter para enviar, Shift+Enter para nova linha
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        e.stopPropagation()
        handleSend()
      }
      
      // Alt + setas para navegar pelos thumbnails (evita conflito com Ctrl+Shift+setas)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          e.stopPropagation()
          // Não fazer loop: ficar no primeiro se já estiver no primeiro
          if (selectedIndex > 0) {
            const newIndex = selectedIndex - 1
            setSelectedIndex(newIndex)
            
            // Usar requestAnimationFrame para evitar scroll da tela
            requestAnimationFrame(() => {
              scrollToActiveThumbnail()
              // Foco sem scroll da tela
              mediaMessageInputRef.current?.focus({ preventScroll: true })
            })
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          e.stopPropagation()
          // Não fazer loop: ficar no último se já estiver no último
          if (mediaItems && selectedIndex < mediaItems.length - 1) {
            const newIndex = selectedIndex + 1
            setSelectedIndex(newIndex)
            
            // Usar requestAnimationFrame para evitar scroll da tela
            requestAnimationFrame(() => {
              scrollToActiveThumbnail()
              // Foco sem scroll da tela
              mediaMessageInputRef.current?.focus({ preventScroll: true })
            })
          }
        } else if (e.key === 'Delete') {
          e.preventDefault()
          e.stopPropagation()
          // Remover thumbnail selecionado
          if (mediaItems && mediaItems[selectedIndex]) {
            const currentId = mediaItems[selectedIndex].id
            if (currentId) {
              handleRemove(currentId)
              
              // Se não restar nenhuma mídia, fechar modal
              if (mediaItems.length <= 1) {
                onClose()
              }
            }
          }
        }
      }
      
      // Ctrl + Alt + setas para reordenar thumbnails
      if (e.ctrlKey && e.altKey && !e.shiftKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          e.stopPropagation()
          // Mover thumbnail para a esquerda (trocar com o anterior)
          if (selectedIndex > 0) {
            const fromIndex = selectedIndex
            const toIndex = selectedIndex - 1
            
            // Reordenar usando a função existente
            onReorderMedia(fromIndex, toIndex)
            
            // Ajustar índice selecionado para acompanhar o item movido
            setSelectedIndex(toIndex)
            
            // Scroll para o novo posicionamento
            setTimeout(() => {
              scrollToActiveThumbnail()
              mediaMessageInputRef.current?.focus({ preventScroll: true })
            }, 100)
          }
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          e.stopPropagation()
          // Mover thumbnail para a direita (trocar com o próximo)
          if (selectedIndex < mediaItems.length - 1) {
            const fromIndex = selectedIndex
            const toIndex = selectedIndex + 1
            
            // Reordenar usando a função existente
            onReorderMedia(fromIndex, toIndex)
            
            // Ajustar índice selecionado para acompanhar o item movido
            setSelectedIndex(toIndex)
            
            // Scroll para o novo posicionamento
            setTimeout(() => {
              scrollToActiveThumbnail()
              mediaMessageInputRef.current?.focus({ preventScroll: true })
            }, 100)
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, onClose, handleSend, selectedIndex, mediaItems.length, scrollToActiveThumbnail, onReorderMedia])

  // Handler para colar imagem - Otimizado
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!isOpen) return
    
    const items = e.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      // Verificar se é uma imagem
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        e.stopPropagation()
        
        const file = item.getAsFile()
        if (file) {
          console.log('Imagem colada:', file.name, file.type, file.size)
          
          // Criar FileList para usar onAddMoreMedia
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          const fileList = dataTransfer.files
          
          // Adicionar ao modal usando onAddMoreMedia
          onAddMoreMedia(fileList)
          
          // Selecionar o novo item
          if (mediaItems) {
            setSelectedIndex(mediaItems.length)
          }
          
          // Foco no input de mensagem
          setTimeout(() => {
            mediaMessageInputRef.current?.focus({ preventScroll: true })
          }, 100)
          
          break // Processar apenas a primeira imagem
        }
      }
    }
  }, [isOpen, onAddMoreMedia, mediaItems.length])

  // Adicionar event listener para colar quando modal abrir
  useEffect(() => {
    if (!isOpen) return
    
    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e)
    document.addEventListener('paste', handlePasteEvent)
    
    return () => {
      document.removeEventListener('paste', handlePasteEvent)
    }
  }, [isOpen, handlePaste])

  const handleRemove = useCallback((id: string) => {
    onRemoveMedia(id)
    
    // Ajustar índice selecionado se necessário
    if (mediaItems && mediaItems.length > 0 && selectedIndex >= mediaItems.length - 1) {
      setSelectedIndex(Math.max(0, mediaItems.length - 2))
    }
  }, [onRemoveMedia, selectedIndex, mediaItems])

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index)
    
    // Foco automático no input de mensagem quando troca thumbnail
    setTimeout(() => {
      mediaMessageInputRef.current?.focus()
    }, 50)
  }, [])

  const handleReorderMedia = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    
    onReorderMedia(fromIndex, toIndex)
    
    // Ajustar índice selecionado
    if (mediaItems && selectedIndex === fromIndex) {
      setSelectedIndex(toIndex)
    } else if (mediaItems && selectedIndex > fromIndex && selectedIndex <= toIndex) {
      setSelectedIndex(selectedIndex - 1)
    } else if (mediaItems && selectedIndex < fromIndex && selectedIndex >= toIndex) {
      setSelectedIndex(selectedIndex + 1)
    }
  }, [selectedIndex, onReorderMedia, mediaItems])

  // Handlers para drag & drop otimizados
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', '')
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      handleReorderMedia(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, handleReorderMedia])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  if (!isOpen || !mediaItems || mediaItems.length === 0) {
    return null
  }

  // Proteção adicional para evitar erro quando mediaItems está vazio
  if (selectedIndex < 0 || selectedIndex >= mediaItems.length) {
    console.warn('MediaPreviewModal: selectedIndex inválido, resetando para 0')
    setSelectedIndex(0)
    return null
  }

  const currentMedia = mediaItems[selectedIndex]
  
  // Proteção final para garantir que currentMedia existe
  if (!currentMedia || !currentMedia.type) {
    console.warn('MediaPreviewModal: currentMedia inválido, fechando modal')
    onClose()
    return null
  }

  return (
    <div className="media-preview-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="media-preview-container">
        {/* Header */}
        <div className="media-preview-header">
                    <h3 className="media-preview-title">
            Enviar mídia
          </h3>
          <button 
            className="media-preview-close"
            onClick={onClose}
            type="button"
            title="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="media-preview-body">
          {/* Controles da mídia */}
          <div className="media-controls">
            <button
              type="button"
              className={`media-control-btn ${darkBackground ? 'active' : ''}`}
              onClick={() => setDarkBackground(!darkBackground)}
              title="Alternar fundo"
            >
              <i className={`fas ${darkBackground ? 'fa-sun' : 'fa-moon'}`}></i>
              {darkBackground ? 'Fundo Claro' : 'Fundo Escuro'}
            </button>
          </div>

          {/* Mídia principal */}
          {currentMedia.type === 'document' ? (
            <div className={`main-document-container ${darkBackground ? 'dark-bg' : 'light-bg'}`}>
              <div className="document-icon">
                <i className="fas fa-file"></i>
              </div>
              <div className="document-filename">
                {currentMedia.file.name}
              </div>
            </div>
          ) : (
            <div className={`main-media-container ${darkBackground ? 'dark-bg' : 'light-bg'}`}>
              {currentMedia.type === 'video' ? (
                <video 
                  className="main-media"
                  src={currentMedia.url} 
                  controls 
                  preload="metadata"
                />
              ) : (
                <img 
                  className="main-media"
                  src={currentMedia.url} 
                  alt="Preview"
                />
              )}
            </div>
          )}

          {/* Campo de mensagem para a mídia selecionada */}
          <div className="message-input-container">
            <label className="message-input-label" htmlFor="media-message">
              {currentMedia.type === 'document' ? 'Legenda para este arquivo (opcional)' : 'Mensagem para este arquivo (opcional)'}
              <span className="input-hint">
                Enter para enviar • Shift+Enter para nova linha • Alt+←/→ para navegar • Alt+Del para remover • Ctrl+V para colar imagem • Ctrl+Alt+←/→ para reordenar
              </span>
            </label>
            <textarea
              ref={mediaMessageInputRef}
              id="media-message"
              className="message-input"
              placeholder={currentMedia.type === 'document' ? 'Digite uma legenda para este arquivo...' : 'Digite uma mensagem para este arquivo...'}
              value={currentMedia.message}
              onChange={(e) => onUpdateMessage(currentMedia.id, e.target.value)}
              onKeyDown={(e) => {
                // Enter para enviar, Shift+Enter para nova linha
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Linha dos thumbnails + botão enviar */}
          <div className="thumbnails-send-row">
            <div className="media-thumbnails-container">
              <div 
                ref={thumbnailsRef}
                className={`media-thumbnails ${hasScrollRef.current ? 'has-scroll' : ''} ${isScrolledRef.current ? 'scrolled' : ''} ${isAtEndRef.current ? 'at-end' : ''}`}
                onScroll={checkScroll}
              >
                {mediaItems.map((item, index) => (
                  <div 
                    key={item.id}
                    className={`thumbnail-item ${index === selectedIndex ? 'active' : ''} ${
                      draggedIndex === index ? 'dragging' : ''
                    } ${dragOverIndex === index ? 'drag-over' : ''}`}
                    onClick={() => handleThumbnailClick(index)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    title="Clique para selecionar ou arraste para reordenar"
                  >
                    {item.type === 'document' ? (
                      <div className="thumbnail-document">
                        <i className="fas fa-file"></i>
                        <div className="filename">{item.file.name}</div>
                      </div>
                    ) : item.type === 'video' ? (
                      <video 
                        className="thumbnail-media" 
                        src={item.url}
                        preload="metadata"
                      />
                    ) : (
                      <img 
                        className="thumbnail-media" 
                        src={item.url} 
                        alt="Thumbnail"
                      />
                    )}
                    <button
                      className="thumbnail-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(item.id)
                      }}
                      title="Remover"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Botão "Adicionar mídia" sempre visível fora do scroll */}
              <div 
                className="media-add-thumbnail"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                  input.multiple = true
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files && files.length > 0) {
                      onAddMoreMedia(files)
                    }
                  }
                  input.click()
                }}
                title="Adicionar mais mídia"
              >
                <i className="fas fa-plus" style={{ fontSize: '16px', color: 'inherit' }}></i>
                <span style={{ fontSize: '8px', marginTop: '2px' }}>+</span>
              </div>
            </div>

            {/* Botão enviar fixo na linha */}
            <div className="send-button-fixed">
              <button 
                className="preview-btn preview-btn-send"
                onClick={handleSend}
                disabled={mediaItems.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// Componente para mensagem de texto - Otimizado com memo
const TextMessage = memo(function TextMessage({ message, isOwn }: { message: MessageItem; isOwn: boolean }) {
  return (
    <div className={`message ${isOwn ? 'sent' : 'received'}`}>
      <div className="message-content">
        <div className="message-bubble">
          <div className="content">{message.content}</div>
        </div>
        <div className="message-time">
          {message.timestamp}
          <i className="fas fa-check"></i>
        </div>
      </div>
    </div>
  )
})

// Função para determinar o ícone correto baseado no tipo do arquivo
const getFileIcon = (filename: string, attachmentType?: MessageAttachmentType): { icon: string; type: string } => {
  const extension = filename.toLowerCase().split('.').pop() || ''
  
  // Imagens
  if (attachmentType === 'IMAGE' || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return { icon: 'fas fa-file-image', type: 'Imagem' }
  }
  
  // Vídeos
  if (attachmentType === 'VIDEO' || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return { icon: 'fas fa-file-video', type: 'Vídeo' }
  }
  
  // PDFs
  if (extension === 'pdf') {
    return { icon: 'fas fa-file-pdf', type: 'PDF' }
  }
  
  // Documentos do Word
  if (['doc', 'docx'].includes(extension)) {
    return { icon: 'fas fa-file-word', type: 'Word' }
  }
  
  // Planilhas do Excel
  if (['xls', 'xlsx'].includes(extension)) {
    return { icon: 'fas fa-file-excel', type: 'Excel' }
  }
  
  // Apresentações do PowerPoint
  if (['ppt', 'pptx'].includes(extension)) {
    return { icon: 'fas fa-file-powerpoint', type: 'PowerPoint' }
  }
  
  // Arquivos de texto
  if (['txt', 'rtf', 'md'].includes(extension)) {
    return { icon: 'fas fa-file-alt', type: 'Texto' }
  }
  
  // Arquivos compactados
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { icon: 'fas fa-file-archive', type: 'Compactado' }
  }
  
  // Padrão para outros tipos
  return { icon: 'fas fa-file', type: 'Arquivo' }
}

// Componente para mensagem com documento - Otimizado com memo
const DocumentMessage = memo(function DocumentMessage({ message, isOwn }: { message: MessageItem; isOwn: boolean }) {
  const attachment = message.attachment!
  const { icon, type } = getFileIcon(attachment.name || 'arquivo', attachment.type)
  
  return (
    <div className={`message ${isOwn ? 'sent' : 'received'}`}>
      <div className="message-content">
        <div className="message-bubble">
          <div className="document-attachment">
            <div className="document-info">
              <i className={icon}></i>
              <div className="document-details">
                <div className="document-name">{attachment.name || 'Documento'}</div>
                <div className="document-meta">
                  {attachment.size && `${attachment.size} • `}{type}
                </div>
              </div>
            </div>
            <a 
              href={attachment.url} 
              target="_blank" 
              rel="noreferrer"
              className="download-btn"
              title="Baixar arquivo"
            >
              <i className="fas fa-download"></i>
            </a>
          </div>
          {message.content && 
           message.content.trim() !== '' && 
           !['Imagem', 'Vídeo', 'Documento'].includes(message.content.trim()) && (
            <div className="content">{message.content}</div>
          )}
        </div>
        <div className="message-time">
          {message.timestamp}
          <i className="fas fa-check"></i>
        </div>
      </div>
    </div>
  )
})

// Componente para mensagem com imagem/vídeo/áudio - Otimizado com memo
const MediaMessage = memo(function MediaMessage({ message, isOwn }: { message: MessageItem; isOwn: boolean }) {
  const attachment = message.attachment!
  const isVideo = attachment.type === 'VIDEO'
  const isAudio = attachment.type === 'AUDIO'
  
  return (
    <div className={`message ${isOwn ? 'sent' : 'received'}`}>
      <div className="message-content">
        <div className="message-bubble">
          {/* Primeiro renderiza a mídia */}
          {isVideo ? (
            <div className="video-attachment">
              <video 
                src={attachment.url} 
                controls
                preload="metadata"
              />
            </div>
          ) : isAudio ? (
                                    <div className="audio-attachment">
                          <audio 
                            src={attachment.url} 
                            controls
                            preload="metadata"
                          />
                        </div>
          ) : (
            <div className="image-attachment">
              <img 
                src={attachment.url} 
                alt={attachment.name || 'Imagem'} 
              />
            </div>
          )}
          
          {/* Depois renderiza o texto, apenas se existir e não for um valor padrão inválido */}
          {message.content && 
           message.content.trim() !== '' && 
           !['Imagem', 'Vídeo', 'Documento', 'Áudio'].includes(message.content.trim()) && (
            <div className="content">{message.content}</div>
          )}
        </div>
        <div className="message-time">
          {message.timestamp}
          <i className="fas fa-check"></i>
        </div>
      </div>
    </div>
  )
})

export function ChatMessages() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useDispatch<AppDispatch>()
  const selectedId = useSelector((s: RootState) => s.chats?.selectedId)
  const messagesFromStore = useSelector((s: RootState) => s.messages?.byChatId[selectedId || ''])
  const messages = messagesFromStore ?? EMPTY_MESSAGES
  const chat = useSelector((s: RootState) => s.chats?.items.find((c) => c.id === selectedId))
  
  // Debug: Log quando selectedId muda
  useEffect(() => {
    console.log('🔍 selectedId mudou para:', selectedId)
  }, [selectedId])

  const grouped = useMemo(() => messages, [messages])
  const [pending, setPending] = useState(0)

  const [composer, setComposer] = useState('')
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const mediaInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)
  const [attachOpen, setAttachOpen] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  
  // Fechar popup de anexos quando clicar fora
  useEffect(() => {
    if (!attachOpen) return
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.attach-menu')) {
        setAttachOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [attachOpen])



  // Estado do modal de preview de mídia
  const [mediaPreviewOpen, setMediaPreviewOpen] = useState(false)
  const [mediaPreviewItems, setMediaPreviewItems] = useState<MediaPreviewItem[]>([])

  // Encerrar atendimento modal state
  const [closeOpen, setCloseOpen] = useState(false)
  const [closeWithMessage, setCloseWithMessage] = useState<'nenhuma' | 'porAtendente' | 'porInatividade'>('nenhuma')
  const [closeError, setCloseError] = useState<string | null>(null)

  // Transferência modal state
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferGiveMessage, setTransferGiveMessage] = useState(false)
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>('')
  const [targetAttendantId, setTargetAttendantId] = useState<string>('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const departments = useSelector((s: RootState) => s.departments?.list || [])
  const [attendants, setAttendants] = useState<{ id: string; name: string }[]>([])
  const authUser = useSelector((s: RootState) => s.auth?.user)

  // Verificar se o usuário pode interagir com este atendimento
  const canInteract = useMemo(() => {
    if (!chat || !authUser) return false
    
    // Normalizar status para minúsculo para comparação
    const status = chat.status?.toLowerCase()
    
    // Se o chat está pendente, NÃO pode interagir (só pode iniciar)
    if (status === 'pendente') return false
    
    // Se o chat está ativo, apenas o atendente responsável pode interagir
    if (status === 'ativo') {
      return chat.atendenteId === String(authUser.id)
    }
    
    // Se o chat está finalizado, ninguém pode interagir
    if (status === 'finalizado') return false
    
    // Para outros status (bot, etc), permite interação
    return true
  }, [chat, authUser])

  // Verificar se pode iniciar o atendimento
  const canStart = useMemo(() => {
    if (!chat || !authUser) return false
    return chat.status?.toLowerCase() === 'pendente'
  }, [chat, authUser])

  // Verificar se pode encerrar o atendimento (incluindo pendentes)
  const canClose = useMemo(() => {
    if (!chat || !authUser) return false
    const status = chat.status?.toLowerCase()
    
    // Não pode encerrar se já estiver finalizado
    if (status === 'finalizado') return false
    
    // Pode encerrar se for pendente
    if (status === 'pendente') return true
    
    // Pode encerrar se for ativo e for o atendente responsável
    if (status === 'ativo') {
      return chat.atendenteId === String(authUser.id)
    }
    
    // Para outros status (bot, etc), permite encerrar
    return true
  }, [chat, authUser])

  // Registrar modais no gerenciador para prioridade ESC
  useModalManager('media-preview', mediaPreviewOpen, () => setMediaPreviewOpen(false))
  useModalManager('close-atendimento', closeOpen, () => setCloseOpen(false))
  useModalManager('transfer-atendimento', transferOpen, () => setTransferOpen(false))

  const draftKey = (id: string) => `chatDraft:${id}`
  const loadDraft = (id: string) => {
    try { return sessionStorage.getItem(draftKey(id)) || '' } catch { return '' }
  }
  const saveDraft = (id: string, text: string) => {
    try { if (text) sessionStorage.setItem(draftKey(id), text); else sessionStorage.removeItem(draftKey(id)) } catch {}
  }
  const clearDraft = (id: string) => { try { sessionStorage.removeItem(draftKey(id)) } catch {} }

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    setPending(0)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let b = bytes
    while (b >= 1024 && i < units.length - 1) { b /= 1024; i++ }
    return `${b.toFixed(b >= 100 ? 0 : 1)} ${units[i]}`
  }

  // Funções para gerenciar o modal de preview de mídia
  const handleMediaFiles = useCallback((files: FileList) => {
    console.log('handleMediaFiles chamado com', files.length, 'arquivos selecionados')
    if (!files || files.length === 0) return

    const newItems: MediaPreviewItem[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isDocument = !isImage && !isVideo
      
      if (isImage || isVideo || isDocument) {
        newItems.push({
          id: `media-${Date.now()}-${i}`,
          file,
          url: isDocument ? '' : URL.createObjectURL(file),
          type: isImage ? 'image' : isVideo ? 'video' : 'document',
          message: '' // Mensagem vazia para mídias
        })
      }
    }

    if (newItems.length > 0) {
      console.log('Abrindo modal com', newItems.length, 'arquivos selecionados')
      setMediaPreviewItems(newItems)
      setMediaPreviewOpen(true)
    }
  }, [])

  // Função específica para documentos - SEMPRE trata como documento
  const handleDocumentFiles = useCallback((files: FileList) => {
    console.log('handleDocumentFiles chamado com', files.length, 'arquivos como documentos')
    if (!files || files.length === 0) return

    const newItems: MediaPreviewItem[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // SEMPRE tratar como documento, independente do tipo do arquivo
      newItems.push({
        id: `doc-${Date.now()}-${i}`,
        file,
        url: '', // Documentos não têm preview de URL
        type: 'document',
        message: '' // Mensagem vazia para documentos
      })
    }

    if (newItems.length > 0) {
      console.log('Abrindo modal com', newItems.length, 'documentos')
      setMediaPreviewItems(newItems)
      setMediaPreviewOpen(true)
    }
  }, [])

  const handleRemoveMediaItem = useCallback((id: string) => {
    setMediaPreviewItems(prev => {
      const updated = prev.filter(item => item.id !== id)
      
      // Limpar URL do objeto removido
      const removed = prev.find(item => item.id === id)
      if (removed) {
        URL.revokeObjectURL(removed.url)
      }
      
      // Se não há mais itens, fechar modal
      if (updated.length === 0) {
        setMediaPreviewOpen(false)
      }
      
      return updated
    })
  }, [])

  const handleSendMediaItems = useCallback(async (mediaItems: MediaPreviewItem[]) => {
    if (!selectedId || mediaItems.length === 0) return

    // Verificar se o usuário pode interagir
    if (!canInteract) {
      alert('Você não tem permissão para enviar anexos neste atendimento.')
      return
    }

    const now = new Date()
    const pad = (n: number) => `${n}`.padStart(2, '0')
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`

    try {
      // Enviar cada mídia
      for (const item of mediaItems) {
        // O tipo é baseado na intenção do usuário, não no MIME type
        let type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
        if (item.type === 'image') type = 'IMAGE'
        else if (item.type === 'video') type = 'VIDEO'
        else type = 'DOCUMENT'
        
        console.log('🔍 DEBUG - Item type:', item.type, '-> Mapped type:', type)
        console.log('🔍 DEBUG - Item completo:', item)

        // Criar ID único para esta mensagem
        const tempId = `temp-att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Criar mensagem temporária
        const tempMessage: MessageItem = {
          id: tempId,
          type: 'message',
          senderIsMe: true,
          attachment: { 
            type, 
            url: item.url || URL.createObjectURL(item.file), // Para documentos, criar URL temporária
            name: item.file.name, 
            size: formatBytes(item.file.size) 
          },
          timestamp: hora,
          content: item.message || undefined // Usar a mensagem personalizada de cada mídia
        }

        // Adicionar mensagem local
        console.log('ChatMessages: Adicionando mensagem temporária:', tempMessage)
        dispatch(addMessage({ chatId: selectedId, message: tempMessage }))

        // Upload do arquivo
        const formData = new FormData()
        formData.append('file', item.file)

        const uploadResponse = await fetch(`http://192.168.100.46:3523/uploads/chat`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          }
        })

        if (!uploadResponse.ok) {
          throw new Error(`Upload falhou: ${uploadResponse.status}`)
        }

        const uploadResult = await uploadResponse.json()
        console.log('Resultado do upload:', uploadResult)

        // Verificar estrutura da resposta do upload
        if (!uploadResult.file || !uploadResult.file.url || !uploadResult.file.filename) {
          console.error('Estrutura inválida da resposta do upload:', uploadResult)
          throw new Error('Resposta do upload inválida')
        }
        
        // Enviar para API
        console.log('Enviando para API:', {
          atendimentoId: Number(selectedId),
          content: item.message && item.message.trim() !== '' ? item.message.trim() : null, // NULL se vazio
          senderType: 'ATTENDANT',
          mediaType: type, // Usar o tipo baseado na intenção (IMAGE, VIDEO, DOCUMENT)
          mediaUrl: uploadResult.file.url,
          mediaFilename: uploadResult.file.filename
        })
        
        const response = await api.post('/atendimentos/message', {
          atendimentoId: Number(selectedId),
          content: item.message && item.message.trim() !== '' ? item.message.trim() : null, // NULL se vazio
          senderType: 'ATTENDANT',
          mediaType: type, // Usar o tipo baseado na intenção (IMAGE, VIDEO, DOCUMENT)
          mediaUrl: uploadResult.file.url,
          mediaFilename: uploadResult.file.filename
        })

        console.log('Resposta da API para mensagem:', response)
        console.log('Resposta da API para mensagem (data):', response.data)

        // Verificar se a resposta tem o ID necessário
        if (!response.data || !response.data.id) {
          console.error('Resposta da API inválida - sem ID:', response.data)
          console.error('Estrutura completa da resposta:', response)
          throw new Error('Resposta da API inválida - sem ID da mensagem')
        }

        // Atualizar com dados reais
        const realMessage: MessageItem = {
          ...tempMessage,
          id: String(response.data.id),
          content: item.message || undefined,
          attachment: {
            ...tempMessage.attachment!,
            url: uploadResult.file.url
          }
        }

        console.log('Mensagem real criada:', realMessage)
        console.log('Atualizando mensagem temporária:', tempId, 'para real:', realMessage.id)

        dispatch(updateMessage({ 
          chatId: selectedId, 
          messageId: tempId, // Usar o ID temporário correto
          updatedMessage: realMessage
        }))
        
        console.log('Mensagem atualizada no Redux com sucesso')
        
        // Campo ultimaMensagem agora é atualizado automaticamente pelo backend
      }

      // Atualizar preview no chat - o backend já cuida da ultimaMensagem
      dispatch(atualizarPreview({ 
        chatId: selectedId, 
        ultimaMensagem: 'Enviando...', 
        horario: hora 
      }))

      // Limpar estado do modal
      mediaItems.forEach(item => URL.revokeObjectURL(item.url))
      setMediaPreviewItems([])
      setMediaPreviewOpen(false)

      // Scroll e foco
      setTimeout(() => {
        scrollToBottom()
        composerRef.current?.focus()
      }, 100)

    } catch (error: any) {
      console.error('Erro ao enviar mídias:', error)
      alert(`Erro ao enviar mídias: ${error.message || 'Tente novamente.'}`)
      
      // Remover mensagens temporárias em caso de erro
      mediaPreviewItems.forEach(() => {
        const tempId = `temp-att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        dispatch(removeMessage({ chatId: selectedId, messageId: tempId }))
      })
    }
  }, [selectedId, mediaPreviewItems, canInteract, dispatch, scrollToBottom, formatBytes])

  // Função para enviar mensagens de áudio
  const handleSendAudioMessage = useCallback(async (audioBlob: Blob) => {
    console.log('🎤 handleSendAudioMessage chamado com:', {
      selectedId,
      canInteract,
      audioBlobSize: audioBlob.size,
      audioBlobType: audioBlob.type
    })
    
    if (!selectedId) {
      console.error('❌ selectedId não definido')
      return
    }
    
    // Verificar se o usuário pode interagir
    if (!canInteract) {
      console.error('❌ Usuário não pode interagir')
      alert('Você não tem permissão para enviar mensagens neste atendimento.')
      return
    }
    
    const now = new Date()
    const pad = (n: number) => `${n}`.padStart(2, '0')
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    
    // Criar ID único para esta mensagem
    const tempId = `temp-audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('🆔 ID temporário criado:', tempId)
    
    // Criar mensagem local temporária
    const tempMessage: MessageItem = { 
      id: tempId, 
      type: 'message', 
      senderIsMe: true, 
      attachment: { 
        type: 'AUDIO', 
        url: URL.createObjectURL(audioBlob), 
        name: 'Áudio gravado', 
        size: formatBytes(audioBlob.size) 
      },
      timestamp: hora 
    }
    
    console.log('📝 Mensagem temporária criada:', tempMessage)
    
    // Adicionar mensagem localmente primeiro
    dispatch(addMessage({ chatId: selectedId, message: tempMessage }))
    dispatch(atualizarPreview({ chatId: selectedId, ultimaMensagem: 'Áudio gravado', horario: hora }))
    
    requestAnimationFrame(() => scrollToBottom())
    
    try {
      // Enviar áudio WebM para conversão no backend
      console.log('🎵 Enviando áudio WebM para conversão no backend')
      
      // Upload do arquivo de áudio WebM
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.webm')
      console.log('📤 FormData criado com arquivo:', audioBlob.type, audioBlob.size, 'bytes')

      const accessToken = localStorage.getItem('accessToken')
      console.log('🔑 Token de acesso:', accessToken ? 'Presente' : 'Ausente')
      console.log('🌐 URL da API:', api.defaults.baseURL)
      console.log('📏 Tamanho do áudio (WebM):', audioBlob.size, 'bytes')

      console.log('🚀 Iniciando upload para:', `${api.defaults.baseURL}/uploads/chat`)
      const uploadResponse = await fetch(`${api.defaults.baseURL}/uploads/chat`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })

      console.log('Status da resposta do upload:', uploadResponse.status)
      console.log('Headers da resposta:', Object.fromEntries(uploadResponse.headers.entries()))
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Erro no upload:', errorText)
        throw new Error(`Upload falhou: ${uploadResponse.status} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('Resultado do upload do áudio:', uploadResult)

      // Verificar estrutura da resposta do upload
      if (!uploadResult.file || !uploadResult.file.url || !uploadResult.file.filename) {
        console.error('Estrutura inválida da resposta do upload:', uploadResult)
        throw new Error('Resposta do upload inválida')
      }
      
      // Preparar dados para a API
      const messageData = {
        atendimentoId: Number(selectedId),
        content: null, // Mensagens de áudio não têm texto
        senderType: 'ATTENDANT',
        mediaType: 'AUDIO',
        mediaUrl: uploadResult.file.url,
        mediaFilename: uploadResult.file.filename
      }
      
      console.log('Dados sendo enviados para a API:', messageData)
      console.log('Tipo do atendimentoId:', typeof messageData.atendimentoId)
      console.log('URL da mídia:', messageData.mediaUrl)
      
      // Enviar para API
      console.log('📨 Enviando mensagem para API:', messageData)
      const response = await api.post('/atendimentos/message', messageData)
      console.log('✅ Resposta da API:', response.data)
      
      // Atualizar a mensagem com o ID real da API
      const realMessage: MessageItem = {
        ...tempMessage,
        id: String(response.data.id),
        attachment: {
          ...tempMessage.attachment!,
          url: uploadResult.file.url
        }
      }
      
      console.log('🔄 Atualizando mensagem temporária com ID real:', realMessage.id)
      
      // Substituir a mensagem temporária pela real
      dispatch(updateMessage({ 
        chatId: selectedId, 
        messageId: tempId,
        updatedMessage: realMessage
      }))
      
      // Limpar URL temporária
      URL.revokeObjectURL(tempMessage.attachment!.url)
      console.log('🎉 Áudio enviado com sucesso!')
      
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error)
      // Remover mensagem temporária em caso de erro
      dispatch(removeMessage({ 
        chatId: selectedId, 
        messageId: tempId
      }))
      // Mostrar erro para o usuário
      alert('Erro ao enviar áudio. Tente novamente.')
    }
  }, [selectedId, dispatch, canInteract, scrollToBottom, formatBytes])

  const handleCloseMediaPreview = useCallback(() => {
    // Limpar URLs dos objetos
    mediaPreviewItems.forEach(item => URL.revokeObjectURL(item.url))
    setMediaPreviewItems([])
    setMediaPreviewOpen(false)
  }, [mediaPreviewItems])

  const handleAddMoreMedia = useCallback((files: FileList) => {
    console.log('handleAddMoreMedia chamado com', files.length, 'arquivos')
    if (!files || files.length === 0) return

    const newItems: MediaPreviewItem[] = []
    const currentLength = mediaPreviewItems.length
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isDocument = !isImage && !isVideo
      
      if (isImage || isVideo || isDocument) {
        newItems.push({
          id: `media-${Date.now()}-${currentLength + i}`,
          file,
          url: isDocument ? '' : URL.createObjectURL(file),
          type: isImage ? 'image' : isVideo ? 'video' : 'document',
          message: '' // Mensagem vazia para mídias
        })
      }
    }

    if (newItems.length > 0) {
      console.log('Adicionando', newItems.length, 'novos arquivos')
      setMediaPreviewItems(prev => {
        const updated = [...prev, ...newItems]
        // Retornar um objeto especial para sinalizar que deve selecionar a nova mídia
        return updated
      })
    }
  }, [mediaPreviewItems])

  const handleUpdateMessage = useCallback((id: string, message: string) => {
    setMediaPreviewItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, message } : item
      )
    )
  }, [])

  const handleReorderMediaItems = useCallback((fromIndex: number, toIndex: number) => {
    setMediaPreviewItems(prev => {
      const reorderedItems = [...prev]
      const [draggedItem] = reorderedItems.splice(fromIndex, 1)
      reorderedItems.splice(toIndex, 0, draggedItem)
      return reorderedItems
    })
  }, [])





  const resizeComposer = useCallback(() => {
    const el = composerRef.current
    if (!el) return
    const styles = window.getComputedStyle(el)
    const lineHeight = parseFloat(styles.lineHeight || '20') || 20
    const paddingTop = parseFloat(styles.paddingTop || '0') || 0
    const paddingBottom = parseFloat(styles.paddingBottom || '0') || 0
    const minHeight = lineHeight + paddingTop + paddingBottom
    const maxLines = 6
    const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom
    el.style.height = 'auto'
    const target = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${Math.max(target, minHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    resizeComposer()
  }, [composer, resizeComposer])

  useEffect(() => {
    const el = composerRef.current
    if (!el) return
    const draft = selectedId ? loadDraft(selectedId) : ''
    setComposer(draft)
    requestAnimationFrame(() => {
      resizeComposer()
      el.focus()
      const end = draft.length
      try { el.setSelectionRange(end, end) } catch {}
    })
  }, [selectedId, resizeComposer])

  useEffect(() => {
    if (chat) {
      requestAnimationFrame(() => composerRef.current?.focus())
    }
  }, [chat])

  // Carregar departamentos quando abrir transferência
  useEffect(() => {
    if (transferOpen && (!departments || departments.length === 0)) {
      dispatch(fetchDepartments() as any)
    }
  }, [transferOpen, departments, dispatch])

  // Carregar atendentes ao escolher departamento
  useEffect(() => {
    const depId = Number(targetDepartmentId)
    setAttendants([])
    if (transferOpen && depId) {
      api.get(`/departamentos/${depId}/membros`).then(({ data }) => {
        const list = Array.isArray(data) ? data : []
        setAttendants(list.map((p: any) => ({ id: String(p.id), name: p.name || p.nome || `#${p.id}` })))
      }).catch(() => setAttendants([]))
    }
  }, [transferOpen, targetDepartmentId])

  // Carregar mensagens existentes quando selecionar um chat
  useEffect(() => {
    if (!selectedId) return
    
    console.log('ChatMessages: Carregando mensagens para chat:', selectedId)
    
    // Carregar mensagens do backend
    api.get(`/atendimentos/${selectedId}/messages`, { params: { limit: 100 } })
      .then(({ data }) => {
        const messagesList = Array.isArray(data) ? data : []
        console.log('Mensagens recebidas do backend:', messagesList)
        
        const formattedMessages: MessageItem[] = messagesList.map((msg: any) => {
          console.log('Processando mensagem:', {
            id: msg.id,
            content: msg.content,
            mediaType: msg.mediaType,
            senderType: msg.senderType
          })
          
          // Filtrar valores padrão inválidos do backend de forma mais robusta
          let cleanContent = msg.content
          
          // Lista expandida de valores padrão inválidos que o backend pode retornar
          const invalidDefaultValues = [
            'Imagem', 'imagem',
            'Vídeo', 'vídeo', 'Video', 'video',
            'Documento', 'documento',
            'Arquivo', 'arquivo',
            'Mídia', 'mídia', 'Media', 'media',
            'File', 'file',
            'Image', 'image'
          ]
          
          if (msg.mediaType && msg.content && msg.content.trim() && invalidDefaultValues.includes(msg.content.trim())) {
            console.group('🚨 BACKEND RETORNANDO VALOR PADRÃO INVÁLIDO')
            console.error('Detalhes da mensagem problemática:', {
              messageId: msg.id,
              content: `"${msg.content}"`,
              mediaType: msg.mediaType,
              senderType: msg.senderType,
              timestamp: msg.timestamp
            })
            console.error('⚠️ AÇÃO NECESSÁRIA: Remover valores padrão do backend!')
            console.error('💡 SOLUÇÃO: Campo "content" deve ser NULL ou string vazia para mídias')
            console.error('🔧 LOCALIZAÇÃO: Verificar endpoint POST /atendimentos/message no backend')
            console.groupEnd()
            
            // Mostrar alerta visual apenas uma vez por mensagem
            const alertKey = `backend-invalid-content-${msg.id}`
            if (!sessionStorage.getItem(alertKey)) {
              sessionStorage.setItem(alertKey, 'shown')
              // Usar setTimeout para não bloquear o carregamento
              setTimeout(() => {
                console.warn(`🚨 ALERTA: Backend retornando valor inválido "${msg.content}" para mídia (ID: ${msg.id})`)
              }, 100)
            }
            
            // Forçar conteúdo limpo
            cleanContent = undefined
          }
          
          return {
            id: String(msg.id),
            type: 'message',
            senderIsMe: msg.senderType === 'ATTENDANT',
            // Para mensagens com mídia, não mostrar conteúdo desnecessário como "Imagem", "Vídeo", etc.
            content: msg.mediaType ? cleanContent : msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            attachment: msg.mediaType ? { 
              type: msg.mediaType as any, // Já é 'IMAGE', 'VIDEO' ou 'DOCUMENT'
              url: msg.metadata?.mediaUrl || '', 
              name: msg.metadata?.mediaFilename || ''
            } : undefined
          }
        })
        
        console.log('Mensagens formatadas:', formattedMessages)
        
        dispatch(setChatMessages({ chatId: selectedId, messages: formattedMessages }))
        
        // Marcar mensagens como lidas após carregar
        if (messagesList.length > 0) {
          const unreadMessages = messagesList.filter((msg: any) => 
            msg.senderType !== 'ATTENDANT' && !msg.readAt
          )
          
          if (unreadMessages.length > 0) {
            // Marcar todas como lidas em lote
            api.patch(`/atendimentos/${selectedId}/messages/read-bulk`)
              .catch((error) => console.error('Erro ao marcar mensagens como lidas:', error))
          }
        }
      })
      .catch((error) => {
        console.error('Erro ao carregar mensagens:', error)
        // Se não conseguir carregar, manter mensagens locais se existirem
        if (!messagesFromStore || messagesFromStore.length === 0) {
          dispatch(setChatMessages({ chatId: selectedId, messages: [] }))
        }
      })
  }, [selectedId, dispatch]) // REMOVIDO messagesFromStore da dependência

  // Scroll para o final quando mensagens são carregadas
  useEffect(() => {
    if (selectedId && messages.length > 0) {
      // Aguardar múltiplos frames para garantir que o DOM foi completamente renderizado
      // e que todas as imagens/vídeos foram carregados
      const scrollToBottomDelayed = () => {
        const el = containerRef.current
        if (el) {
          el.scrollTop = el.scrollHeight
          setPending(0)
        }
      }
      
      // Primeiro frame para renderização básica
      requestAnimationFrame(() => {
        // Segundo frame para garantir que tudo foi renderizado
        requestAnimationFrame(() => {
          // Terceiro frame para garantir que imagens/vídeos foram carregados
          requestAnimationFrame(scrollToBottomDelayed)
        })
      })
    }
  }, [selectedId, messages.length])

  // Carregar mensagens quando um chat é selecionado
  // REMOVIDO: Este useEffect estava duplicando o carregamento de mensagens
  // e sobrescrevendo mensagens temporárias. Agora apenas o useEffect acima
  // carrega as mensagens e preserva as temporárias.

  useEffect(() => {
    if (!selectedId) return
    const el = containerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100
    if (nearBottom) {
      // Scroll para o final com delay para garantir renderização completa
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight
          setPending(0)
        })
      })
    } else {
      setPending((p) => p + 1)
    }
  }, [grouped, selectedId])

  const isNearBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= 100
  }, [])

  const onScroll = useCallback(() => {
    if (isNearBottom()) {
      setPending(0)
    }
  }, [isNearBottom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll])





  const sendTextMessage = useCallback(async (text: string) => {
    if (!selectedId || !text.trim()) return
    
    // Verificar se o usuário pode interagir com este atendimento
    if (!canInteract) {
      alert('Você não tem permissão para enviar mensagens neste atendimento.')
      return
    }
    
    const now = new Date()
    const pad = (n: number) => `${n}`.padStart(2, '0')
    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    
    // Criar ID único para esta mensagem
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Criar mensagem local temporária
    const tempMessage: MessageItem = { 
      id: tempId, 
      type: 'message', 
      senderIsMe: true, 
      content: text, 
      timestamp: hora 
    }
    
    // Adicionar mensagem localmente primeiro
    dispatch(addMessage({ chatId: selectedId, message: tempMessage }))
    dispatch(atualizarPreview({ chatId: selectedId, ultimaMensagem: text, horario: hora }))
    
    // Limpar o campo de texto imediatamente
    setComposer('')
    clearDraft(selectedId)
    requestAnimationFrame(() => scrollToBottom())
    
    try {
      // Enviar para a API
      const response = await api.post('/atendimentos/message', {
        atendimentoId: Number(selectedId),
        content: text,
        senderType: 'ATTENDANT'
      })
      
      // Atualizar a mensagem com o ID real da API
      const realMessage: MessageItem = {
        ...tempMessage,
        id: String(response.data.id),
        timestamp: hora
      }
      
      // Substituir a mensagem temporária pela real
      dispatch(updateMessage({ 
        chatId: selectedId, 
        messageId: tempId, // Usar o ID temporário correto
        updatedMessage: realMessage
      }))
      
      // Campo ultimaMensagem agora é atualizado automaticamente pelo backend
      
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error)
      // Remover mensagem temporária em caso de erro
      dispatch(removeMessage({ 
        chatId: selectedId, 
        messageId: tempId // Usar o ID temporário correto
      }))
      // Mostrar erro para o usuário
      alert('Erro ao enviar mensagem. Tente novamente.')
    }
  }, [selectedId, dispatch, canInteract])

  return (
    <div className="messages-grid-container">
      {chat && (
        <div className="chat-header-top">
          <div className="header-left">
            <img
              src={chat.foto || '/avatar-placeholder.svg'}
              alt={chat.nome}
              className="header-avatar"
            />
            <div className="header-info">
              <div className="header-name-row">
                <span className="header-name">{chat.nome}</span>
                {chat.status && <span className={`header-status status-${chat.status}`}>{chat.status}</span>}
              </div>
              <div className="header-sub">{chat.telefone || '—'}</div>
            </div>
          </div>
          <div className="header-actions">
            {canStart && (
              <button
                type="button"
                className="header-btn"
                title="Iniciar atendimento"
                onClick={async () => {
                  if (!selectedId) return
                  try {
                    // Chamar API para iniciar atendimento
                    await api.patch(`/atendimentos/${selectedId}/claim`)
                    
                    // Atualizar estado local
                    const now = new Date()
                    const pad = (n: number) => `${n}`.padStart(2, '0')
                    const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
                    dispatch(addMessage({ chatId: selectedId, message: { id: `sess-${Date.now()}`, type: 'session', subtype: 'session-start', timestamp: hora } as MessageItem }))
                    dispatch(atualizarStatus({ chatId: selectedId, status: 'ativo' }))
                    
                    // Não recarregar dados da API - manter estado local
                    // await dispatch(loadAtendimentosAsync(undefined) as any)
                  } catch (error: any) {
                    console.error('Erro ao iniciar atendimento:', error)
                    alert('Erro ao iniciar atendimento. Tente novamente.')
                  }
                }}
              >
                <i className="fas fa-play" /> Iniciar
              </button>
            )}
            {canInteract && chat.status?.toLowerCase() !== 'finalizado' && (
              <button
                type="button"
                className="header-btn"
                title="Transferir atendimento"
                onClick={() => { setTransferOpen(true); setTransferError(null); }}
              >
                <i className="fas fa-exchange-alt" /> Transferir
              </button>
            )}
            {canClose && (
              <button
                type="button"
                className="header-btn danger"
                title="Encerrar atendimento"
                onClick={() => { setCloseOpen(true); setCloseError(null); setCloseWithMessage('nenhuma') }}
              >
                <i className="fas fa-stop" /> Encerrar
              </button>
            )}
          </div>
        </div>
      )}
      <div className="messages-container" id="messagesContainer" ref={containerRef}>
        {chat && (
          <div className="new-messages-indicator" style={{ display: pending ? 'block' : 'none' }} onClick={scrollToBottom}>
            <i className="fas fa-chevron-down" /> {pending === 1 ? '1 nova mensagem' : `${pending} novas mensagens`}
          </div>
        )}
        {chat && (
          <button className="scroll-to-bottom-btn" style={{ display: isNearBottom() ? 'none' : 'flex' }} onClick={scrollToBottom} title="Ir para o final da conversa">
            <i className="fas fa-chevron-down" />
          </button>
        )}
        {!chat && (
          <div className="messages-placeholder">
            <div className="placeholder-card">
              <i className="fas fa-comments" />
              <div className="title">Bem-vindo ao Atendimento</div>
              <div className="subtitle">Selecione um chat na lista ao lado para começar</div>
            </div>
          </div>
        )}
        {chat && grouped.map((item) => {
          if (item.type === 'session') {
            return (
              <div key={item.id} className="session-divider">
                <div
                  className="session-info"
                  style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}
                >
                  Sessão - {item.timestamp}
                </div>
              </div>
            )
          }

          // Renderizar mensagens usando os novos componentes
          if (item.attachment) {
            const attachmentType = (item.attachment.type || 'DOCUMENT').toUpperCase()
            
            // Log removido para evitar spam no console
            
            // Se não tem URL válida, mostrar mensagem de erro
            if (!item.attachment.url || item.attachment.url === '' || item.attachment.url === 'undefined' || item.attachment.url === 'null') {
              return (
                <div key={item.id} className={`message ${!!item.senderIsMe ? 'sent' : 'received'} error-message`}>
                  <div className="message-content">
                    <div className="message-bubble error-bubble">
                      <div className="error-content">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>Mídia não disponível</span>
                      </div>
                    </div>
                    <div className="message-time">
                      {item.timestamp}
                      <i className="fas fa-times"></i>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Renderizar por tipo de attachment
            if (attachmentType === 'IMAGE' || attachmentType === 'VIDEO' || attachmentType === 'AUDIO') {
              return <MediaMessage key={item.id} message={item} isOwn={!!item.senderIsMe} />
            }
            
            // Para documentos e outros tipos
            return <DocumentMessage key={item.id} message={item} isOwn={!!item.senderIsMe} />
          }
          
          // Mensagem de texto simples
          return <TextMessage key={item.id} message={item} isOwn={!!item.senderIsMe} />
        })}
      </div>

      {/* Modal Encerrar Atendimento */}
      {closeOpen && chat && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setCloseOpen(false) }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Encerrar atendimento</div>
              <button type="button" className="modal-close" onClick={() => setCloseOpen(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              {closeError && <div className="alert error">{closeError}</div>}
              <div className="form-field">
                <label>Mensagem</label>
                <select value={closeWithMessage} onChange={(e) => setCloseWithMessage(e.target.value as any)}>
                  <option value="nenhuma">Sem mensagem</option>
                  <option value="porAtendente">Encerrar com mensagem: por atendente</option>
                  <option value="porInatividade">Encerrar com mensagem: por inatividade</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setCloseOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="btn primary"
                onClick={async () => {
                  if (!selectedId) return
                  setCloseError(null)
                  const idNum = Number(selectedId)
                  try {
                    // Mensagem opcional
                    let content = ''
                    if (closeWithMessage === 'porAtendente') {
                      const name = authUser?.name || 'Atendente'
                      content = `Atendimento encerrado por ${name}`
                    } else if (closeWithMessage === 'porInatividade') {
                      content = 'Atendimento encerrado por inatividade.'
                    }
                    const now = new Date(); const pad = (n: number) => `${n}`.padStart(2, '0'); const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
                    if (content) {
                      await api.post('/atendimentos/message', { atendimentoId: idNum, content, senderType: 'ATTENDANT' })
                      dispatch(atualizarPreview({ chatId: selectedId, ultimaMensagem: content, horario: hora }))
                    }
                                         await api.patch(`/atendimentos/${idNum}/close`)
                     dispatch(atualizarStatus({ chatId: selectedId, status: 'finalizado' }))
                     setCloseOpen(false)
                     
                     // Não recarregar dados da API - manter estado local
                     // await dispatch(loadAtendimentosAsync(undefined) as any)
                     
                     // limpar seleção do chat
                     dispatch(clearSelected())
                  } catch (e: any) {
                    setCloseError(e?.response?.data?.message || e?.message || 'Falha ao encerrar')
                  }
                }}
              >Encerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transferir Atendimento */}
      {transferOpen && chat && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setTransferOpen(false) }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Transferir atendimento</div>
              <button type="button" className="modal-close" onClick={() => setTransferOpen(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              {transferError && <div className="alert error">{transferError}</div>}
              <div className="form-field">
                <label>Novo departamento (opcional)</label>
                <select value={targetDepartmentId} onChange={(e) => { setTargetDepartmentId(e.target.value); setTargetAttendantId('') }}>
                  <option value="">(Selecione)</option>
                  {departments.map((d) => (<option key={d.id} value={String(d.id)}>{d.name}</option>))}
                </select>
              </div>
              <div className="form-field">
                <label>Atendente (opcional)</label>
                <select value={targetAttendantId} onChange={(e) => setTargetAttendantId(e.target.value)}>
                  <option value="">(Selecione)</option>
                  {attendants.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </div>
              <div className="form-field" style={{ alignItems: 'flex-start' }}>
                <label style={{ marginTop: 4 }}>Mensagem</label>
                <div>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="checkbox" checked={transferGiveMessage} onChange={(e) => setTransferGiveMessage(e.target.checked)} />
                    Enviar mensagem ao cliente
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setTransferOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="btn primary"
                onClick={async () => {
                  if (!selectedId) return
                  setTransferError(null)
                  const idNum = Number(selectedId)
                  const depId = targetDepartmentId ? Number(targetDepartmentId) : undefined
                  const attId = targetAttendantId ? Number(targetAttendantId) : undefined
                  if (!depId && !attId) { setTransferError('Informe ao menos um: departamento ou atendente.'); return }
                  try {
                    await api.patch(`/atendimentos/${idNum}/transfer`, { departamentoId: depId, atendenteId: attId })
                    // Mensagem opcional
                    if (transferGiveMessage) {
                      const depName = depId ? (departments.find(d => String(d.id) === String(depId))?.name || `#${depId}`) : ''
                      const attName = attId ? (attendants.find(a => String(a.id) === String(attId))?.name || `#${attId}`) : ''
                      let content = ''
                      if (depId && attId) content = `Atendimento transferido para o departamento ${depName} e para o ${attName}`
                      else if (depId) content = `Atendimento transferido para o departamento ${depName}`
                      else if (attId) content = `Atendimento transferido para o ${attName}`
                      if (content) {
                        await api.post('/atendimentos/message', { atendimentoId: idNum, content, senderType: 'ATTENDANT' })
                        const now = new Date(); const pad = (n: number) => `${n}`.padStart(2, '0'); const hora = `${pad(now.getHours())}:${pad(now.getMinutes())}`
                        dispatch(atualizarPreview({ chatId: selectedId, ultimaMensagem: content, horario: hora }))
                      }
                    }
                    // Atualizar estado local
                    if (depId) dispatch(transferirDepartamento({ chatId: selectedId, departamento: departments.find(d => String(d.id) === String(depId))?.name || `#${depId}` }))
                    // Após transferência fica pendente
                    dispatch(atualizarStatus({ chatId: selectedId, status: 'pendente' }))
                    setTransferOpen(false)
                    
                    // Não recarregar dados da API - manter estado local
                    // await dispatch(loadAtendimentosAsync(undefined) as any)
                    
                    // limpar seleção do chat
                    dispatch(clearSelected())
                  } catch (e: any) {
                    setTransferError(e?.response?.data?.message || e?.message || 'Falha ao transferir')
                  }
                }}
              >Transferir</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensagem quando não pode interagir */}
      {chat && !canInteract && chat.status?.toLowerCase() !== 'finalizado' && (
        <div className="composer-bar disabled" style={{ 
          backgroundColor: '#f3f4f6', 
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          {chat.status?.toLowerCase() === 'ativo' && chat.atendenteId !== String(authUser?.id) ? 
            'Este atendimento está sendo conduzido por outro atendente.' :
            'Você não tem permissão para interagir com este atendimento.'
          }
        </div>
      )}
      
      {chat && canInteract && (
        <div className="composer-bar">
          <div className="composer-actions" style={{ display: isRecordingAudio ? 'none' : 'flex' }}>
            <div className="attach-menu">
              <button 
                type="button" 
                className="composer-action" 
                title="Anexar" 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setAttachOpen((v) => !v)
                }}
              >
                <i className="fas fa-paperclip" />
              </button>
              {attachOpen && (
                <div className="attach-popover">
                  <button
                    type="button"
                    className="attach-item"
                    onClick={(e) => { 
                      e.preventDefault()
                      e.stopPropagation()
                      setAttachOpen(false)
                      docInputRef.current?.click() 
                    }}
                  >
                    <i className="fas fa-file" /> Documento
                  </button>
                  <button
                    type="button"
                    className="attach-item"
                    onClick={(e) => { 
                      console.log('Botão Foto e vídeo clicado')
                      e.preventDefault()
                      e.stopPropagation()
                      setAttachOpen(false)
                      console.log('Chamando handleMediaFiles...')
                      mediaInputRef.current?.click() 
                    }}
                  >
                    <i className="fas fa-image" /> Foto e vídeo
                  </button>
                </div>
              )}
              <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/*,image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => {
                const files = e.target.files; 
                if (files && files.length > 0) {
                  // IMPORTANTE: Se o usuário escolheu "Documento", sempre tratar como documento
                  // Independente se é uma imagem, vídeo ou qualquer outro tipo
                  handleDocumentFiles(files)
                }
                if (e.target) e.target.value = ''
              }} />
              <input 
                ref={mediaInputRef} 
                type="file" 
                accept="image/*,video/*,application/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" 
                multiple 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  const files = e.target.files
                  if (files && files.length > 0) {
                    handleMediaFiles(files)
                  }
                  if (e.target) e.target.value = ''
                }} 
              />
            </div>
          </div>
          
          <textarea
            className="composer-input"
            placeholder="Digite uma mensagem"
            value={composer}
            style={{ display: isRecordingAudio ? 'none' : 'block' }}
            onChange={(e) => {
              const text = e.target.value
              setComposer(text)
              if (selectedId) saveDraft(selectedId, text)
              // Manter o gravador de áudio sempre visível
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const text = composer.trim()
                if (!text || !selectedId) return
                sendTextMessage(text)
              }
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items
              if (!items) return
              
              for (let i = 0; i < items.length; i++) {
                const item = items[i]
                
                // Verificar se é uma imagem
                if (item.type.startsWith('image/')) {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  const file = item.getAsFile()
                  if (file) {
                    console.log('Imagem colada no input principal:', file.name, file.type, file.size)
                    
                    // Criar FileList para usar handleMediaFiles
                    const dataTransfer = new DataTransfer()
                    dataTransfer.items.add(file)
                    const fileList = dataTransfer.files
                    
                    // Adicionar como mídia usando handleMediaFiles
                    handleMediaFiles(fileList)
                    
                    break // Processar apenas a primeira imagem
                  }
                }
              }
            }}
            rows={1}
            ref={composerRef}
          />
          
          {/* Sempre mostrar o AudioRecorder quando estiver gravando */}
          {(isRecordingAudio || !composer.trim()) && (
            <AudioRecorder
              onSendAudio={handleSendAudioMessage}
              onCancel={() => {}}
              isVisible={true}
              onRecordingStateChange={(isRecording, isPaused) => {
                setIsRecordingAudio(isRecording || isPaused)
              }}
            />
          )}
          
          {/* Mostrar botão de enviar apenas quando há texto e não está gravando */}
          {composer.trim() && !isRecordingAudio && (
            <button
              type="button"
              className="composer-send"
              onClick={() => {
                const text = composer.trim()
                if (!text || !selectedId) return
                sendTextMessage(text)
              }}
              title="Enviar"
            >
              <i className="fas fa-paper-plane" />
            </button>
          )}
        </div>
      )}





      {/* Modal de Preview de Mídia */}
      <MediaPreviewModal
        mediaItems={mediaPreviewItems}
        isOpen={mediaPreviewOpen}
        onClose={handleCloseMediaPreview}
        onSend={handleSendMediaItems}
        onRemoveMedia={handleRemoveMediaItem}
        onAddMoreMedia={handleAddMoreMedia}
        onUpdateMessage={handleUpdateMessage}
        onReorderMedia={handleReorderMediaItems}
      />

     </div>
   )
 }


