import { useEffect } from 'react'
import { ChatList } from './ChatList'
import { ChatMessages } from './ChatMessages'
import { useAppDispatch } from './hooks'
import { clearSelected, loadAtendimentosAsync } from './slices/chatsSlice'
import { /* seedMessages */ } from './slices/messagesSlice'
import { modalManager } from './hooks/useModalManager'

export function Atendimento() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Carregar chats iniciais apenas uma vez
    dispatch(loadAtendimentosAsync(undefined))
    // mensagens serão carregadas conforme seleção real; removido seed
  }, [dispatch])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Se há modais abertos, fechar o modal mais recente primeiro
        const topModal = modalManager.getTopModal()
        if (topModal) {
          topModal.close()
        } else {
          // Se não há modais, fechar o chat selecionado
          dispatch(clearSelected())
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  return (
    <div className="atendimento-shell">
      <aside className="sidebar">
        <ChatList />
      </aside>
      <main className="content">
        <ChatMessages />
      </main>
    </div>
  )
}

export default Atendimento


