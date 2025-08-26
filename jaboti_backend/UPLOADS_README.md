# Configurações de Upload - Jaboti Backend

## 📁 Visão Geral

Este documento descreve as configurações de upload implementadas no backend do Jaboti para permitir o envio de arquivos de diferentes tipos e tamanhos.

## 🚀 Limites Configurados

### **Tamanho Máximo de Arquivo**
- **Atual**: 100MB (100 * 1024 * 1024 bytes)
- **Configuração**: `UPLOADS_CONFIG.MAX_FILE_SIZE`
- **Arquivo**: `src/uploads/uploads.config.ts`

### **Timeout de Upload**
- **Atual**: 5 minutos (300.000 ms)
- **Configuração**: `UPLOADS_CONFIG.UPLOAD_TIMEOUT`
- **Arquivo**: `src/uploads/uploads.config.ts`

## 📋 Tipos de Arquivo Suportados

### **🖼️ Imagens**
- JPEG, PNG, GIF, WebP, SVG
- **Uso**: Avatares, imagens de chat, documentos

### **📄 Documentos**
- PDF, Word, Excel, PowerPoint, TXT, CSV
- **Uso**: Documentos de atendimento, relatórios

### **🎵 Áudio**
- MP3, WAV, OGG, AAC, WebM
- **Uso**: Mensagens de voz, áudios de chat

### **🎥 Vídeo**
- MP4, AVI, MOV, WebM, QuickTime, WMV, FLV, 3GPP
- **Uso**: Vídeos de chat, gravações de atendimento

## ⚙️ Configurações Técnicas

### **Backend (NestJS)**
```typescript
// Limite de tamanho
fileSize: UPLOADS_CONFIG.MAX_FILE_SIZE

// Timeout
res.setTimeout(UPLOADS_CONFIG.UPLOAD_TIMEOUT)

// Body parser
express.json({ limit: '100mb' })
express.urlencoded({ limit: '100mb', extended: true })
```

### **Multer (Middleware de Upload)**
```typescript
// Validação de tipo
fileFilter: (req, file, cb) => {
  if (getAllowedMimeTypes().includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
  }
}

// Limite de tamanho
limits: {
  fileSize: UPLOADS_CONFIG.MAX_FILE_SIZE
}
```

## 🔧 Como Alterar Configurações

### **1. Alterar Tamanho Máximo**
```typescript
// Em src/uploads/uploads.config.ts
export const UPLOADS_CONFIG = {
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
  // ... outras configurações
};
```

### **2. Alterar Timeout**
```typescript
// Em src/uploads/uploads.config.ts
export const UPLOADS_CONFIG = {
  UPLOAD_TIMEOUT: 600000, // 10 minutos
  // ... outras configurações
};
```

### **3. Adicionar Novos Tipos de Arquivo**
```typescript
// Em src/uploads/uploads.config.ts
ALLOWED_MIME_TYPES: {
  VIDEO: [
    // ... tipos existentes
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/webm',
    'video/mkv', // Novo tipo
  ],
}
```

## 🚨 Solução de Problemas

### **Erro 413 (Payload Too Large)**
- **Causa**: Arquivo maior que o limite configurado
- **Solução**: Aumentar `MAX_FILE_SIZE` na configuração

### **Timeout de Upload**
- **Causa**: Upload demorando mais que o timeout configurado
- **Solução**: Aumentar `UPLOAD_TIMEOUT` na configuração

### **Tipo de Arquivo Não Permitido**
- **Causa**: MIME type não está na lista de permitidos
- **Solução**: Adicionar o MIME type em `ALLOWED_MIME_TYPES`

## 📊 Monitoramento

### **Logs de Upload**
- Todos os uploads são logados no console
- Erros de validação são capturados e reportados
- Timeouts são registrados para análise

### **Métricas Recomendadas**
- Tamanho médio dos arquivos enviados
- Tempo médio de upload
- Taxa de sucesso vs. falha
- Tipos de arquivo mais comuns

## 🔒 Segurança

### **Validações Implementadas**
- ✅ Tipo de arquivo (MIME type)
- ✅ Tamanho máximo
- ✅ Nome único para evitar conflitos
- ✅ Pasta específica por tipo de upload

### **Recomendações Adicionais**
- Implementar antivírus para uploads
- Adicionar validação de conteúdo (não apenas extensão)
- Implementar rate limiting por usuário
- Adicionar logs de auditoria

## 📝 Exemplo de Uso

### **Frontend (React)**
```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/uploads/chat', {
  method: 'POST',
  body: formData,
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### **Backend (NestJS)**
```typescript
@Post(':type')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @Param('type') type: string,
  @UploadedFile() file: Express.Multer.File
) {
  // Upload processado automaticamente pelo Multer
  // Validações aplicadas conforme configuração
}
```

## 🚀 Próximos Passos

### **Melhorias Planejadas**
- [ ] Upload em chunks para arquivos muito grandes
- [ ] Compressão automática de imagens
- [ ] Thumbnail automático para vídeos
- [ ] Integração com CDN para melhor performance
- [ ] Backup automático de uploads críticos

### **Configurações Avançadas**
- [ ] Limites diferentes por tipo de usuário
- [ ] Quotas de upload por empresa
- [ ] Retenção automática de arquivos antigos
- [ ] Criptografia de arquivos sensíveis

---

**Última atualização**: $(date)
**Versão**: 1.0.0
**Responsável**: Sistema de Uploads Jaboti
