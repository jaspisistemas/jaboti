# 🎵 Sistema de Controle Avançado de Áudio

Este sistema implementa um controle de áudio avançado para o grid de mensagens, baseado no código do GenExus, com funcionalidades modernas e responsivas.

## ✨ Funcionalidades Principais

### 1. **Controle de Múltiplos Áudios**
- Apenas um áudio pode tocar por vez
- Quando um novo áudio é iniciado, os outros param automaticamente
- Sincronização perfeita entre todos os controles

### 2. **Modal Flutuante Inteligente**
- Aparece automaticamente quando o usuário faz scroll e o áudio fica fora da tela
- Permite controlar o áudio mesmo quando não está visível
- Desaparece quando o áudio volta a ficar visível

### 3. **Barra de Progresso Interativa**
- Clique direto na barra para navegar
- Knob arrastável para controle preciso
- Atualização em tempo real do progresso
- Visual feedback durante o arraste

### 4. **Controle de Velocidade**
- Ciclo entre 1x, 1.5x e 2x
- Sincronizado entre controle local e modal flutuante
- Aplicado instantaneamente ao áudio

### 5. **Navegação Inteligente**
- Botão para localizar a mensagem do áudio atual
- Scroll suave até a mensagem
- Destaque visual temporário da mensagem

## 🏗️ Arquitetura do Sistema

### Componentes Principais

#### `useAdvancedAudioControl` (Hook)
- Gerencia todo o estado do sistema de áudio
- Controla reprodução, pausa e sincronização
- Gerencia visibilidade do controle flutuante
- Implementa lógica de "um áudio por vez"

#### `AudioMessage` (Componente)
- Renderiza mensagens de áudio individuais
- Controles locais com barra de progresso
- Sincronização com o sistema principal
- Estados visuais (playing, paused)

#### `FloatingAudioControl` (Componente)
- Modal flutuante para controle remoto
- Barra de progresso completa
- Controles de navegação e velocidade
- Animações suaves de entrada/saída

#### `MessagesGrid` (Componente Atualizado)
- Integra o sistema de áudio
- Roteia mensagens de áudio para o componente correto
- Configura o container para detecção de scroll

## 🚀 Como Usar

### 1. **Instalação dos Componentes**

```tsx
import { useAdvancedAudioControl } from '../hooks/useAdvancedAudioControl';
import { AudioMessage } from './AudioMessage';
import { FloatingAudioControl } from './FloatingAudioControl';
```

### 2. **Configuração no Componente Principal**

```tsx
const MessagesGrid: React.FC<MessagesGridProps> = ({ items }) => {
  const audioControl = useAdvancedAudioControl();
  
  // Configurar container de mensagens
  useEffect(() => {
    audioControl.setMessagesContainer(containerRef.current);
  }, [audioControl]);

  // Renderizar mensagens de áudio
  const renderAttachment = (att: Attachment, messageId: string) => {
    if (att.type === 'audio') {
      return (
        <AudioMessage
          audioControl={audioControl}
          url={att.url}
          duration={att.duration}
          messageId={messageId}
        />
      );
    }
    // ... outros tipos
  };

  return (
    <Box>
      {/* Grid de mensagens */}
      <MessagesGrid items={items} />
      
      {/* Controle flutuante */}
      <FloatingAudioControl audioControl={audioControl} />
    </Box>
  );
};
```

### 3. **Estrutura de Dados**

```tsx
interface MessageItem {
  id: string;
  sender: 'attendant' | 'client' | 'bot';
  content?: string;
  timestamp: string;
  attachments?: Attachment[];
}

interface Attachment {
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  name?: string;
  size?: number;
  duration?: number; // Importante para áudios
}
```

## 🎨 Personalização

### Estilos CSS

O sistema inclui estilos CSS completos que podem ser personalizados:

```css
/* Controle de áudio individual */
.audio-message {
  /* Estilos base */
}

.audio-message.playing {
  /* Estado de reprodução */
}

/* Controle flutuante */
.floating-audio-control {
  /* Modal flutuante */
}

/* Barra de progresso */
.audio-progress-bar {
  /* Barra de progresso */
}

.audio-progress-knob {
  /* Knob arrastável */
}
```

### Temas Material-UI

Todos os componentes usam Material-UI e podem ser personalizados via `sx` prop:

```tsx
<AudioMessage
  audioControl={audioControl}
  url={att.url}
  duration={att.duration}
  messageId={messageId}
  sx={{
    // Personalizações específicas
    bgcolor: 'custom.background',
    borderColor: 'custom.border'
  }}
/>
```

## 🔧 Funcionalidades Avançadas

### 1. **Detecção de Scroll Automática**
- O sistema detecta automaticamente quando o áudio sai da tela
- Mostra/oculta o controle flutuante conforme necessário
- Performance otimizada com throttling

### 2. **Gerenciamento de Estado**
- Estado centralizado no hook
- Sincronização bidirecional entre componentes
- Cleanup automático de event listeners

### 3. **Acessibilidade**
- Suporte a teclado (ESC para fechar)
- Tooltips informativos
- Estados visuais claros

### 4. **Performance**
- Event listeners otimizados
- Renderização condicional
- Memoização de callbacks

## 🐛 Solução de Problemas

### Áudio não para quando outro inicia
- Verifique se o hook está sendo usado corretamente
- Confirme que `pauseAllOtherAudios` está sendo chamado

### Controle flutuante não aparece
- Verifique se `setMessagesContainer` foi chamado
- Confirme que o container tem `overflow-y: auto`

### Barra de progresso não funciona
- Verifique se o áudio tem `duration` válida
- Confirme que os refs estão sendo passados corretamente

## 📱 Responsividade

O sistema é totalmente responsivo:
- Controles se adaptam a diferentes tamanhos de tela
- Modal flutuante usa `90vw` com `max-width`
- Elementos se redimensionam automaticamente

## 🔮 Futuras Melhorias

- [ ] Suporte a playlists de áudio
- [ ] Cache de áudios para melhor performance
- [ ] Suporte a diferentes formatos de áudio
- [ ] Integração com sistema de notificações
- [ ] Suporte a gestos touch para dispositivos móveis

## 📄 Licença

Este sistema foi desenvolvido baseado no código do GenExus e adaptado para React/TypeScript com Material-UI.
