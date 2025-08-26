const fs = require('fs');
const path = require('path');

// Simular um arquivo de teste
const testFilePath = path.join(__dirname, 'test-image.jpg');

// Verificar se o arquivo de teste existe
if (!fs.existsSync(testFilePath)) {
  console.log('❌ Arquivo de teste não encontrado. Criando um arquivo dummy...');
  
  // Criar um arquivo dummy para teste
  const dummyContent = Buffer.from('fake image content');
  fs.writeFileSync(testFilePath, dummyContent);
  console.log('✅ Arquivo dummy criado:', testFilePath);
}

console.log('🧪 Script de teste de upload criado!');
console.log('');
console.log('📋 Para testar o upload:');
console.log('1. Certifique-se de que o backend está rodando (npm run start:dev)');
console.log('2. Acesse o frontend e tente criar/editar um contato');
console.log('3. Selecione uma foto e clique em Salvar');
console.log('4. Verifique se a foto foi salva na pasta uploads/profile-photos/');
console.log('');
console.log('🔍 Endpoints disponíveis:');
console.log('- POST /uploads/profile-photos - Upload de fotos de perfil');
console.log('- GET /uploads/profile-photos/:filename - Acessar foto');
console.log('- DELETE /uploads/:id - Deletar arquivo');
console.log('');
console.log('📁 Estrutura de pastas criada:');
console.log('uploads/');
console.log('  ├── profile-photos/');
console.log('  ├── chat-media/');
console.log('  ├── documents/');
console.log('  ├── attachments/');
console.log('  └── general/');
console.log('');
console.log('💡 Dica: Verifique os logs do backend para ver se o upload está funcionando!');
