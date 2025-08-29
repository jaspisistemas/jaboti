const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script para sincronizar a tabela Parametro com os últimos códigos utilizados
 * em cada tabela correspondente (Pessoa, Empresa, Departamento)
 */

async function syncParametrosCodigos() {
  try {
    console.log('🔄 Iniciando sincronização dos parâmetros...');

    // Buscar todas as empresas
    const empresas = await prisma.empresa.findMany({
      select: { id: true, empRaz: true },
    });

    console.log(`📊 Encontradas ${empresas.length} empresas`);

    for (const empresa of empresas) {
      console.log(`\n🏢 Processando empresa: ${empresa.empRaz} (ID: ${empresa.id})`);

      // 1. Sincronizar códigos de PESSOA
      await syncCodigosPessoa(empresa.id);

      // 2. Sincronizar códigos de EMPRESA
      await syncCodigosEmpresa(empresa.id);

      // 3. Sincronizar códigos de DEPARTAMENTO
      await syncCodigosDepartamento(empresa.id);
    }

    console.log('\n✅ Sincronização concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Sincroniza códigos de PESSOA para uma empresa específica
 */
async function syncCodigosPessoa(empCod) {
  try {
    // Buscar o maior ID de pessoa para esta empresa
    const maxPessoa = await prisma.pessoa.findFirst({
      where: { empCod },
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const ultimoCodigo = maxPessoa ? maxPessoa.id : 0;

    // Buscar ou criar registro na tabela Parametro
    let parametro = await prisma.parametro.findFirst({
      where: {
        empCod,
        parCod: 'PESSOA',
      },
    });

    if (parametro) {
      // Atualizar registro existente
      await prisma.parametro.update({
        where: { empCod_parSeq: { empCod: parametro.empCod, parSeq: parametro.parSeq } },
        data: { parUltCod: ultimoCodigo },
      });
      console.log(`  👤 PESSOA: Atualizado para código ${ultimoCodigo}`);
    } else {
      // Criar novo registro
      const proximoSeq = await getProximoSequencial(empCod);
      await prisma.parametro.create({
        data: {
          empCod,
          parSeq: proximoSeq,
          parFilCod: 1,
          parCod: 'PESSOA',
          parNom: 'Controle de códigos sequenciais para Pessoas',
          parUltCod: ultimoCodigo,
        },
      });
      console.log(`  👤 PESSOA: Criado com código ${ultimoCodigo}`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao sincronizar PESSOA para empresa ${empCod}:`, error);
  }
}

/**
 * Sincroniza códigos de EMPRESA para uma empresa específica
 */
async function syncCodigosEmpresa(empCod) {
  try {
    // Para empresa, o código é o próprio ID da empresa
    const ultimoCodigo = empCod;

    // Buscar ou criar registro na tabela Parametro
    let parametro = await prisma.parametro.findFirst({
      where: {
        empCod,
        parCod: 'EMPRESA',
      },
    });

    if (parametro) {
      // Atualizar registro existente
      await prisma.parametro.update({
        where: { empCod_parSeq: { empCod: parametro.empCod, parSeq: parametro.parSeq } },
        data: { parUltCod: ultimoCodigo },
      });
      console.log(`  🏢 EMPRESA: Atualizado para código ${ultimoCodigo}`);
    } else {
      // Criar novo registro
      const proximoSeq = await getProximoSequencial(empCod);
      await prisma.parametro.create({
        data: {
          empCod,
          parSeq: proximoSeq,
          parFilCod: 1,
          parCod: 'EMPRESA',
          parNom: 'Controle de códigos sequenciais para Empresas',
          parUltCod: ultimoCodigo,
        },
      });
      console.log(`  🏢 EMPRESA: Criado com código ${ultimoCodigo}`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao sincronizar EMPRESA para empresa ${empCod}:`, error);
  }
}

/**
 * Sincroniza códigos de DEPARTAMENTO para uma empresa específica
 */
async function syncCodigosDepartamento(empCod) {
  try {
    // Buscar o maior ID de departamento para esta empresa
    const maxDepartamento = await prisma.departamento.findFirst({
      where: { empCod },
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const ultimoCodigo = maxDepartamento ? maxDepartamento.id : 0;

    // Buscar ou criar registro na tabela Parametro
    let parametro = await prisma.parametro.findFirst({
      where: {
        empCod,
        parCod: 'DEPARTAMENTO',
      },
    });

    if (parametro) {
      // Atualizar registro existente
      await prisma.parametro.update({
        where: { empCod_parSeq: { empCod: parametro.empCod, parSeq: parametro.parSeq } },
        data: { parUltCod: ultimoCodigo },
      });
      console.log(`  🏛️ DEPARTAMENTO: Atualizado para código ${ultimoCodigo}`);
    } else {
      // Criar novo registro
      const proximoSeq = await getProximoSequencial(empCod);
      await prisma.parametro.create({
        data: {
          empCod,
          parSeq: proximoSeq,
          parFilCod: 1,
          parCod: 'DEPARTAMENTO',
          parNom: 'Controle de códigos sequenciais para Departamentos',
          parUltCod: ultimoCodigo,
        },
      });
      console.log(`  🏛️ DEPARTAMENTO: Criado com código ${ultimoCodigo}`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao sincronizar DEPARTAMENTO para empresa ${empCod}:`, error);
  }
}

/**
 * Obtém o próximo número sequencial disponível para a empresa
 */
async function getProximoSequencial(empCod) {
  const ultimoParametro = await prisma.parametro.findFirst({
    where: { empCod },
    orderBy: { parSeq: 'desc' },
  });

  return ultimoParametro ? ultimoParametro.parSeq + 1 : 1;
}

/**
 * Função para mostrar o status atual dos parâmetros
 */
async function showStatus() {
  try {
    console.log('\n📋 Status atual dos parâmetros:');
    console.log('='.repeat(80));

    const parametros = await prisma.parametro.findMany({
      orderBy: [{ empCod: 'asc' }, { parSeq: 'asc' }],
    });

    for (const param of parametros) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: param.empCod },
        select: { empRaz: true },
      });

      console.log(`Empresa: ${empresa?.empRaz || 'N/A'} (${param.empCod})`);
      console.log(`  Tipo: ${param.parCod}`);
      console.log(`  Último Código: ${param.parUltCod}`);
      console.log(`  Sequencial: ${param.parSeq}`);
      console.log(`  Nome: ${param.parNom}`);
      console.log('-'.repeat(40));
    }
  } catch (error) {
    console.error('❌ Erro ao mostrar status:', error);
  }
}

// Executar o script
if (require.main === module) {
  syncParametrosCodigos()
    .then(() => showStatus())
    .catch(console.error);
}

module.exports = {
  syncParametrosCodigos,
  showStatus,
};
