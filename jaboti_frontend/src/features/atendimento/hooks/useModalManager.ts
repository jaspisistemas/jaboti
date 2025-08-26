import { useEffect, useRef } from 'react'

interface ModalRef {
  id: string
  isOpen: boolean
  close: () => void
}

class ModalManager {
  private modals: ModalRef[] = []
  private listeners: Set<(modals: ModalRef[]) => void> = new Set()

  addModal(modal: ModalRef) {
    this.modals.push(modal)
    this.notifyListeners()
  }

  removeModal(id: string) {
    this.modals = this.modals.filter(m => m.id !== id)
    this.notifyListeners()
  }

  updateModal(id: string, isOpen: boolean) {
    const modal = this.modals.find(m => m.id === id)
    if (modal) {
      modal.isOpen = isOpen
      this.notifyListeners()
    }
  }

  getTopModal(): ModalRef | undefined {
    return this.modals.filter(m => m.isOpen).pop()
  }

  hasOpenModals(): boolean {
    return this.modals.some(m => m.isOpen)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.modals]))
  }

  addListener(listener: (modals: ModalRef[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

// Instância global do gerenciador de modais
const modalManager = new ModalManager()

export function useModalManager(id: string, isOpen: boolean, close: () => void) {
  const modalRef = useRef<ModalRef>({ id, isOpen, close })

  useEffect(() => {
    modalRef.current = { id, isOpen, close }
  }, [id, isOpen, close])

  useEffect(() => {
    modalManager.addModal(modalRef.current)
    return () => modalManager.removeModal(id)
  }, [id])

  useEffect(() => {
    modalManager.updateModal(id, isOpen)
  }, [id, isOpen])

  return modalManager
}

export { modalManager }
