import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import MessagesGrid from './MessagesGrid';
import { useAdvancedAudioControl } from '../hooks/useAdvancedAudioControl';

// Dados de exemplo para demonstração
const demoMessages = [
  {
    id: '1',
    sender: 'client' as const,
    content: 'Olá! Aqui está uma mensagem de áudio:',
    timestamp: '10:30',
    attachments: [
      {
        type: 'audio' as const,
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 45
      }
    ]
  },
  {
    id: '2',
    sender: 'attendant' as const,
    content: 'Perfeito! Aqui está minha resposta em áudio:',
    timestamp: '10:32',
    attachments: [
      {
        type: 'audio' as const,
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 32
      }
    ]
  },
  {
    id: '3',
    sender: 'client' as const,
    content: 'Muito obrigado! Aqui está outro áudio mais longo:',
    timestamp: '10:35',
    attachments: [
      {
        type: 'audio' as const,
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 78
      }
    ]
  },
  {
    id: '4',
    sender: 'attendant' as const,
    content: 'Entendi perfeitamente. Aqui está minha confirmação:',
    timestamp: '10:38',
    attachments: [
      {
        type: 'audio' as const,
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 28
      }
    ]
  }
];

export const AudioControlDemo: React.FC = () => {
  console.log('🎬 AudioControlDemo renderizando');
  const [messages, setMessages] = useState(demoMessages);
  const audioControl = useAdvancedAudioControl();
  
  console.log('🎬 Mensagens carregadas:', messages.length);
  console.log('🎬 AudioControl disponível:', !!audioControl);

  const addRandomAudioMessage = () => {
    const newMessage = {
      id: Date.now().toString(),
      sender: Math.random() > 0.5 ? 'client' as const : 'attendant' as const,
      content: `Mensagem de áudio ${messages.length + 1}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      attachments: [
        {
          type: 'audio' as const,
          url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
          duration: Math.floor(Math.random() * 60) + 15
        }
      ]
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
    audioControl.closeFloatingControl();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#fafbfc' }}>
      {/* Header com controles de demonstração */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h1">
            🎵 Demonstração do Controle Avançado de Áudio
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={addRandomAudioMessage}
              size="small"
            >
              + Adicionar Áudio
            </Button>
            <Button 
              variant="outlined" 
              onClick={clearMessages}
              size="small"
              color="error"
            >
              Limpar Mensagens
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Demonstração das funcionalidades: controle de múltiplos áudios, modal flutuante, barra de progresso interativa, controle de velocidade
        </Typography>
      </Paper>

      {/* Grid de mensagens */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MessagesGrid items={messages} />
      </Box>

      {/* Instruções de uso */}
      <Paper sx={{ p: 2, mt: 2, borderRadius: 0, bgcolor: '#f8fafc' }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          📋 Instruções de Uso:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '14px', color: 'text.secondary' }}>
          <li>Clique em qualquer botão de play para reproduzir um áudio</li>
          <li>Quando um áudio toca, os outros param automaticamente</li>
          <li>Faça scroll na tela para ver o controle flutuante aparecer</li>
          <li>Use a barra de progresso para navegar no áudio (clique ou arraste)</li>
          <li>Clique no botão de velocidade para alternar entre 1x, 1.5x e 2x</li>
          <li>Use o botão de localizar para voltar à mensagem do áudio</li>
          <li>Pressione ESC para fechar o controle flutuante</li>
        </Box>
      </Paper>
    </Box>
  );
};
