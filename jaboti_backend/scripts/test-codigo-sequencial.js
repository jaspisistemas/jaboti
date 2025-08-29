const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script de teste para verificar se o sistema de códigos sequenciais está funcionando
 */

async function testCodigoSequencial() {
  try {
    console.log('🧪 Testando sistema de códigos sequenciais...\n');
    
    // Teste 1: Verificar estado atual
    console.log('📊 Estado atual da tabela Parametro:');
    const parametros = await prisma.parametro.findMany({
      orderBy: [{ empCod: 'asc' }, { parSeq: 'asc' }]
    });
    
    for (const param of parametros) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: param.empCod },
        select: { empRaz: true }
      });
      
      console.log(`  ${empresa?.empRaz || 'N/A'} (${param.empCod}) - ${param.parCod}: ${param.parUltCod}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Teste 2: Simular geração de códigos
    console.log('\n🔄 Simulando geração de códigos...');
    
    for (const empresa of [1]) { // Testar apenas empresa 1
      console.log(`\n🏢 Empresa ${empresa}:`);
      
      // Simular criação de 3 pessoas
      for (let i = 1; i <= 3; i++) {
        const proximoCodigo = await simularGeracaoCodigo(empresa, 'PESSOA');
        console.log(`  👤 Pessoa ${i}: próximo código seria ${proximoCodigo}`);
      }
      
      // Simular criação de 2 departamentos
      for (let i = 1; i <= 2; i++) {
        const proximoCodigo = await simularGeracaoCodigo(empresa, 'DEPARTAMENTO');
        console.log(`  🏛️ Departamento ${i}: próximo código seria ${proximoCodigo}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Teste 3: Verificar se não há conflitos
    console.log('\n🔍 Verificando possíveis conflitos...');
    
    const pessoas = await prisma.pessoa.findMany({
      where: { empCod: 1 },
      select: { id: true, name: true },
      orderBy: { id: 'asc' }
    });
    
    console.log('  IDs de pessoas existentes:');
    for (const pessoa of pessoas) {
      console.log(`    ${pessoa.id}: ${pessoa.name}`);
    }
    
    const proximoIdPessoa = await simularGeracaoCodigo(1, 'PESSOA');
    console.log(`\n  Próximo ID para pessoa seria: ${proximoIdPessoa}`);
    
    if (pessoas.some(p => p.id === proximoIdPessoa)) {
      console.log('  ⚠️  ATENÇÃO: Conflito detectado!');
    } else {
      console.log('  ✅ Nenhum conflito detectado');
    }
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Simula a geração de código sem realmente criar registros
 */
async function simularGeracaoCodigo(empCod, parCod) {
  try {
    // Buscar o registro existente
    const parametroExistente = await prisma.parametro.findFirst({
      where: {
        empCod,
        parCod,
        parFilCod: 1,
      },
    });

    if (parametroExistente) {
      // Retornar o próximo código (sem incrementar)
      return parametroExistente.parUltCod + 1;
    } else {
      // Se não existe, retornar 1
      return 1;
    }
  } catch (error) {
    console.error(`Erro ao simular geração para ${parCod}:`, error);
    return 0;
  }
}

/**
 * Função para mostrar estatísticas do banco
 */
async function showDatabaseStats() {
  try {
    console.log('\n📈 Estatísticas do banco de dados:');
    console.log('='.repeat(40));
    
    // Contar pessoas por empresa
    const pessoasPorEmpresa = await prisma.pessoa.groupBy({
      by: ['empCod'],
      _count: { id: true }
    });
    
    for (const stat of pessoasPorEmpresa) {
      const empresa = await prisma.empresa.findUnique({
        where: { id: stat.empCod },
        select: { empRaz: true }
      });
      
      console.log(`  ${empresa?.empRaz || 'N/A'} (${stat.empCod}): ${stat._count.id} pessoas`);
    }
    
    // Contar departamentos por empresa
    const departamentosPorEmpresa = await prisma.departamento.groupBy({
      by: ['empCod'],
      _count: { id: true }
    });
    
    if (departamentosPorEmpresa.length > 0) {
      console.log('\n  Departamentos por empresa:');
      for (const stat of departamentosPorEmpresa) {
        const empresa = await prisma.empresa.findUnique({
          where: { id: stat.empCod },
          select: { empRaz: true }
        });
        
        console.log(`    ${empresa?.empRaz || 'N/A'} (${stat.empCod}): ${stat._count.id} departamentos`);
      }
    } else {
      console.log('\n  Nenhum departamento encontrado');
    }
    
  } catch (error) {
    console.error('Erro ao mostrar estatísticas:', error);
  }
}

// Executar o teste
if (require.main === module) {
  testCodigoSequencial()
    .then(() => showDatabaseStats())
    .catch(console.error);
}

module.exports = {
  testCodigoSequencial,
  showDatabaseStats
};
