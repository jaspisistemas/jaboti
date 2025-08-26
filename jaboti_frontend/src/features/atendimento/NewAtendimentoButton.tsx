import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../redux/store'
import { fetchDepartments } from '../../redux/slices/departmentsSlice'
import api from '../../api'
import { useModalManager } from './hooks/useModalManager'

interface Props {
  onCreate: (pessoaId: number, departamentoId?: number) => Promise<any> | any
}

export function NewAtendimentoButton({ onCreate }: Props) {
  const dispatch = useDispatch()
  const departments = useSelector((s: RootState) => s.departments.list)
  const [open, setOpen] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>('')
  const [selectedDepId, setSelectedDepId] = useState<number | ''>('')
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registrar modal no gerenciador para prioridade ESC
  useModalManager('new-atendimento', open, () => setOpen(false))

  useEffect(() => {
    if (!open) return
    if (!departments?.length) dispatch(fetchDepartments() as any)
  }, [open, departments?.length, dispatch])

  useEffect(() => {
    if (!open) return
    const q = (query || '').trim()
    const t = setTimeout(() => setDebouncedQuery(q), 250)
    return () => clearTimeout(t)
  }, [open, query])

  useEffect(() => {
    if (!open) return
    const q = debouncedQuery
    if (!q) { setClientes([]); return }
    setLoadingClientes(true)
    api
      .get('/pessoas', { params: { tipo: 'CLIENTE', q, page: 1, limit: 4 } })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
        setClientes((list || []).slice(0, 4))
      })
      .finally(() => setLoadingClientes(false))
  }, [open, debouncedQuery])

  const canConfirm = useMemo(() => Number.isInteger(Number(selectedClienteId)), [selectedClienteId])

  return (
    <>
      <button
        type="button"
        className="chat-new-btn"
        title="Novo atendimento"
        onClick={() => setOpen(true)}
      >
        <i className="fas fa-plus" />
      </button>
      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Novo atendimento</div>
              <button type="button" className="modal-close" onClick={() => setOpen(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="alert error" role="alert" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div className="form-field">
                <label>Cliente</label>
                <div className="autocomplete">
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome/telefone"
                    value={query}
                    onChange={(e) => { const v = e.target.value; setQuery(v); setShowSuggest(!!v.trim()) }}
                    onFocus={() => { if ((query || '').trim()) setShowSuggest(true) }}
                  />
                  {showSuggest && query.trim() && (
                  <div className="listbox popover">
                    {loadingClientes ? (
                      <div className="listbox-empty">Carregando...</div>
                    ) : clientes.length === 0 ? (
                      <div className="listbox-empty">Nenhum cliente encontrado</div>
                    ) : (
                      clientes.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`listbox-item ${String(selectedClienteId) === String(p.id) ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedClienteId(Number(p.id));
                            setQuery(p.nome || p.name || p.telefone || p.phone || String(p.id));
                            setShowSuggest(false);
                          }}
                        >
                          <div className="listbox-title">{p.nome || p.name}</div>
                          <div className="listbox-sub">{p.telefone || p.phone || '-'}</div>
                        </button>
                      ))
                    )}
                  </div>
                  )}
                </div>
              </div>
              <div className="form-field">
                <label>Departamento (opcional)</label>
                <select value={String(selectedDepId)} onChange={(e) => setSelectedDepId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">(Selecione)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
              <button
                type="button"
                className="btn primary"
                disabled={!canConfirm}
                onClick={async () => {
                  if (!canConfirm) return
                  try {
                    setError(null)
                    await onCreate(Number(selectedClienteId), selectedDepId ? Number(selectedDepId) : undefined)
                    setOpen(false)
                    // reset
                    setSelectedClienteId('')
                    setSelectedDepId('')
                    setQuery('')
                  } catch (e: any) {
                    const msg = e?.message || e || 'Falha ao criar atendimento'
                    setError(String(msg))
                  }
                }}
              >Criar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


