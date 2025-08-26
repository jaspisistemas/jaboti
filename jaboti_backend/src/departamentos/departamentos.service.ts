import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { AddMembrosDepartamentoDto } from './dto/add-membros-departamento.dto';

@Injectable()
export class DepartamentosService {
  constructor(private prisma: PrismaService) {}

  private async ensureMembership(companyId: number, userId: number) {
    const rel = await this.prisma.companyUser.findUnique({
      where: { companyId_userId: { companyId, userId } },
    });
    if (!rel) throw new ForbiddenException('Usuário não pertence à empresa');
  }

  async listar(companyId: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const deps = await this.prisma.department.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
    return deps.map(d => ({ id: d.id, nome: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt }));
  }

  async criar(companyId: number, userId: number, dto: CreateDepartamentoDto) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.create({ data: { name: dto.nome, companyId } });
    return { id: dep.id, nome: dep.name, createdAt: dep.createdAt, updatedAt: dep.updatedAt };
  }

  async atualizar(companyId: number, id: number, userId: number, dto: UpdateDepartamentoDto) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    const updated = await this.prisma.department.update({ where: { id }, data: { name: dto.nome ?? dep.name } });
    return { id: updated.id, nome: updated.name, createdAt: updated.createdAt, updatedAt: updated.updatedAt };
  }

  async remover(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    await this.prisma.department.delete({ where: { id } });
    return { removido: true };
  }

  async obter(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    return { id: dep.id, nome: dep.name, createdAt: dep.createdAt, updatedAt: dep.updatedAt };
  }

  private async ensureDepartment(companyId: number, id: number) {
    const dep = await this.prisma.department.findFirst({ where: { id, companyId } });
    if (!dep) throw new NotFoundException('Departamento não encontrado');
    return dep;
  }

  async listarMembros(companyId: number, id: number, userId: number) {
    await this.ensureMembership(companyId, userId);
    await this.ensureDepartment(companyId, id);
    const rels = await this.prisma.departmentUser.findMany({
      where: { departmentId: id, department: { companyId } },
      include: { user: true },
      orderBy: { user: { name: 'asc' } },
      take: 500,
    });
    return rels.map(r => this.safePessoa(r.user));
  }

  async adicionarMembros(companyId: number, id: number, userId: number, dto: AddMembrosDepartamentoDto) {
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
      where: { id: { in: inputIds }, companies: { some: { companyId } } },
      select: { id: true, type: true },
    });

    const foundIds = pessoas.map(p => p.id);
  const naoEncontrados = inputIds.filter((i: number) => !foundIds.includes(i));

    if (pessoas.length === 0) {
      return {
        mensagem: 'Nenhum id encontrado na empresa',
        adicionados: [],
        jaAdicionados: [],
        naoEncontrados,
      };
    }

    const invalid = pessoas.filter(p => p.type !== 'USUARIO');
    if (invalid.length > 0) {
      throw new BadRequestException('Somente atendentes (USUARIO) podem ser adicionados ao departamento');
    }

    const validIds = pessoas.map(p => p.id);
    // Busca já adicionados
    const existing = await this.prisma.departmentUser.findMany({
      where: { departmentId: id, userId: { in: validIds } },
      select: { userId: true },
    });
    const jaAdicionados = existing.map(e => e.userId);
    const paraAdicionar = validIds.filter(v => !jaAdicionados.includes(v));

    let adicionados: number[] = [];
    if (paraAdicionar.length > 0) {
      await this.prisma.departmentUser.createMany({
        data: paraAdicionar.map(p => ({ departmentId: id, userId: p })),
        skipDuplicates: true,
      });
      adicionados = paraAdicionar;
    }

    const mensagemParts: string[] = [];
    if (adicionados.length > 0) mensagemParts.push(`${adicionados.length} atendente(s) adicionado(s)`);
    if (jaAdicionados.length > 0) mensagemParts.push(`${jaAdicionados.length} já estava(m) no departamento`);
    if (naoEncontrados.length > 0) mensagemParts.push(`${naoEncontrados.length} não encontrado(s)`);
    const mensagem = mensagemParts.join('; ') || 'Nenhuma alteração realizada';

    return { mensagem, adicionados, jaAdicionados, naoEncontrados };
  }

  async removerMembro(companyId: number, id: number, userId: number, pessoaId: number) {
    await this.ensureMembership(companyId, userId);
    await this.ensureDepartment(companyId, id);
    // Verifica se pessoa pertence à empresa
    const pessoa = await this.prisma.pessoa.findFirst({ where: { id: pessoaId, companies: { some: { companyId } } } });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada na empresa');
    await this.prisma.departmentUser.deleteMany({ where: { departmentId: id, userId: pessoaId } });
    return { removido: true };
  }

  private safePessoa(p: any) {
    if (!p) return p;
    const { passwordHash, ...rest } = p;
    return rest;
  }
}
