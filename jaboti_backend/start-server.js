const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando JABOTI Backend na porta 3523...');

// Configurar variáveis de ambiente
process.env.PORT = '3523';
process.env.NODE_ENV = 'development';

// Caminho para o arquivo principal
const mainPath = path.join(__dirname, 'dist', 'src', 'main.js');

console.log(`📁 Executando: ${mainPath}`);

// Iniciar a aplicação
const app = spawn('node', [mainPath], {
  stdio: 'inherit',
  env: process.env,
});

// Capturar eventos
app.on('error', (error) => {
  console.error('❌ Erro ao iniciar aplicação:', error.message);
  process.exit(1);
});

app.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Aplicação encerrada com código: ${code}`);
    process.exit(code);
  }
});

// Capturar sinais de interrupção
process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando aplicação...');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando aplicação...');
  app.kill('SIGTERM');
});

console.log('✅ Script de inicialização configurado');
console.log('📡 A API estará disponível em: http://localhost:3523');
console.log('📚 Swagger docs em: http://localhost:3523/docs');
