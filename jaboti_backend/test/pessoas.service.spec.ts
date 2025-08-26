import { Test } from '@nestjs/testing';
import { PessoasService } from '../src/pessoas/pessoas.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PessoaTipo } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Simple in-memory mocks for Prisma
class PrismaMock {
  pessoa = {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  } as any;
  companyUser = { findUnique: jest.fn() } as any;
}

describe('PessoasService', () => {
  let service: PessoasService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [PessoasService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PessoasService);
  });

  it('cria USUARIO com password custom', async () => {
    prisma.pessoa.create.mockResolvedValue({ id: 1, name: 'User', type: 'USUARIO', passwordHash: 'hash' });
    const created = await service.create(10, { name: 'User', type: PessoaTipo.USUARIO, password: 'SenhaForte123' } as any);
    expect(prisma.pessoa.create).toHaveBeenCalled();
    const callData = prisma.pessoa.create.mock.calls[0][0].data;
    expect(callData.passwordHash).toBeDefined();
  });

  it('atualiza senha quando enviada em update', async () => {
    prisma.pessoa.findFirst = jest.fn().mockResolvedValue({ id: 2 });
    prisma.pessoa.update = jest.fn().mockResolvedValue({ id: 2 });
    await service.update(10, 2, { password: 'NovaSenha123' } as any);
    expect(prisma.pessoa.update).toHaveBeenCalled();
    const updateData = prisma.pessoa.update.mock.calls[0][0].data;
    expect(updateData.passwordHash).toBeDefined();
  });

  it('create CLIENTE ignora senha fornecida e usa hash de string vazia', async () => {
  prisma.pessoa.create.mockImplementation(async ({ data }: any) => data); // echo
    const created = await service.create(10, { name: 'Cliente', type: PessoaTipo.CLIENTE, password: 'NaoDeveriaUsar123' } as any);
    // passwordHash is inside prisma call argument, not in returned created because echo includes it
    const callData = prisma.pessoa.create.mock.calls[0][0].data;
    expect(callData.type).toBe(PessoaTipo.CLIENTE);
    expect(callData.passwordHash).toBeDefined();
    const matchesEmpty = await bcrypt.compare('', callData.passwordHash);
    expect(matchesEmpty).toBe(true);
  });

  describe('changePassword', () => {
    it('troca senha com credenciais corretas', async () => {
      const oldHash = await bcrypt.hash('OldPass123', 4);
      prisma.pessoa.findUnique.mockResolvedValue({ id: 5, type: 'USUARIO', passwordHash: oldHash });
      prisma.pessoa.update.mockResolvedValue({});
      const res = await service.changePassword(5, { senhaAtual: 'OldPass123', novaSenha: 'NewPass456' } as any);
      expect(res.changed).toBe(true);
      const newHash = prisma.pessoa.update.mock.calls[0][0].data.passwordHash;
      expect(await bcrypt.compare('NewPass456', newHash)).toBe(true);
    });

    it('falha com senha atual incorreta', async () => {
      const oldHash = await bcrypt.hash('OldPass123', 4);
      prisma.pessoa.findUnique.mockResolvedValue({ id: 6, type: 'USUARIO', passwordHash: oldHash });
      await expect(service.changePassword(6, { senhaAtual: 'Errada', novaSenha: 'NewPass456' } as any)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
