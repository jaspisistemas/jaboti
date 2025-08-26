import CloseIcon from '@mui/icons-material/Close';
import FlipIcon from '@mui/icons-material/Flip';
import ImageIcon from '@mui/icons-material/Image';
import ReplayIcon from '@mui/icons-material/Replay';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { AudioMessage } from './AudioMessage';

export type Attachment = {
  type: 'image' | 'video' | 'file' | 'audio';
  url: string;
  name?: string;
  size?: number;
  duration?: number;
};

export type MessageItem = {
  id: string;
  sender: 'attendant' | 'client' | 'bot';
  content?: string;
  timestamp: string; // already formatted for now
  avatarUrl?: string;
  attachments?: Attachment[];
  replyTo?: { id: string; content: string };
  status?: 'sent' | 'delivered' | 'read';
  session?: { type: 'start' | 'end' | 'private'; text?: string };
};

interface MessagesGridProps {
  items: MessageItem[];
}

const isNearBottom = (el: HTMLElement, threshold = 120) => {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
};

const MessagesGrid: React.FC<MessagesGridProps> = ({ items }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);
  const [viewerFlipX, setViewerFlipX] = useState(false);
  const [viewerFlipY, setViewerFlipY] = useState(false);

  // Auto scroll on new messages when near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const near = isNearBottom(el);
    if (near) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
      setShowNewIndicator(false);
    } else {
      setShowNewIndicator(true);
    }
  }, [items]);

  // Scroll listener for button/indicator visibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const near = isNearBottom(el);
      setShowScrollBtn(!near);
      if (near) setShowNewIndicator(false);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setShowNewIndicator(false);
  };

  const renderAttachment = (att: Attachment, messageId: string) => {
    console.log('🔗 Renderizando anexo:', att.type, att.url);

    if (att.type === 'image') {
      return (
        <Box
          className="image-attachment"
          sx={{ mt: 1, cursor: 'pointer', maxWidth: 300 }}
          onClick={() => {
            setViewerSrc(att.url);
            setViewerOpen(true);
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={att.url} alt={att.name || 'image'} style={{ width: '100%', borderRadius: 8 }} />
        </Box>
      );
    }
    if (att.type === 'video') {
      return (
        <Box className="video-attachment" sx={{ mt: 1, maxWidth: 320 }}>
          <video src={att.url} controls style={{ width: '100%', borderRadius: 8 }} />
        </Box>
      );
    }
    if (att.type === 'file') {
      return (
        <Box
          className="file-attachment"
          sx={{ mt: 1, p: 1.2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          onClick={() => window.open(att.url, '_blank')}
        >
          <ImageIcon sx={{ mr: 1 }} />
          <Typography variant="body2" sx={{ mr: 1 }}>
            {att.name || 'arquivo'}
          </Typography>
          {att.size ? (
            <Chip size="small" label={`${Math.round((att.size / 1024 / 1024) * 10) / 10} MB`} />
          ) : null}
        </Box>
      );
    }
    if (att.type === 'audio') {
      console.log('🎵 Renderizando mensagem de áudio:', att.url);
      return <AudioMessage url={att.url} duration={att.duration} messageId={messageId} />;
    }
    return null;
  };

  console.log('Renderizando MessagesGrid com', items.length, 'mensagens');

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* New messages indicator */}
      {showNewIndicator && (
        <Box
          onClick={handleScrollToBottom}
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'primary.main',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            zIndex: 2,
            cursor: 'pointer',
            fontSize: 12,
            boxShadow: 3,
          }}
        >
          Novas mensagens
        </Box>
      )}

      {/* Messages container */}
      <Box
        ref={containerRef}
        className="messages-container"
        sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#fafbfc' }}
      >
        {items.map((m) => (
          <React.Fragment key={m.id}>
            {m.session ? (
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Chip
                  size="small"
                  color={m.session.type === 'private' ? 'warning' : 'default'}
                  label={
                    m.session.text ||
                    (m.session.type === 'start'
                      ? 'Início da sessão'
                      : m.session.type === 'end'
                        ? 'Fim da sessão'
                        : 'Sessão privada')
                  }
                />
              </Box>
            ) : (
              <Box
                id={`msg-${m.id}`}
                className={`message ${m.sender === 'attendant' ? 'sent' : 'received'}`}
                sx={{
                  display: 'flex',
                  justifyContent: m.sender === 'attendant' ? 'flex-end' : 'flex-start',
                  mb: 1.5,
                }}
              >
                <Box
                  className="message-content"
                  sx={{ maxWidth: '70%', display: 'flex', flexDirection: 'column' }}
                >
                  {m.replyTo && (
                    <Box
                      className="reply-message"
                      sx={{
                        borderLeft: '3px solid',
                        borderColor: 'primary.light',
                        bgcolor: 'action.hover',
                        color: 'text.primary',
                        p: 1,
                        mb: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        const el = document.getElementById(`msg-${m.replyTo!.id}`);
                        if (el && containerRef.current) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el.classList.add('highlight-blink');
                          setTimeout(() => el.classList.remove('highlight-blink'), 1500);
                        }
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Resposta a
                      </Typography>
                      <Typography variant="body2">{m.replyTo.content}</Typography>
                    </Box>
                  )}
                  {!!m.content && (
                    <Box
                      className="message-bubble"
                      sx={{
                        px: 1.5,
                        py: 1.2,
                        borderRadius: 2,
                        bgcolor: m.sender === 'attendant' ? 'primary.main' : 'background.paper',
                        color: m.sender === 'attendant' ? '#fff' : 'text.primary',
                        boxShadow: 0,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
                      >
                        {m.content}
                      </Typography>
                    </Box>
                  )}
                  {m.attachments?.map((att, idx) => (
                    <React.Fragment key={`${m.id}-att-${idx}`}>
                      {renderAttachment(att, m.id)}
                    </React.Fragment>
                  ))}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: 'flex',
                      justifyContent: m.sender === 'attendant' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {m.timestamp}
                  </Typography>
                </Box>
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <Button
          variant="contained"
          onClick={handleScrollToBottom}
          sx={{
            position: 'absolute',
            right: 16,
            bottom: 96,
            borderRadius: '50%',
            minWidth: 0,
            width: 40,
            height: 40,
            p: 0,
          }}
        >
          ↓
        </Button>
      )}

      {/* Controle flutuante de áudio avançado */}
      {/* Removed FloatingAudioControl */}

      {/* Image viewer overlay */}
      {viewerOpen && viewerSrc && (
        <Box
          onClick={() => setViewerOpen(false)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh' }}
          >
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              src={viewerSrc}
              alt="viewer"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                transform: `translateZ(0) scale(${viewerZoom}) rotate(${viewerRotation}deg) ${viewerFlipX ? 'scaleX(-1)' : ''} ${viewerFlipY ? 'scaleY(-1)' : ''}`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 2,
                boxShadow: 3,
                p: 1,
                display: 'flex',
                gap: 1,
              }}
            >
              <IconButton size="small" onClick={() => setViewerZoom((z) => z * 1.2)}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setViewerZoom((z) => Math.max(0.5, z / 1.2))}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setViewerRotation((r) => r + 90)}>
                <ReplayIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setViewerFlipX((v) => !v)}>
                <FlipIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setViewerFlipY((v) => !v)}>
                <FlipIcon sx={{ transform: 'rotate(90deg)' }} fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setViewerZoom(1);
                  setViewerRotation(0);
                  setViewerFlipX(false);
                  setViewerFlipY(false);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MessagesGrid;
