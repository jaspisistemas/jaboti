import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DepartamentosService } from '../src/departamentos/departamentos.service';
import { PrismaService } from '../src/prisma/prisma.service';

class PrismaMock {
  departamento = {
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;
  empresaUser = { findUnique: jest.fn() } as any;
  departamentoPessoa = { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() } as any;
  pessoa = { findMany: jest.fn(), findFirst: jest.fn() } as any;
  departamentoCliente = { findMany: jest.fn() } as any;
}

describe('DepartamentosService', () => {
  let service: DepartamentosService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [DepartamentosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(DepartamentosService);
    prisma.empresaUser.findUnique.mockResolvedValue({}); // membership ok
  });

  it('lista membros sanitizando passwordHash', async () => {
    prisma.departamento.findFirst.mockResolvedValue({
      id: 1,
      empCod: 10,
      depNom: 'Dep',
      depDtaCri: new Date(),
      depUltAtu: new Date(),
    });
    prisma.departamentoPessoa.findMany.mockResolvedValue([
      { user: { id: 7, name: 'User', passwordHash: 'secret', type: 'USUARIO' } },
    ]);
    const res = await service.listarMembros(10, 1, 99);
    expect(res[0].passwordHash).toBeUndefined();
  });

  it('adiciona membros somente USUARIO com retorno detalhado', async () => {
    prisma.departamento.findFirst.mockResolvedValue({ id: 2, empCod: 10, depNom: 'Dep2' });
    prisma.pessoa.findMany.mockResolvedValue([
      { id: 1, type: 'USUARIO' },
      { id: 2, type: 'USUARIO' },
    ]);
    prisma.departamentoPessoa.findMany.mockResolvedValue([]);
    prisma.departamentoPessoa.createMany.mockResolvedValue({ count: 2 });
    const res = await service.adicionarMembros(10, 2, 9, { pessoaIds: [1, 2, 3] });
    expect(prisma.departamentoPessoa.createMany).toHaveBeenCalled();
    expect(res.adicionados).toEqual([1, 2]);
    expect(res.jaAdicionados).toEqual([]);
    expect(res.naoEncontrados).toEqual([3]);
    expect(res.mensagem).toContain('2 atendente');
  });

  it('retorna estrutura vazia quando lista vazia', async () => {
    prisma.departamento.findFirst.mockResolvedValue({ id: 3, empCod: 10, depNom: 'Dep3' });
    const res = await service.adicionarMembros(10, 3, 9, { pessoaIds: [] });
    expect(res.adicionados).toEqual([]);
    expect(res.mensagem).toBeDefined();
  });

  it('reporta jaAdicionados', async () => {
    prisma.departamento.findFirst.mockResolvedValue({ id: 7, empCod: 10, depNom: 'Dep7' });
    prisma.pessoa.findMany.mockResolvedValue([
      { id: 11, type: 'USUARIO' },
      { id: 12, type: 'USUARIO' },
    ]);
    prisma.departamentoPessoa.findMany.mockResolvedValue([{ userId: 11 }]);
    prisma.departamentoPessoa.createMany.mockResolvedValue({ count: 1 });
    const res = await service.adicionarMembros(10, 7, 9, { pessoaIds: [11, 12] });
    expect(res.jaAdicionados).toEqual([11]);
    expect(res.adicionados).toEqual([12]);
  });

  it('falha ao tentar adicionar CLIENTE', async () => {
    prisma.departamento.findFirst.mockResolvedValue({ id: 6, empCod: 10, depNom: 'Dep6' });
    prisma.pessoa.findMany.mockResolvedValue([{ id: 50, type: 'CLIENTE' }]);
    await expect(service.adicionarMembros(10, 6, 9, { pessoaIds: [50] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('remove membro', async () => {
    prisma.departamento.findFirst.mockResolvedValue({ id: 4, empCod: 10, depNom: 'Dep4' });
    prisma.pessoa.findFirst.mockResolvedValue({ id: 5 });
    prisma.departamentoPessoa.deleteMany.mockResolvedValue({ count: 1 });
    const res = await service.removerMembro(10, 4, 9, 5);
    expect(res.removido).toBe(true);
  });

  it('falha ao acessar departamento sem membership', async () => {
    prisma.empresaUser.findUnique.mockResolvedValueOnce(null);
    await expect(service.listar(10, 9)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('falha quando departamento não existe', async () => {
    prisma.departamento.findFirst.mockResolvedValue(null);
    await expect(service.obter(10, 999, 9)).rejects.toBeInstanceOf(NotFoundException);
  });
});
