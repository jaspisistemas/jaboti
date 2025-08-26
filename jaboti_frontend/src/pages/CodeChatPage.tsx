import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  saveCodeChatConfig,
  loadCodeChatConfig,
  listCodeChatKeys,
  deleteCodeChatConfig,
  type CodeChatConfig as PersistedCodeChatConfig,
} from '../utils/codechatStorage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type CodeChatConfig = {
  baseUrl: string;
  instanceName: string;
  bearerToken: string;
  apikey?: string; // Optional API key header value
  defaultNumber?: string; // Convenience default phone number
  groupJid?: string; // Convenience default groupJid
};

type RunResult = {
  ok: boolean;
  status: number;
  data: any;
  error?: string;
};

function padBase64(s: string): string {
  // Remove whitespace/newlines and ensure length multiple of 4
  const clean = s.replace(/\s+/g, '');
  const padLen = (4 - (clean.length % 4)) % 4;
  return clean + '='.repeat(padLen);
}

function toBase64Buffer(b64: string): ArrayBuffer {
  try {
    const raw = b64.includes(',') && b64.startsWith('data:') ? b64.split(',')[1] : b64;
    const clean = padBase64(raw);
    const bin = atob(clean);
    const buffer = new ArrayBuffer(bin.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i) & 0xff;
    return buffer;
  } catch {
    return new ArrayBuffer(0);
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'text/plain': 'txt',
  };
  return map[mime] || '';
}

const storageKey = 'codechat.config'; // legacy localStorage for backward-compat

const JsonViewer: React.FC<{ value: any }> = ({ value }) => {
  const text = useMemo(() => {
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }, [value]);
  return (
    <TextField
      fullWidth
      multiline
      minRows={8}
      maxRows={24}
      value={text}
      InputProps={{ readOnly: true, sx: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' } }}
    />
  );
};

const RequestRunner: React.FC<{
  title: string;
  method: HttpMethod;
  pathTemplate: string; // e.g., '/message/sendText/:instanceName'
  config: CodeChatConfig;
  bodySample?: any;
  queryParams?: Record<string, string | number | undefined>;
  useFormData?: boolean; // if true, show a file picker and send as multipart
  onAfterResponse?: (res: RunResult) => void;
}> = ({ title, method, pathTemplate, config, bodySample, queryParams, useFormData, onAfterResponse }) => {
  const [path, setPath] = useState(pathTemplate);
  const [body, setBody] = useState(JSON.stringify(bodySample ?? {}, null, 2));
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [forceJsonContent, setForceJsonContent] = useState(!useFormData);

  useEffect(() => { setPath(pathTemplate); }, [pathTemplate]);
  useEffect(() => { setBody(JSON.stringify(bodySample ?? {}, null, 2)); }, [bodySample]);

  const run = async () => {
    setBusy(true);
    setRes(null);
    try {
      let url = `${config.baseUrl}${path.replace(':instanceName', encodeURIComponent(config.instanceName))}`;
      const qp = new URLSearchParams();
      Object.entries(queryParams || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v).length) qp.set(k, String(v)); });
      if ([...qp.keys()].length) url += `?${qp.toString()}`;

      const headers: Record<string, string> = {};
      if (config.bearerToken) headers['Authorization'] = `Bearer ${config.bearerToken}`;
      if (config.apikey) headers['apikey'] = config.apikey;

      let fetchBody: BodyInit | undefined;
      if (method !== 'GET' && method !== 'DELETE') {
        if (useFormData && !forceJsonContent) {
          const form = new FormData();
          // Try to parse body as JSON and append each key as text
          try {
            const parsed = JSON.parse(body ?? '{}');
            Object.entries(parsed).forEach(([k, v]) => {
              if (v === undefined || v === null) return;
              if (typeof v === 'object') form.append(k, JSON.stringify(v)); else form.append(k, String(v));
            });
          } catch {
            // ignore
          }
          if (file) form.append('file', file);
          fetchBody = form;
        } else {
          headers['Content-Type'] = 'application/json';
          fetchBody = body ?? '{}';
        }
      }

      const resp = await fetch(url, { method, headers, body: fetchBody });
      const text = await resp.text();
      let data: any = text;
      try { data = text ? JSON.parse(text) : null; } catch { /* text remains */ }
      const result: RunResult = { ok: resp.ok, status: resp.status, data, error: resp.ok ? undefined : (typeof data === 'string' ? data : JSON.stringify(data)) };
      setRes(result);
      onAfterResponse?.(result);
    } catch (e: any) {
      setRes({ ok: false, status: 0, data: null, error: e?.message || 'Erro ao executar' });
    } finally {
      setBusy(false);
    }
  };

  const copyCurl = () => {
    let url = `${config.baseUrl}${path.replace(':instanceName', encodeURIComponent(config.instanceName))}`;
    const qp = new URLSearchParams();
    Object.entries(queryParams || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && String(v).length) qp.set(k, String(v)); });
    if ([...qp.keys()].length) url += `?${qp.toString()}`;
    const headers: string[] = [];
    if (config.bearerToken) headers.push(`-H "Authorization: Bearer ${config.bearerToken}"`);
    if (config.apikey) headers.push(`-H "apikey: ${config.apikey}"`);
    let bodyPart = '';
    if (method !== 'GET' && method !== 'DELETE') {
      if (useFormData && !forceJsonContent) {
        bodyPart = `-F "file=@/path/to/file"`;
      } else {
        headers.push(`-H "Content-Type: application/json"`);
        bodyPart = `--data '${body.replaceAll("'", "'\\''")}'`;
      }
    }
    const cmd = `curl -X ${method} ${headers.join(' ')} ${bodyPart} "${url}"`;
    navigator.clipboard.writeText(cmd);
  };

  // Auto-detect base64 payload and offer download button
  const base64Meta = useMemo(() => {
    const d = res?.data;
    if (!d || typeof d !== 'object') return null;
    const media = (d as any).media as string | undefined;
    if (!media || typeof media !== 'string' || media.length < 16) return null;
    const name = (d as any).fileName || (() => {
      const ext = extFromMime((d as any).mimetype || '');
      return `arquivo${ext ? '.' + ext : '.bin'}`;
    })();
    const mime = (d as any).mimetype || 'application/octet-stream';
    return { media, name, mime };
  }, [res]);

  const downloadBase64 = () => {
    if (!base64Meta) return;
  const buffer = toBase64Buffer(base64Meta.media);
  const blob = new Blob([buffer], { type: base64Meta.mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = base64Meta.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Copiar cURL (aproximado)"><IconButton onClick={copyCurl}><ContentCopyIcon fontSize="small"/></IconButton></Tooltip>
          <Button variant="contained" size="small" onClick={run} disabled={busy}>{busy ? 'Executando…' : 'Executar'}</Button>
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
        <TextField label="Caminho" value={path} onChange={(e) => setPath(e.target.value)} helperText=":instanceName será substituído pelo valor da configuração" />
        {(method !== 'GET' && method !== 'DELETE') && !useFormData && (
          <TextField label="Body (JSON)" value={body} onChange={(e) => setBody(e.target.value)} multiline minRows={6} />
        )}
        {(method !== 'GET' && method !== 'DELETE') && useFormData && (
          <>
            <TextField label="Campos (JSON) para multipart" value={body} onChange={(e) => setBody(e.target.value)} multiline minRows={4} />
            <Box>
              <Button component="label" variant="outlined">Selecionar arquivo<input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button>
              <Typography variant="caption" sx={{ ml: 1 }}>{file?.name || 'Nenhum arquivo selecionado'}</Typography>
            </Box>
            <FormControlLabel control={<Switch size="small" checked={forceJsonContent} onChange={(e) => setForceJsonContent(e.target.checked)} />} label="Forçar Content-Type: application/json (desativa multipart)" />
          </>
        )}
      </Box>
      {res && (
        <Box sx={{ mt: 2 }}>
          <Alert severity={res.ok ? 'success' : 'error'} sx={{ mb: 1 }}>HTTP {res.status} {res.error ? `- ${res.error}` : ''}</Alert>
          <JsonViewer value={res.data} />
          {base64Meta && (
            <Button startIcon={<DownloadIcon/>} sx={{ mt: 1 }} variant="outlined" onClick={downloadBase64}>Baixar arquivo (base64)</Button>
          )}
        </Box>
      )}
    </Box>
  );
};

const SectionTitle: React.FC<{ title: string; chip?: string }> = ({ title, chip }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
    <Typography variant="h6" fontWeight={700}>{title}</Typography>
    {chip ? <Chip size="small" label={chip} /> : null}
  </Box>
);

const CodeChatPage: React.FC = () => {
  const [cfg, setCfg] = useState<CodeChatConfig>(() => {
    try { return (JSON.parse(localStorage.getItem(storageKey) || '{}') as CodeChatConfig); } catch { return {} as CodeChatConfig; }
  });
  const [profileName, setProfileName] = useState<string>('default');
  const [profiles, setProfiles] = useState<string[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const refreshProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const keys = await listCodeChatKeys();
      setProfiles(keys);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => { refreshProfiles(); }, []);

  const saveCfg = async () => {
    // Save both to IndexedDB (by profile) and legacy localStorage
    const key = profileName?.trim() || 'default';
    await saveCodeChatConfig(key, cfg as PersistedCodeChatConfig);
    localStorage.setItem(storageKey, JSON.stringify(cfg));
    await refreshProfiles();
  };

  const loadCfg = async (key: string) => {
    const loaded = await loadCodeChatConfig(key);
    if (loaded) {
      setCfg(loaded);
      setProfileName(key);
      localStorage.setItem(storageKey, JSON.stringify(loaded));
    }
  };

  const deleteCfg = async (key: string) => {
    await deleteCodeChatConfig(key);
    if (key === profileName) {
      setProfileName('default');
    }
    await refreshProfiles();
  };

  const isCfgValid = cfg.baseUrl && cfg.instanceName;

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" fontWeight={800}>CodeChat API</Typography>
      <Typography variant="body2" color="text.secondary">Manipule endpoints da CodeChat. Configure os valores globais abaixo e execute os métodos. As respostas são mostradas como JSON; quando houver base64 de arquivo, disponibilizamos o download.</Typography>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
        <SectionTitle title="Configuração Global" />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: 2 }}>
          <TextField label="Perfil" placeholder="default" value={profileName} onChange={(e) => setProfileName(e.target.value)} helperText="Nome do perfil para salvar/carregar no banco" />
          <TextField label="Base URL" placeholder="http://chat.jaspi.com.br:2607" value={cfg.baseUrl || ''} onChange={(e) => setCfg({ ...cfg, baseUrl: e.target.value.trim() })} />
          <TextField label="Instance Name" placeholder="Jaspi OFICIAL" value={cfg.instanceName || ''} onChange={(e) => setCfg({ ...cfg, instanceName: e.target.value })} />
          <TextField label="Bearer Token" placeholder="Token" value={cfg.bearerToken || ''} onChange={(e) => setCfg({ ...cfg, bearerToken: e.target.value })} />
          <TextField label="API Key (opcional)" placeholder="globalApikey" value={cfg.apikey || ''} onChange={(e) => setCfg({ ...cfg, apikey: e.target.value })} />
          <TextField label="Número padrão (opcional)" placeholder="559999999999" value={cfg.defaultNumber || ''} onChange={(e) => setCfg({ ...cfg, defaultNumber: e.target.value })} />
          <TextField label="Group JID (opcional)" placeholder="123@g.us" value={cfg.groupJid || ''} onChange={(e) => setCfg({ ...cfg, groupJid: e.target.value })} />
        </Box>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button startIcon={<SaveIcon/>} variant="contained" onClick={saveCfg} disabled={!isCfgValid}>Salvar no banco</Button>
          <Tooltip title="Carregar perfil salvo">
            <TextField select label="Perfis" SelectProps={{ native: true }} sx={{ width: 240 }} value="" onChange={(e) => { const k = e.target.value; if (k) loadCfg(k); }}>
              <option value="" disabled>{loadingProfiles ? 'Carregando…' : 'Escolher…'}</option>
              {profiles.map(k => (<option key={k} value={k}>{k}</option>))}
            </TextField>
          </Tooltip>
          <Tooltip title="Excluir perfil selecionado">
            <IconButton color="error" onClick={() => { if (profileName) deleteCfg(profileName); }}><DeleteIcon/></IconButton>
          </Tooltip>
          {!isCfgValid && <Alert severity="warning" sx={{ ml: 1, flex: 1 }}>Informe ao menos Base URL e Instance Name.</Alert>}
        </Box>
      </Box>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="Instance Controller" chip="/instance/*" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="Create Instance" method="POST" pathTemplate="/instance/create" config={cfg} bodySample={{ instanceName: cfg.instanceName }} />
          <RequestRunner title="Fetch Instances" method="GET" pathTemplate={`/instance/fetchInstances`} config={cfg} queryParams={{ instanceName: cfg.instanceName }} />
          <RequestRunner title="Instance Connect" method="GET" pathTemplate="/instance/connect/:instanceName" config={cfg} />
          <RequestRunner title="Connection Status" method="GET" pathTemplate="/instance/connectionState/:instanceName" config={cfg} />
          <RequestRunner title="Logout Instance" method="DELETE" pathTemplate="/instance/logout/:instanceName" config={cfg} />
          <RequestRunner title="Delete Instance" method="DELETE" pathTemplate="/instance/delete/:instanceName" config={cfg} />
          {/* QrCode path varies by server; keep editable */}
          <RequestRunner title="View QR Code (ajuste o caminho se necessário)" method="GET" pathTemplate="/instance/qrcode/:instanceName" config={cfg} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="Send Message Controller" chip="/message/*" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="Send Text" method="POST" pathTemplate="/message/sendText/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', options: { presence: 'recording' }, textMessage: { text: 'Olá' } }} />
          <RequestRunner title="Send Media" method="POST" pathTemplate="/message/sendMedia/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', mediaMessage: { mediatype: 'document', fileName: 'file.pdf', caption: '', media: 'https://example.com/file.pdf' } }} />
          <RequestRunner title="Send Media File (multipart)" method="POST" pathTemplate="/message/sendMediaFile/:instanceName" config={cfg} useFormData bodySample={{ number: cfg.defaultNumber || '', mediatype: 'document', fileName: 'file.pdf', caption: '' }} />
          <RequestRunner title="Send Location" method="POST" pathTemplate="/message/sendLocation/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', options: { delay: 0, presence: 'paused' }, locationMessage: { name: 'Local', address: 'Rua X', latitude: -23.5, longitude: -46.6 } }} />
          <RequestRunner title="Send Contact" method="POST" pathTemplate="/message/sendContact/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', options: {}, contactMessage: [{ fullName: 'Contato 1', wuid: '5531988882222', phoneNumber: '+55 31 9 8888-2222' }] }} />
          <RequestRunner title="Send Reaction" method="POST" pathTemplate="/message/sendReaction/:instanceName" config={cfg} bodySample={{ reactionMessage: { key: { remoteJid: '123@s.whatsapp.net', fromMe: false, id: 'MSG_ID' }, reaction: '👍' } }} />
          <RequestRunner title="Send WhatsApp Audio (URL)" method="POST" pathTemplate="/message/sendWhatsAppAudio/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', options: { delay: 0 }, audioMessage: { audio: 'https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav' } }} />
          <RequestRunner title="Send WhatsApp Audio (arquivo)" method="POST" pathTemplate="/message/sendWhatsAppAudioFile/:instanceName" config={cfg} useFormData bodySample={{ number: cfg.defaultNumber || '' }} />
          <RequestRunner title="Send Buttons" method="POST" pathTemplate="/message/sendButtons/:instanceName" config={cfg} bodySample={{ number: cfg.defaultNumber || '', buttonMessage: { title: 'Título', description: 'Descrição', footerText: 'Rodapé', buttons: [{ buttonText: '1', buttonId: '1' }, { buttonText: '2', buttonId: '2' }], mediaMessage: { mediatype: 'image', fileName: 'image.png', media: 'https://picsum.photos/seed/cc/400/200' } } }} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="Chat Controller" chip="/chat/*" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="WhatsApp Number" method="POST" pathTemplate="/chat/whatsappNumbers/:instanceName" config={cfg} bodySample={{ numbers: [cfg.defaultNumber || ''] }} />
          <RequestRunner title="Read Messages" method="PUT" pathTemplate="/chat/markMessageAsRead/:instanceName" config={cfg} bodySample={{ readMessages: [{ remoteJid: '123@s.whatsapp.net', fromMe: false, id: 'MSG_ID' }] }} />
          <RequestRunner title="Archive Chat" method="PUT" pathTemplate="/chat/archiveChat/:instanceName" config={cfg} bodySample={{ lastMessage: { key: { remoteJid: '123@s.whatsapp.net', fromMe: false, id: 'MSG_ID' } }, archive: true }} />
          <RequestRunner title="Delete Message" method="DELETE" pathTemplate="/chat/deleteMessageForEveryone/:instanceName" config={cfg} bodySample={{ remoteJid: '123@s.whatsapp.net', fromMe: false, id: 'MSG_ID', paticipant: '' }} />
          <RequestRunner title="Fetch Profile Picture" method="POST" pathTemplate="/chat/fetchProfilePictureUrl/:instanceName" config={cfg} bodySample={{ number: `${cfg.defaultNumber || ''}@s.whatsapp.net` }} />
          <RequestRunner title="Find Contacts" method="POST" pathTemplate="/chat/findContacts/:instanceName" config={cfg} bodySample={{ where: { id: 'CONTACT_ID' } }} />
          <RequestRunner title="Get Base64 From Media Message" method="POST" pathTemplate="/chat/getBase64FromMediaMessage/:instanceName" config={cfg} bodySample={{ key: { id: 'MSG_ID' } }} />
          <RequestRunner title="Find Messages" method="POST" pathTemplate="/chat/findMessages/:instanceName" config={cfg} bodySample={{ where: { key: { remoteJid: '123@s.whatsapp.net', fromMe: false, id: 'MSG_ID' }, "message.[...]": {} }, limit: 10 }} />
          <RequestRunner title="Find Status Message" method="POST" pathTemplate="/chat/findStatusMessage/:instanceName" config={cfg} bodySample={{ where: { id: 'STATUS_ID' } }} />
          <RequestRunner title="Find Chats" method="GET" pathTemplate="/chat/findChats/:instanceName" config={cfg} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="Group Controller" chip="/group/*" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="Create Group" method="POST" pathTemplate="/group/create/:instanceName" config={cfg} bodySample={{ subject: 'Novo Grupo', description: 'Descrição', participants: [cfg.defaultNumber ? `${cfg.defaultNumber}@s.whatsapp.net` : ''] }} />
          <RequestRunner title="Update Group Picture" method="PUT" pathTemplate="/group/updateGroupPicture/:instanceName" config={cfg} bodySample={{ image: 'https://picsum.photos/seed/g/600/600' }} queryParams={{ groupJid: cfg.groupJid || '' }} />
          <RequestRunner title="Find Group" method="GET" pathTemplate="/group/findGroupInfos/:instanceName" config={cfg} queryParams={{ groupJid: cfg.groupJid || '' }} />
          <RequestRunner title="Find Participants" method="GET" pathTemplate="/group/participants/:instanceName" config={cfg} queryParams={{ groupJid: cfg.groupJid || '' }} />
          <RequestRunner title="Invite Code" method="GET" pathTemplate="/group/inviteCode/:instanceName" config={cfg} queryParams={{ groupJid: cfg.groupJid || '' }} />
          <RequestRunner title="Revoke Invite Code" method="PUT" pathTemplate="/group/revokeInviteCode/:instanceName" config={cfg} queryParams={{ groupJid: cfg.groupJid || '' }} />
          <RequestRunner title="Update Participant" method="PUT" pathTemplate="/group/updateParticipant/:instanceName" config={cfg} bodySample={{ action: 'add', participants: [cfg.defaultNumber ? `${cfg.defaultNumber}@s.whatsapp.net` : ''] }} />
          <RequestRunner title="Leave Group" method="DELETE" pathTemplate="/group/leaveGroup/:instanceName" config={cfg} queryParams={{ groupJid: cfg.groupJid || '' }} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="JWT" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="Refresh Token" method="PUT" pathTemplate="/instance/refreshToken/" config={cfg} bodySample={{ oldToken: cfg.bearerToken || '' }} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon/>}><SectionTitle title="Webhook" chip="/webhook/*" /></AccordionSummary>
        <AccordionDetails>
          <RequestRunner title="Set Webhook" method="POST" pathTemplate="/webhook/set/:instanceName" config={cfg} bodySample={{ enabled: true, url: 'https://chat.jaspi.com.br/whatsapi.codechatauth.aspx' }} />
          <RequestRunner title="Find Webhook" method="GET" pathTemplate="/webhook/find/:instanceName" config={cfg} />
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 2 }} />

      <Box>
        <SectionTitle title="Utilitários" chip="offline" />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Teste de download a partir de um JSON local (ex.: cole aqui o conteúdo do getBase64.json). Colar o JSON abaixo e clicar em Baixar.</Typography>
        <TextField id="util-base64-json" label="JSON com campos media (base64), mimetype e fileName" multiline minRows={6} fullWidth />
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon/>} onClick={() => {
            try {
              const el = document.getElementById('util-base64-json') as HTMLInputElement | HTMLTextAreaElement | null;
              const parsed = JSON.parse(el?.value || '{}');
              const media = parsed.media as string; const mt = parsed.mimetype || 'application/octet-stream';
              const name = parsed.fileName || (() => { const ext = extFromMime(mt); return `arquivo${ext ? '.' + ext : '.bin'}`; })();
              if (!media) throw new Error('Campo "media" ausente');
              const buffer = toBase64Buffer(media);
              const blob = new Blob([buffer], { type: mt });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
            } catch (e: any) {
              alert('Falha ao processar JSON/base64: ' + (e?.message || 'Erro'));
            }
          }}>Baixar de JSON</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default CodeChatPage;
