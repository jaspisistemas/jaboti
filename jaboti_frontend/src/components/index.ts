// Componentes principais
export { default as MessagesGrid } from './MessagesGrid';
export { AudioRecorder } from './AudioRecorder';

// Sistema de controle avançado de áudio
export { useAdvancedAudioControl } from '../hooks/useAdvancedAudioControl';
export { AudioMessage } from './AudioMessage';
export { FloatingAudioControl } from './FloatingAudioControl';

// Componente de demonstração
export { AudioControlDemo } from './AudioControlDemo';

// Tipos
export type { MessageItem, Attachment } from './MessagesGrid';
export type { AudioControlState } from '../hooks/useAdvancedAudioControl';
