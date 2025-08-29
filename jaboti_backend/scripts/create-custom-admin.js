const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createCustomAdminUser() {
  const prisma = new PrismaClient();

  try {
    console.log('🚀 Criando usuário administrador personalizado...\n');

    // Coletar informações do usuário
    const name = (await question('Nome completo: ')) || 'Administrador do Sistema';
    const username = (await question('Username (deixe vazio para "admin"): ')) || 'admin';
    const email = (await question('Email: ')) || 'admin@jaboti.com';
    const phone =
      (await question('Telefone (deixe vazio para +5511999999999): ')) || '+5511999999999';
    const password = (await question('Senha (deixe vazio para "admin123"): ')) || 'admin123';
    const companyName =
      (await question('Nome da empresa (deixe vazio para "Empresa Padrão"): ')) || 'Empresa Padrão';

    console.log('\n📋 Verificando empresa...');

    // Verificar/criar empresa
    let company = await prisma.empresa.findFirst({
      where: { empRaz: companyName },
    });

    if (!company) {
      console.log('📋 Criando empresa...');
      company = await prisma.empresa.create({
        data: {
          empRaz: companyName,
          empCmp: 1,
          empVer: 'v1.0.0',
          empDirFis: 'D:\\JASPI\\SISTEMA\\chat.jaspi.com.br\\appjaspi\\',
          empDirVir: 'http://192.168.100.46/JaspiZAP.NetEnvironment/appjaspi/',
          empCodPas: 'E123456',
          empCodSec: 'JABOTI_JS_DEFAULT',
        },
      });
      console.log(`✅ Empresa criada com ID: ${company.id}`);
    } else {
      console.log(`✅ Empresa já existe com ID: ${company.id}`);
    }

    // Verificar se já existe um usuário com este username
    const existingUser = await prisma.pessoa.findFirst({
      where: {
        user: username,
        empCod: company.id,
      },
    });

    if (existingUser) {
      console.log('⚠️  Usuário com este username já existe!');
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Nome: ${existingUser.name}`);
      console.log(`   Username: ${existingUser.user}`);
      console.log(`   Role: ${existingUser.role}`);

      const overwrite = await question('\n❓ Deseja sobrescrever? (s/N): ');
      if (overwrite.toLowerCase() !== 's' && overwrite.toLowerCase() !== 'sim') {
        console.log('❌ Operação cancelada');
        return;
      }

      // Remover usuário existente
      await prisma.pessoa.delete({
        where: {
          empCod: existingUser.empCod,
          id: existingUser.id,
        },
      });
      console.log('🗑️  Usuário anterior removido');
    }

    console.log('\n🔐 Criando usuário administrador...');

    // Criar hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário administrador
    const adminUser = await prisma.pessoa.create({
      data: {
        empCod: company.id,
        id: 1, // Primeiro usuário da empresa
        name: name,
        user: username,
        type: 'USUARIO',
        role: 'ADMIN',
        passwordHash: passwordHash,
        active: true,
        online: false,
        email: email,
        phone: phone,
        chatName: name.split(' ')[0], // Primeiro nome como chat name
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('\n✅ Usuário administrador criado com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Username: ${adminUser.user}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Telefone: ${adminUser.phone}`);
    console.log(`   Empresa: ${company.empRaz}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔑 Credenciais de acesso:');
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${password}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('');
    console.log('🌐 Acesse: http://localhost:3523/auth/login');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    rl.close();
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar o script
createCustomAdminUser();
