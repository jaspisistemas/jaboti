import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import api from '../api'
import { showSnackbar } from '../redux/slices/notificationsSlice'
import ContatoModal from '../features/contatos/ContatoModal'
import type { Contato } from '../features/contatos/ContatoModal'

interface Pessoa {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  chatName?: string | null
  documento?: string | null
  empresa?: string | null
  cargo?: string | null
  etapa?: string | null
  photoUrl?: string | null
}

const ContatosPage: React.FC = () => {
  const dispatch = useDispatch()
  const [items, setItems] = useState<Pessoa[]>([])
  const [q, setQ] = useState('')
  const [idFilter, setIdFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create'|'edit'|'view'>('create')
  const [modalData, setModalData] = useState<Partial<Contato>|undefined>(undefined)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)

  const load = async () => {
    try {
      const params: any = { tipo: 'CLIENTE' }
      if (q) params.q = q
      params.page = page
      params.limit = limit
      const { data } = await api.get('/pessoas', { params })
      if (Array.isArray(data)) {
        setItems(data)
        setTotal(data.length)
      } else {
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total || 0))
      }
    } catch (e: any) {
      dispatch(showSnackbar({ message: e?.response?.data?.message || 'Erro ao carregar contatos', severity: 'error' }))
    }
  }

  useEffect(() => { load() }, [page, limit])

  const filtered = useMemo(() => {
    const idNum = Number(idFilter)
    if (idFilter && Number.isInteger(idNum)) {
      return items.filter(i => Number(i.id) === idNum)
    }
    return items
  }, [items, idFilter])

  const onOpenModal = (mode: 'create'|'edit'|'view', data?: Pessoa) => {
    setModalMode(mode)
    setModalData(data ? {
      id: data.id,
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      chatName: data.chatName || undefined,
      documento: data.documento || undefined,
      empresa: data.empresa || undefined,
      cargo: data.cargo || undefined,
      etapa: (data.etapa as any) || 'LEAD',
      photoUrl: data.photoUrl || undefined,
    } : undefined)
    setModalOpen(true)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Remover contato?')) return
    try {
      await api.delete(`/pessoas/${id}`)
      dispatch(showSnackbar({ message: 'Contato removido', severity: 'success' }))
      await load()
    } catch (e: any) {
      dispatch(showSnackbar({ message: e?.response?.data?.message || 'Erro ao remover', severity: 'error' }))
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', gap: 16, padding: 16, boxSizing: 'border-box' }}>
      <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Código" value={idFilter} onChange={e=>setIdFilter(e.target.value)} style={{ width: 120 }} />
          <input placeholder="Nome/Telefone/E-mail" value={q} onChange={e=>setQ(e.target.value)} style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={()=>load()}>Buscar</button>
          <button type="button" className="btn primary" onClick={()=>onOpenModal('create')}>Novo</button>
        </div>
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ width: 60 }}>Foto</th>
                <th style={{ width: 80 }}>Código</th>
                <th>Nome</th><th>Telefone</th><th>E-mail</th><th>Empresa</th><th>Etapa</th><th style={{ width: 240 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      overflow: 'hidden', 
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f9fafb',
                      margin: '0 auto'
                    }}>
                      {p.photoUrl ? (
                        <img 
                          src={p.photoUrl} 
                          alt={p.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="fas fa-user" style={{ fontSize: '1rem', color: '#9ca3af' }} />
                      )}
                    </div>
                  </td>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.phone}</td>
                  <td>{p.email}</td>
                  <td>{p.empresa}</td>
                  <td>{p.etapa}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn" onClick={()=>onOpenModal('view', p)}>Ver</button>
                    <button type="button" className="btn" onClick={()=>onOpenModal('edit', p)}>Editar</button>
                    <button type="button" className="btn" onClick={()=>onDelete(p.id)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {total > 0 ? `Mostrando ${(page-1)*limit+1} - ${Math.min(page*limit, total)} de ${total}` : 'Nenhum registro'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Anterior</button>
            <span style={{ fontSize: 12 }}>Página {page}</span>
            <button className="btn" disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)}>Próxima</button>
            <select value={limit} onChange={e=>{ setPage(1); setLimit(Number(e.target.value)) }}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
      <ContatoModal
        open={modalOpen}
        mode={modalMode}
        initial={modalData}
        onCancel={()=>setModalOpen(false)}
        onConfirm={async (data) => {
          try {
            let photoUrl = data.photoUrl
            
            // Se há um arquivo de foto selecionado, fazer upload primeiro
            if (data.photoFile) {
              try {
                const formData = new FormData()
                formData.append('file', data.photoFile)
                
                // Fazer upload para o backend
                const uploadResponse = await fetch('http://192.168.100.46:3523/uploads/profile', {
                  method: 'POST',
                  body: formData,
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  },
                })
                
                if (uploadResponse.ok) {
                  const uploadResult = await uploadResponse.json()
                  photoUrl = uploadResult.file.url
                } else {
                  const errorData = await uploadResponse.json()
                  console.error('Erro detalhado do upload:', errorData)
                  throw new Error(`Erro no upload: ${errorData.message || 'Erro desconhecido'}`)
                }
              } catch (uploadError) {
                console.error('Erro no upload da foto:', uploadError)
                dispatch(showSnackbar({ 
                  message: 'Erro ao fazer upload da foto', 
                  severity: 'error' 
                }))
                return
              }
            }
            
            const buildBody = (src: any) => {
              const body: any = { type: 'CLIENTE' }
              if (src.name && String(src.name).trim()) body.name = String(src.name).trim()
              if (src.email && String(src.email).trim()) body.email = String(src.email).trim()
              if (src.phone && String(src.phone).trim()) body.phone = String(src.phone).trim()
              if (src.chatName && String(src.chatName).trim()) body.chatName = String(src.chatName).trim()
              if (src.documento && String(src.documento).trim()) body.documento = String(src.documento).trim()
              if (src.empresa && String(src.empresa).trim()) body.empresa = String(src.empresa).trim()
              if (src.cargo && String(src.cargo).trim()) body.cargo = String(src.cargo).trim()
              if (src.etapa && String(src.etapa).trim()) body.etapa = String(src.etapa).trim()
              if (photoUrl && String(photoUrl).trim()) body.photoUrl = String(photoUrl).trim()
              
              return body
            }
            
            if (modalMode === 'create') {
              const body = buildBody(data)
              await api.post('/pessoas', body)
              dispatch(showSnackbar({ message: 'Contato criado', severity: 'success' }))
            } else if (modalMode === 'edit' && data.id) {
              const body = buildBody(data)
              await api.patch(`/pessoas/${data.id}`, body)
              dispatch(showSnackbar({ message: 'Contato atualizado', severity: 'success' }))
            }
            setModalOpen(false)
            await load()
          } catch (error: any) {
            console.error('Erro ao salvar contato:', error)
            console.error('Response data:', error.response?.data)
            
            // Extrair mensagem de erro específica
            let errorMessage = 'Erro ao salvar contato'
            if (error.response?.data?.message) {
              if (Array.isArray(error.response.data.message)) {
                errorMessage = error.response.data.message.join(', ')
              } else {
                errorMessage = error.response.data.message
              }
            }
            
            dispatch(showSnackbar({ 
              message: errorMessage, 
              severity: 'error' 
            }))
          }
        }}
      />
    </div>
  )
}

export default ContatosPage


