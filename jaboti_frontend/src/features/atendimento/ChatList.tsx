import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import { useAppDispatch } from './hooks'
import { selectChat, createAtendimentoAsync } from './slices/chatsSlice'
import { NewAtendimentoButton } from './NewAtendimentoButton'

export function ChatList() {
  const dispatch = useAppDispatch()
  const chats = useSelector((s: RootState) => s.chats?.items || [])
  const selectedId = useSelector((s: RootState) => s.chats?.selectedId)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<{ ativos: boolean; pendentes: boolean; bot: boolean }>({ ativos: true, pendentes: true, bot: true })
  const [isMulti, setIsMulti] = useState(true)

  const collapseToFirstActive = (f: { ativos: boolean; pendentes: boolean; bot: boolean }) => {
    if (f.ativos) return { ativos: true, pendentes: false, bot: false }
    if (f.pendentes) return { ativos: false, pendentes: true, bot: false }
    if (f.bot) return { ativos: false, pendentes: false, bot: true }
    // se nenhum marcado, padrão para 'ativos'
    return { ativos: true, pendentes: false, bot: false }
  }

  const ensureAtLeastOne = (f: { ativos: boolean; pendentes: boolean; bot: boolean }) => {
    if (!f.ativos && !f.pendentes && !f.bot) return { ...f, ativos: true }
    return f
  }

  const toggleStatus = (key: 'ativos' | 'pendentes' | 'bot') => {
    setStatusFilter((prev) => {
      if (isMulti) {
        return ensureAtLeastOne({ ...prev, [key]: !prev[key] })
      }
      // modo single: mantém apenas o clicado
      if (prev[key]) {
        // já está selecionado, mantém ligado (não permite zero selecionado)
        return prev
      }
      return { ativos: key === 'ativos', pendentes: key === 'pendentes', bot: key === 'bot' }
    })
  }

  const filtered = useMemo(() => {
    const normalizeText = (s: string): string =>
      (s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
    const onlyDigits = (s: string): string => (s || '').replace(/\D+/g, '')

    const q = query.trim()
    const nq = normalizeText(q)
    const qDigits = onlyDigits(q)
    return chats.filter(c => {
      const nome = normalizeText(c.nome || '')
      const foneNorm = normalizeText(c.telefone || '')
      const foneDigits = onlyDigits(c.telefone || '')
      const byName = nq.length > 0 && nome.includes(nq)
      const byPhone = (nq.length > 0 && foneNorm.includes(nq)) || (qDigits.length > 0 && foneDigits.includes(qDigits))
      const matchQuery = (nq.length === 0 && qDigits.length === 0) || byName || byPhone
      const stNorm = normalizeText(String(c.status || 'ativo'))
      const matchStatus = (stNorm === 'ativo' && statusFilter.ativos)
        || (stNorm === 'pendente' && statusFilter.pendentes)
        || (stNorm === 'bot' && statusFilter.bot)
      return matchQuery && matchStatus
    })
  }, [chats, query, statusFilter])

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.horarioOrdenacao || 0) - (a.horarioOrdenacao || 0)), [filtered])

  return (
    <div id="chats">
      <div className="chat-list-header">
        <div className="chat-search">
          <i className="fas fa-search chat-search-icon" />
          <input
            type="text"
            className="chat-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou telefone"
          />
          {query && (
            <button type="button" className="chat-search-clear" onClick={() => setQuery('')} title="Limpar">
              <i className="fas fa-times" />
            </button>
          )}
          <NewAtendimentoButton onCreate={(pessoaId, departamentoId) => dispatch(createAtendimentoAsync({ clientId: pessoaId, departamentoId }))} />
        </div>
        <div className="chat-filters-row">
          <button
            type="button"
            title={isMulti ? 'Múltipla seleção: ON' : 'Múltipla seleção: OFF'}
            onClick={() => {
              setIsMulti((prev) => {
                const next = !prev
                if (!next) {
                  setStatusFilter((f) => collapseToFirstActive(f))
                }
                return next
              })
            }}
            className={`multi-toggle ${isMulti ? 'on' : ''}`}
            aria-pressed={isMulti}
          />
          <button
            type="button"
            onClick={() => toggleStatus('ativos')}
            className={`chat-filter ${statusFilter.ativos ? 'on' : ''}`}
          >Ativos</button>
          <button
            type="button"
            onClick={() => toggleStatus('pendentes')}
            className={`chat-filter ${statusFilter.pendentes ? 'on' : ''}`}
          >Pendentes</button>
          <button
            type="button"
            onClick={() => toggleStatus('bot')}
            className={`chat-filter ${statusFilter.bot ? 'on' : ''}`}
          >Bot</button>
        </div>
      </div>
      {sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>
          Nenhum chat disponível
        </div>
      )}
      {sorted.map((chat) => {
        const draft = (() => { try { return sessionStorage.getItem(`chatDraft:${chat.id}`) || '' } catch { return '' } })()
        const lastPreview = draft ? `Rascunho: ${draft}` : chat.ultimaMensagem
        return (
        <div
          key={chat.id}
          className={`chat-item ${selectedId === chat.id ? 'selected' : ''}`}
          data-id={chat.id}
          onClick={() => dispatch(selectChat(chat.id))}
        >
          <div className="chat-content">
            <img
              src={chat.foto || 'https://randomuser.me/api/portraits/men/32.jpg'}
              alt={chat.nome}
              className="avatar"
            />
            <div className="chat-info">
              <div className="chat-header">
                <span className="contact-name">{chat.nome}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="chat-time">{chat.horario}</span>
                  {chat.mensagensNovas ? (
                    <span className="messages-badge">
                      {chat.mensagensNovas > 99 ? '99+' : chat.mensagensNovas}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="last-message">
                {draft ? (<strong>Rascunho: </strong>) : null}
                {draft ? draft : (lastPreview || '')}
              </div>
              <div className="chat-meta">
                <span className="meta-item">{chat.departamento || 'Geral'}</span>
                <span className="meta-item">{chat.canal || 'WhatsApp'}</span>
                <span className={`status-indicator status-${chat.status || 'ativo'}`}>{(chat.status || 'ativo').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      )})}
    </div>
  )
}


