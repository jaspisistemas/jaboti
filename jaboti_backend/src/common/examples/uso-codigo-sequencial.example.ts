import { Injectable } from '@nestjs/common';
import { DomParCod } from '../enums/dom-par-cod.enum';
import { CodigoSequencialService } from '../services/codigo-sequencial.service';

/**
 * Exemplo de como usar o CodigoSequencialService
 * Este arquivo demonstra as diferentes formas de utilização
 */

@Injectable()
export class ExemploUsoCodigoSequencial {
  constructor(private codigoSequencialService: CodigoSequencialService) {}

  /**
   * Exemplo 1: Gerar código para uma nova pessoa
   */
  async criarNovaPessoa(empCod: number) {
    const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
      empCod,
      DomParCod.PESSOA,
    );

    console.log(`Próximo código para pessoa: ${proximoCodigo}`);
    return proximoCodigo;
  }

  /**
   * Exemplo 2: Gerar código para uma nova empresa
   */
  async criarNovaEmpresa(empCod: number) {
    const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
      empCod,
      DomParCod.EMPRESA,
    );

    console.log(`Próximo código para empresa: ${proximoCodigo}`);
    return proximoCodigo;
  }

  /**
   * Exemplo 3: Gerar código para um novo departamento
   */
  async criarNovoDepartamento(empCod: number) {
    const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
      empCod,
      DomParCod.DEPARTAMENTO,
    );

    console.log(`Próximo código para departamento: ${proximoCodigo}`);
    return proximoCodigo;
  }

  /**
   * Exemplo 4: Verificar o último código usado
   */
  async verificarUltimoCodigo(empCod: number, tipo: DomParCod) {
    const ultimoCodigo = await this.codigoSequencialService.obterUltimoCodigo(empCod, tipo);

    console.log(`Último código usado para ${tipo}: ${ultimoCodigo}`);
    return ultimoCodigo;
  }

  /**
   * Exemplo 5: Resetar contador (útil para testes ou reinicialização)
   */
  async resetarContador(empCod: number, tipo: DomParCod) {
    await this.codigoSequencialService.resetarContador(empCod, tipo);
    console.log(`Contador resetado para ${tipo}`);
  }

  /**
   * Exemplo 6: Uso em lote para múltiplas entidades
   */
  async criarMultiplasEntidades(empCod: number) {
    const resultados = {
      pessoa: await this.codigoSequencialService.gerarProximoCodigo(empCod, DomParCod.PESSOA),
      empresa: await this.codigoSequencialService.gerarProximoCodigo(empCod, DomParCod.EMPRESA),
      departamento: await this.codigoSequencialService.gerarProximoCodigo(
        empCod,
        DomParCod.DEPARTAMENTO,
      ),
    };

    console.log('Códigos gerados:', resultados);
    return resultados;
  }
}

/**
 * Exemplo de uso direto (sem injeção de dependência)
 * Útil para scripts ou testes
 */
export async function exemploUsoDireto() {
  // Este é apenas um exemplo conceitual
  // Na prática, você precisaria instanciar o PrismaService

  console.log('Para usar diretamente, você precisaria:');
  console.log('1. Instanciar o PrismaService');
  console.log('2. Instanciar o CodigoSequencialService');
  console.log('3. Chamar os métodos conforme necessário');

  // Exemplo de como seria:
  // const prismaService = new PrismaService();
  // const codigoService = new CodigoSequencialService(prismaService);
  // const codigo = await codigoService.gerarProximoCodigo(1, DomParCod.PESSOA);
}
