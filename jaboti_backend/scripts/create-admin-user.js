const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🚀 Criando usuário administrador padrão...');

    // Primeiro, vamos verificar se já existe uma empresa
    let company = await prisma.empresa.findFirst({
      where: { empRaz: 'Empresa Padrão' },
    });

    if (!company) {
      console.log('📋 Criando empresa padrão...');
      company = await prisma.empresa.create({
        data: {
          empRaz: 'Empresa Padrão',
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

    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.pessoa.findFirst({
      where: {
        user: 'admin',
        type: 'USUARIO',
        empCod: company.id,
      },
    });

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Username: ${existingAdmin.user}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Empresa ID: ${existingAdmin.empCod}`);

      // Verificar se o usuário está corretamente vinculado à empresa
      if (existingAdmin.empCod === company.id) {
        console.log('✅ Usuário admin está corretamente vinculado à empresa');

        // Verificar se existe o registro na tabela EmpresaUser
        const empresaUser = await prisma.empresaUser.findUnique({
          where: {
            empCod_userId: {
              empCod: company.id,
              userId: existingAdmin.id,
            },
          },
        });

        if (empresaUser) {
          console.log('✅ Registro EmpresaUser existe e está correto');
        } else {
          console.log('❌ Registro EmpresaUser NÃO existe! Criando...');
          await prisma.empresaUser.create({
            data: {
              empCod: company.id,
              userId: existingAdmin.id,
              primary: true,
            },
          });
          console.log('✅ Registro EmpresaUser criado com sucesso!');
        }
      } else {
        console.log('❌ Usuário admin NÃO está vinculado à empresa correta!');
        console.log(`   Empresa atual: ${existingAdmin.empCod}`);
        console.log(`   Empresa esperada: ${company.id}`);
      }
      return;
    }

    // Criar usuário administrador
    const passwordHash = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.pessoa.create({
      data: {
        empCod: company.id,
        id: 1, // Primeiro usuário da empresa
        name: 'Administrador do Sistema',
        user: 'admin',
        type: 'USUARIO',
        role: 'ADMIN',
        passwordHash: passwordHash,
        active: true,
        online: false,
        email: 'admin@jaboti.com',
        phone: '+5511999999999',
        chatName: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Criar o registro na tabela EmpresaUser para vincular o usuário à empresa
    await prisma.empresaUser.create({
      data: {
        empCod: company.id,
        userId: adminUser.id,
        primary: true,
      },
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Nome: ${adminUser.name}`);
    console.log(`   Username: ${adminUser.user}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Empresa ID: ${adminUser.empCod}`);
    console.log(`   Empresa: ${company.empRaz}`);
    console.log('✅ Usuário vinculado à empresa via EmpresaUser');
    console.log('');
    console.log('🔑 Credenciais de acesso:');
    console.log(`   Username: admin`);
    console.log(`   Senha: admin123`);
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
    console.log('\n🔌 Conexão com banco fechada');
  }
}

// Executar o script
createAdminUser();
