const fs = require('fs');
const path = require('path');

// Diretórios base
const baseDir = path.join(__dirname, '..', 'uploads');

// Tipos de upload
const uploadTypes = [
  'profile-photos',
  'chat-media', 
  'documents',
  'attachments',
  'general'
];

// Criar diretório base
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
  console.log('✅ Diretório base de uploads criado:', baseDir);
}

// Criar subdiretórios
uploadTypes.forEach(type => {
  const dirPath = path.join(baseDir, type);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log('✅ Diretório criado:', dirPath);
  } else {
    console.log('ℹ️  Diretório já existe:', dirPath);
  }
});

// Criar .gitkeep para manter as pastas no git
uploadTypes.forEach(type => {
  const gitkeepPath = path.join(baseDir, type, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log('✅ .gitkeep criado em:', gitkeepPath);
  }
});

console.log('\n🎉 Estrutura de diretórios de upload criada com sucesso!');
console.log('\n📁 Estrutura criada:');
console.log('uploads/');
uploadTypes.forEach(type => {
  console.log(`  ├── ${type}/`);
  console.log(`  │   └── .gitkeep`);
});
console.log('\n💡 Agora você pode fazer upload de arquivos para cada tipo específico!');
