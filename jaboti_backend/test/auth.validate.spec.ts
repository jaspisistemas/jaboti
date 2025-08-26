import { Test } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { PessoasService } from '../src/pessoas/pessoas.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

class PrismaMock {
  pessoa = { findUnique: jest.fn(), findMany: jest.fn() } as any;
  refreshToken = { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]), update: jest.fn() } as any;
  companyUser = { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() } as any;
}

const mockJwt = { sign: jest.fn().mockReturnValue('access.jwt.token') } as any;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [AuthService, PessoasService, { provide: PrismaService, useValue: prisma }, { provide: JwtService, useValue: mockJwt }],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('falha se usuário não encontrado', async () => {
    prisma.pessoa.findMany.mockResolvedValue([]);
  await expect(service.login({ user: 'naoexiste' }, '123')).rejects.toBeDefined();
  });

  it('valida login com senha correta', async () => {
    const hash = await bcrypt.hash('SenhaOk123', 4);
    prisma.pessoa.findMany.mockResolvedValue([{ id: 1, email: 'a@a', type: 'USUARIO', passwordHash: hash, role: 'OPERATOR' }]);
    prisma.refreshToken.create.mockResolvedValue({});
  const res = await service.login({ user: 'UsuarioA' }, 'SenhaOk123');
    expect(res.accessToken).toBeDefined();
  });
});
