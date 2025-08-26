const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const chatDirs = [
  'chat',
  'profile'
];

console.log('Criando diretórios de upload para chat...');

// Criar diretório principal de uploads se não existir
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Diretório uploads/ criado');
}

// Criar diretórios específicos para chat
chatDirs.forEach(dir => {
  const fullPath = path.join(uploadsDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Diretório uploads/${dir}/ criado`);
  } else {
    console.log(`- Diretório uploads/${dir}/ já existe`);
  }
  
  // Criar .gitkeep para manter os diretórios no git
  const gitkeepPath = path.join(fullPath, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '');
    console.log(`  ✓ .gitkeep criado em uploads/${dir}/`);
  }
});

console.log('\n✅ Diretórios de upload para chat criados com sucesso!');
console.log('\nEstrutura criada:');
console.log('uploads/');
chatDirs.forEach(dir => {
  console.log(`  └── ${dir}/`);
});
