# 🎵 Instalação do FFmpeg para Conversão de Áudio

## 📋 O que é o FFmpeg?

FFmpeg é uma ferramenta de linha de comando para conversão de áudio e vídeo. No nosso sistema, ele converte áudios WebM (gravados no navegador) para MP3 (compatível com WhatsApp).

## 🚀 Por que precisamos?

- **Frontend**: Grava áudio em WebM (formato nativo do navegador)
- **Backend**: Converte WebM → MP3 usando FFmpeg
- **WhatsApp**: Recebe MP3 nativo (sem conversão adicional)

## 💻 Instalação no Windows

### Opção 1: Chocolatey (Recomendado)
```bash
# 1. Instalar Chocolatey (se não tiver)
# Abrir PowerShell como Administrador e executar:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Instalar FFmpeg
choco install ffmpeg

# 3. Verificar instalação
ffmpeg -version
```

### Opção 2: Download Manual
1. Acessar: https://ffmpeg.org/download.html
2. Baixar versão Windows (Static Builds)
3. Extrair para `C:\ffmpeg`
4. Adicionar `C:\ffmpeg\bin` ao PATH do sistema
5. Reiniciar terminal

## 🐧 Instalação no Linux

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install ffmpeg
```

### CentOS/RHEL:
```bash
sudo yum install ffmpeg
```

### Fedora:
```bash
sudo dnf install ffmpeg
```

### Arch:
```bash
sudo pacman -S ffmpeg
```

## ✅ Verificar Instalação

### 1. Terminal/CMD:
```bash
ffmpeg -version
```

### 2. Backend (após instalar):
```bash
# Endpoint para verificar status
GET /uploads/status/converter
```

## 🔧 Configuração do Sistema

### Windows:
- **PATH**: Adicionar pasta bin do FFmpeg ao PATH
- **Reiniciar**: Terminal/IDE após adicionar ao PATH

### Linux:
- **Permissões**: FFmpeg já está no PATH por padrão
- **Dependências**: Instaladas automaticamente

## 🧪 Testar Conversão

### 1. Iniciar o backend:
```bash
npm run dev
```

### 2. Gravar áudio no frontend:
- Acessar chat
- Gravar áudio (será WebM)
- Enviar (será convertido para MP3)

### 3. Verificar logs:
```
🔄 Iniciando conversão FFmpeg: uploads/chat/audio.webm → uploads/chat/audio.mp3
✅ Conversão FFmpeg concluída: uploads/chat/audio.mp3
💾 Arquivo MP3 criado: uploads/chat/audio.mp3 (12345 bytes)
```

## 🚨 Solução de Problemas

### Erro: "FFmpeg não encontrado"
- Verificar se está no PATH
- Reiniciar terminal/IDE
- Verificar instalação: `ffmpeg -version`

### Erro: "Permissão negada"
- Windows: Executar como Administrador
- Linux: Verificar permissões de pasta

### Erro: "Timeout na conversão"
- Verificar tamanho do arquivo
- Verificar espaço em disco
- Verificar permissões de escrita

## 📁 Estrutura de Arquivos

```
uploads/
├── chat/           # Áudios do chat (WebM → MP3)
├── profile/        # Imagens de perfil
└── general/        # Outros arquivos
```

## 🔄 Fluxo de Conversão

1. **Frontend**: Grava áudio WebM
2. **Upload**: Envia WebM para backend
3. **FFmpeg**: Converte WebM → MP3
4. **Backend**: Salva MP3, remove WebM
5. **Database**: Registra arquivo MP3
6. **WhatsApp**: Recebe MP3 nativo

## 📊 Vantagens desta Abordagem

- ✅ **Backend eficiente**: Conversão otimizada
- ✅ **Frontend leve**: Sem conversores pesados
- ✅ **WhatsApp compatível**: MP3 nativo
- ✅ **Escalável**: Suporta múltiplos usuários
- ✅ **Cross-platform**: Windows e Linux

## 🆘 Suporte

Se encontrar problemas:
1. Verificar logs do backend
2. Testar comando FFmpeg no terminal
3. Verificar endpoint `/uploads/status/converter`
4. Verificar permissões de pasta e arquivos
