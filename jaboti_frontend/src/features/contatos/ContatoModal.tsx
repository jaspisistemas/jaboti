import React, { useEffect, useState } from 'react'

export type Contato = {
  id?: number
  name: string
  phone?: string
  email?: string
  chatName?: string
  documento?: string
  empresa?: string
  cargo?: string
  etapa?: 'LEAD' | 'OPORTUNIDADE' | 'CLIENTE' | 'INATIVO'
  photoUrl?: string
  photoFile?: File
}

type Mode = 'create' | 'edit' | 'view'

interface Props {
  open: boolean
  mode: Mode
  initial?: Partial<Contato>
  onCancel: () => void
  onConfirm: (data: Contato) => Promise<void> | void
}

const empty: Contato = { name: '', phone: '', email: '', chatName: '', documento: '', empresa: '', cargo: '', etapa: 'LEAD', photoUrl: '', photoFile: undefined }

export const ContatoModal: React.FC<Props> = ({ open, mode, initial, onCancel, onConfirm }) => {
  const [form, setForm] = useState<Contato>(empty)
  const readOnly = mode === 'view'

  useEffect(() => {
    if (!open) return
    const base: Contato = {
      name: initial?.name || '',
      phone: initial?.phone || '',
      email: initial?.email || '',
      chatName: initial?.chatName || '',
      documento: initial?.documento || '',
      empresa: initial?.empresa || '',
      cargo: initial?.cargo || '',
      etapa: (initial?.etapa as any) || 'LEAD',
      photoUrl: initial?.photoUrl || '',
      photoFile: undefined,
      id: initial?.id,
    }
    setForm(base)
  }, [open, initial])

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e)=>{ if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal-card" style={{ width: 720 }}>
        <div className="modal-header">
          <div className="modal-title">{mode === 'create' ? 'Novo contato' : mode === 'edit' ? 'Editar contato' : 'Visualizar contato'}</div>
          <button type="button" className="modal-close" onClick={onCancel}><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
              <label>Foto</label>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '2px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f9fafb'
                }}>
                  {form.photoUrl ? (
                    <img 
                      src={form.photoUrl} 
                      alt="Foto do contato" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: '2rem', color: '#9ca3af' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Apenas armazenar o arquivo selecionado, sem fazer upload
                        setForm(f => ({ ...f, photoFile: file }))
                        
                        // Criar preview temporário para exibição
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setForm(f => ({ ...f, photoUrl: event.target!.result as string }))
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                    disabled={readOnly}
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <button 
                    type="button" 
                    className="btn" 
                    disabled={readOnly}
                    onClick={() => {
                      if (!readOnly) {
                        document.getElementById('photo-upload')?.click()
                      }
                    }}
                  >
                    <i className="fas fa-camera" /> Escolher
                  </button>
                  {form.photoUrl && !readOnly && (
                    <button 
                      type="button" 
                      className="btn danger" 
                      onClick={() => setForm(f => ({ ...f, photoUrl: '' }))}
                    >
                      <i className="fas fa-trash" /> Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="form-field">
              <label>Nome</label>
              <input value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} disabled={readOnly} placeholder="Nome completo" />
            </div>
            <div className="form-field">
              <label>Apelido</label>
              <input value={form.chatName || ''} onChange={e=>setForm(f=>({ ...f, chatName: e.target.value }))} disabled={readOnly} placeholder="Apelido / nome no chat" />
            </div>
            <div className="form-field">
              <label>Telefone</label>
              <input value={form.phone || ''} onChange={e=>setForm(f=>({ ...f, phone: e.target.value }))} disabled={readOnly} placeholder="+55 11 9...." />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input value={form.email || ''} onChange={e=>setForm(f=>({ ...f, email: e.target.value }))} disabled={readOnly} placeholder="email@dominio.com" />
            </div>
            <div className="form-field">
              <label>Documento</label>
              <input value={form.documento || ''} onChange={e=>setForm(f=>({ ...f, documento: e.target.value }))} disabled={readOnly} placeholder="CPF/CNPJ" />
            </div>
            <div className="form-field">
              <label>Empresa</label>
              <input value={form.empresa || ''} onChange={e=>setForm(f=>({ ...f, empresa: e.target.value }))} disabled={readOnly} placeholder="Empresa" />
            </div>
            <div className="form-field">
              <label>Cargo</label>
              <input value={form.cargo || ''} onChange={e=>setForm(f=>({ ...f, cargo: e.target.value }))} disabled={readOnly} placeholder="Cargo" />
            </div>
            <div className="form-field">
              <label>Etapa</label>
              <select value={form.etapa || 'LEAD'} onChange={e=>setForm(f=>({ ...f, etapa: e.target.value as any }))} disabled={readOnly}>
                <option value="LEAD">Lead</option>
                <option value="OPORTUNIDADE">Oportunidade</option>
                <option value="CLIENTE">Cliente</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onCancel}>Fechar</button>
          {mode !== 'view' && (
            <button
              type="button"
              className="btn primary"
              onClick={() => onConfirm(form)}
              disabled={!form.name.trim()}
            >Salvar</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContatoModal


