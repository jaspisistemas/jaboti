import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { CodigoSequencialService } from '../src/common/services/codigo-sequencial.service';
import { PessoasService } from '../src/pessoas/pessoas.service';
import { PrismaService } from '../src/prisma/prisma.service';

class PrismaMock {
  pessoa = { findUnique: jest.fn(), findMany: jest.fn() } as any;
  refreshToken = {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    aggregate: jest.fn().mockResolvedValue({ _max: { id: 0 } }),
  } as any;
  empresaUser = { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() } as any;
}

// Mock para CodigoSequencialService
class CodigoSequencialMock {
  gerarProximoCodigo = jest.fn().mockResolvedValue(1);
}

const mockJwt = { sign: jest.fn().mockReturnValue('access.jwt.token') } as any;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaMock;
  let codigoSequencial: CodigoSequencialMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    codigoSequencial = new CodigoSequencialMock();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        PessoasService,
        { provide: PrismaService, useValue: prisma },
        { provide: CodigoSequencialService, useValue: codigoSequencial },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('falha se usuário não encontrado', async () => {
    prisma.pessoa.findMany.mockResolvedValue([]);
    await expect(service.login({ user: 'naoexiste' }, '123')).rejects.toBeDefined();
  });

  it('valida login com senha correta', async () => {
    const hash = await bcrypt.hash('SenhaOk123', 4);
    prisma.pessoa.findMany.mockResolvedValue([
      { id: 1, email: 'a@a', type: 'USUARIO', passwordHash: hash, role: 'OPERATOR' },
    ]);
    prisma.refreshToken.create.mockResolvedValue({});
    const res = await service.login({ user: 'UsuarioA' }, 'SenhaOk123');
    expect(res.accessToken).toBeDefined();
  });
});
