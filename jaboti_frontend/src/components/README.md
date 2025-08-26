# Componente AudioRecorder

Este componente permite gravar e enviar mensagens de áudio no chat, com funcionalidades de pausa, retomada e cancelamento.

## Funcionalidades

- **Gravação de áudio**: Captura áudio do microfone do usuário
- **Contador em tempo real**: Mostra a duração da gravação
- **Pausa/Retomada**: Permite pausar e continuar a gravação
- **Envio de áudio**: Envia o áudio gravado para o servidor
- **Cancelamento**: Permite cancelar a gravação
- **Tratamento de erros**: Exibe mensagens de erro e permite tentar novamente

## Como Usar

### 1. Importar o componente

```tsx
import { AudioRecorder } from './components/AudioRecorder'
```

### 2. Usar no JSX

```tsx
<AudioRecorder
  onSendAudio={handleSendAudio}
  onCancel={handleCancel}
  isVisible={true}
/>
```

### 3. Implementar as funções de callback

```tsx
const handleSendAudio = (audioBlob: Blob) => {
  // Enviar o áudio para o servidor
  console.log('Áudio recebido:', audioBlob)
}

const handleCancel = () => {
  // Lógica para cancelar a gravação
  console.log('Gravação cancelada')
}
```

## Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `onSendAudio` | `(audioBlob: Blob) => void` | Função chamada quando o usuário envia o áudio |
| `onCancel` | `() => void` | Função chamada quando o usuário cancela a gravação |
| `isVisible` | `boolean` | Controla se o componente deve ser exibido |

## Estados do Componente

### 1. Estado Padrão
- **Botões de anexo**: Sempre visíveis (📎 para documentos, 📷 para fotos/vídeos)
- **Input de texto**: Sempre visível para digitar mensagens
- **Gravador de áudio**: Sempre visível (botão de microfone)

### 2. Gravando
- **Botões de anexo**: Permanecem visíveis e funcionais
- **Input de texto**: Permanece visível e funcional
- **Gravador**: Mostra contador de duração e botão de pausa

### 3. Pausado
- **Botões de anexo**: Permanecem visíveis e funcionais
- **Input de texto**: Permanece visível e funcional
- **Gravador**: Mostra botões para:
  - Continuar gravação (play)
  - Enviar áudio (paper-plane)
  - Cancelar gravação (trash)

### 4. Erro
- Exibe mensagem de erro
- Mostra botão para tentar novamente

## Integração com o Chat

O componente foi integrado ao `ChatMessages.tsx` com as seguintes funcionalidades:

- **Interface sempre visível**: Botões de anexo, input de texto e gravador de áudio são sempre exibidos simultaneamente
- **Alternância inteligente**: O botão de enviar texto aparece quando há texto, o gravador de áudio quando não há texto
- **Envio para API**: Integrado com a função `handleSendAudioMessage` para enviar áudios para o servidor

## Estilos

O componente usa CSS customizado com:
- Cores consistentes com o design do chat
- Animações suaves (pulse para o microfone)
- Layout responsivo
- Estados visuais claros para cada situação

## Dependências

- **useAudioRecorder**: Hook personalizado para gerenciar a gravação
- **MediaRecorder API**: Para captura de áudio
- **Font Awesome**: Para ícones (microfone, play, pause, etc.)

## Exemplo Completo

Veja o arquivo `AudioRecorder.example.tsx` para um exemplo completo de uso e demonstração das funcionalidades.

## Notas Técnicas

- O áudio é gravado no formato WebM
- A duração é atualizada a cada 100ms para suavidade
- URLs de objetos são limpas automaticamente para evitar vazamentos de memória
- O componente é responsivo e se adapta ao layout do chat
