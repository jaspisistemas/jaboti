import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DomParCod } from '../enums/dom-par-cod.enum';

@Injectable()
export class CodigoSequencialService {
  constructor(private prisma: PrismaService) {}

  /**
   * Gera o próximo código sequencial para uma tabela específica
   * Baseado no procedimento Genexus ultimoCodigoEmpresa
   */
  async gerarProximoCodigo(empCod: number, parCod: string, filCod: number = 1): Promise<number> {
    // Busca o registro existente
    const parametroExistente = await this.prisma.parametro.findFirst({
      where: {
        empCod,
        parCod,
        parFilCod: filCod,
      },
      orderBy: {
        parUltCod: 'desc',
      },
    });

    if (parametroExistente) {
      // Incrementa o código existente
      const novoCodigo = parametroExistente.parUltCod + 1;

      await this.prisma.parametro.update({
        where: {
          empCod_parSeq: {
            empCod: parametroExistente.empCod,
            parSeq: parametroExistente.parSeq,
          },
        },
        data: {
          parUltCod: novoCodigo,
        },
      });

      return novoCodigo;
    } else {
      // Cria um novo registro
      const proximoSeq = await this.obterProximoSequencial(empCod);

      const novoParametro = await this.prisma.parametro.create({
        data: {
          empCod,
          parSeq: proximoSeq,
          parFilCod: filCod,
          parCod,
          parNom: this.obterDescricaoEnum(parCod),
          parUltCod: 1,
        },
      });

      return 1;
    }
  }

  /**
   * Obtém o próximo número sequencial disponível para a empresa
   */
  private async obterProximoSequencial(empCod: number): Promise<number> {
    const ultimoParametro = await this.prisma.parametro.findFirst({
      where: { empCod },
      orderBy: { parSeq: 'desc' },
    });

    return ultimoParametro ? ultimoParametro.parSeq + 1 : 1;
  }

  /**
   * Obtém a descrição do enum para o nome do parâmetro
   */
  private obterDescricaoEnum(parCod: string): string {
    const descricoes: Record<string, string> = {
      [DomParCod.PESSOA]: 'Controle de códigos sequenciais para Pessoas',
      [DomParCod.EMPRESA]: 'Controle de códigos sequenciais para Empresas',
      [DomParCod.DEPARTAMENTO]: 'Controle de códigos sequenciais para Departamentos',
    };

    return descricoes[parCod] || `Controle de códigos sequenciais para ${parCod}`;
  }

  /**
   * Obtém o último código usado para uma tabela específica
   */
  async obterUltimoCodigo(empCod: number, parCod: string, filCod: number = 1): Promise<number> {
    const parametro = await this.prisma.parametro.findFirst({
      where: {
        empCod,
        parCod,
        parFilCod: filCod,
      },
    });

    return parametro ? parametro.parUltCod : 0;
  }

  /**
   * Reseta o contador para uma tabela específica
   */
  async resetarContador(empCod: number, parCod: string, filCod: number = 1): Promise<void> {
    const parametro = await this.prisma.parametro.findFirst({
      where: {
        empCod,
        parCod,
        parFilCod: filCod,
      },
    });

    if (parametro) {
      await this.prisma.parametro.update({
        where: {
          empCod_parSeq: {
            empCod: parametro.empCod,
            parSeq: parametro.parSeq,
          },
        },
        data: {
          parUltCod: 0,
        },
      });
    }
  }
}
