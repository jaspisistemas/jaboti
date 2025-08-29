import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddMembrosDepartamentoDto } from './dto/add-membros-departamento.dto';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentosService {
  constructor(private prisma: PrismaService) {}

  private async ensureMembership(companyId: number, userId: number) {
    const rel = await this.prisma.empresaUser.findUnique({
      where: { empCod_userId: { empCod: companyId, userId } },
    });
    if (!rel) throw new ForbiddenException('Usuário não pertence à empresa');
  }

  async listar(companyId: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const deps = await this.prisma.departamento.findMany({
      where: { empCod: companyId },
      orderBy: { depNom: 'asc' },
    });
    return deps.map((d) => ({
      id: d.id,
      nome: d.depNom,
      createdAt: d.depDtaCri,
      updatedAt: d.depUltAtu,
    }));
  }

  async criar(companyId: number, userId: number, dto: CreateDepartamentoDto) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.departamento.create({
      data: { depNom: dto.nome, empCod: companyId, id: 1 },
    });
    return { id: dep.id, nome: dep.depNom, createdAt: dep.depDtaCri, updatedAt: dep.depUltAtu };
  }

  async atualizar(companyId: number, id: number, userId: number, dto: UpdateDepartamentoDto) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod: companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    const updated = await this.prisma.departamento.update({
      where: { empCod_id: { empCod: companyId, id } },
      data: { depNom: dto.nome ?? dep.depNom },
    });
    return {
      id: updated.id,
      nome: updated.depNom,
      createdAt: updated.depDtaCri,
      updatedAt: updated.depUltAtu,
    };
  }

  async remover(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod: companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    await this.prisma.departamento.delete({ where: { empCod_id: { empCod: companyId, id } } });
    return { removido: true };
  }

  async obter(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod: companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    return { id: dep.id, nome: dep.depNom, createdAt: dep.depDtaCri, updatedAt: dep.depUltAtu };
  }

  private async ensureDepartment(companyId: number, id: number) {
    const dep = await this.prisma.departamento.findFirst({ where: { id, empCod: companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    return dep;
  }

  async listarMembros(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    await this.ensureDepartment(companyId, id);
    const rels = await this.prisma.departamentoPessoa.findMany({
      where: { depCod: id, department: { empCod: companyId } },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
      take: 500,
    });
    return rels.map((r) => this.safePessoa(r.user));
  }

  async adicionarMembros(
    companyId: number,
    id: number,
    userId: number,
    dto: AddMembrosDepartamentoDto,
  ) {
    await this.ensureMembership(companyId, userId);
    await this.ensureDepartment(companyId, id);
    const inputIds: number[] = Array.from(new Set((dto.pessoaIds || []) as number[]));
    if (inputIds.length === 0) {
      return {
        mensagem: 'Nenhum id informado',
        adicionados: [],
        jaAdicionados: [],
        naoEncontrados: [],
      };
    }

    // Busca pessoas existentes na empresa
    const pessoas = await this.prisma.pessoa.findMany({
      where: { id: { in: inputIds }, empCod: companyId },
      select: { id: true, type: true },
    });

    const foundIds = pessoas.map((p) => p.id);
    const naoEncontrados = inputIds.filter((i: number) => !foundIds.includes(i));

    if (pessoas.length === 0) {
      return {
        mensagem: 'Nenhum id encontrado na empresa',
        adicionados: [],
        jaAdicionados: [],
        naoEncontrados,
      };
    }

    const invalid = pessoas.filter((p) => p.type !== 'USUARIO');
    if (invalid.length > 0) {
      throw new BadRequestException(
        'Somente atendentes (USUARIO) podem ser adicionados ao departamento',
      );
    }

    const validIds = pessoas.map((p) => p.id);
    // Busca já adicionados
    const existing = await this.prisma.departamentoPessoa.findMany({
      where: { depCod: id, userId: { in: validIds } },
      select: { userId: true },
    });
    const jaAdicionados = existing.map((e) => e.userId);
    const paraAdicionar = validIds.filter((v) => !jaAdicionados.includes(v));

    let adicionados: number[] = [];
    if (paraAdicionar.length > 0) {
      // Usar createMany que é suportado pelo Prisma
      try {
        await this.prisma.departamentoPessoa.createMany({
          data: paraAdicionar.map((pessoaId) => ({
            empCod: companyId,
            depCod: id,
            userId: pessoaId,
          })),
        });
        adicionados = paraAdicionar;
      } catch (error: any) {
        // Se der erro, tentar criar um por um
        for (const pessoaId of paraAdicionar) {
          try {
            await this.prisma.departamentoPessoa.create({
              data: { empCod: companyId, depCod: id, userId: pessoaId },
            });
            adicionados.push(pessoaId);
          } catch (innerError: any) {
            // Se der erro de duplicata, ignora
            if (innerError?.code !== 'P2002') {
              throw innerError;
            }
          }
        }
      }
    }

    const mensagemParts: string[] = [];
    if (adicionados.length > 0)
      mensagemParts.push(`${adicionados.length} atendente(s) adicionado(s)`);
    if (jaAdicionados.length > 0)
      mensagemParts.push(`${jaAdicionados.length} já estava(m) no departamento`);
    if (naoEncontrados.length > 0) mensagemParts.push(`${naoEncontrados.length} não encontrado(s)`);
    const mensagem = mensagemParts.join('; ') || 'Nenhuma alteração realizada';

    return { mensagem, adicionados, jaAdicionados, naoEncontrados };
  }

  async removerMembro(companyId: number, id: number, userId: number, pessoaId: number) {
    await this.ensureMembership(companyId, userId);
    await this.ensureDepartment(companyId, id);
    // Verifica se pessoa pertence à empresa
    const pessoa = await this.prisma.pessoa.findFirst({
      where: { id: pessoaId, empCod: companyId },
    });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada na empresa');
    await this.prisma.departamentoPessoa.deleteMany({ where: { depCod: id, userId: pessoaId } });
    return { removido: true };
  }

  private safePessoa(p: any) {
    if (!p) return p;
    const { passwordHash, ...rest } = p;
    return rest;
  }
}
