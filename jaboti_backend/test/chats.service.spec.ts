import { Test } from '@nestjs/testing';
import { AtendimentosService } from '../src/atendimentos/atendimentos.service';
import { PrismaService } from '../src/prisma/prisma.service';

class PrismaMock {
  pessoa = { findFirst: jest.fn() } as any;
  atendimento = { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn() } as any;
  message = { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), findFirst: jest.fn() } as any;
  department = { findFirst: jest.fn() } as any;
  departmentUser = { findFirst: jest.fn() } as any;
}

describe('AtendimentosService', () => {
  let service: AtendimentosService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = new PrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [AtendimentosService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(AtendimentosService);
  });

  it('cria atendimento PENDENTE para cliente válido', async () => {
    prisma.pessoa.findFirst.mockResolvedValue({ id: 5, type: 'CLIENTE' });
    prisma.atendimento.create.mockResolvedValue({ id: 1, companyId: 10, clientId: 5, status: 'PENDENTE' });
    const a = await service.create(10, { clientId: 5 } as any);
    expect(a.status).toBe('PENDENTE');
    expect(prisma.atendimento.create).toHaveBeenCalled();
  });

  it('envia mensagem e atualiza lastMessageAt com auto claim', async () => {
    prisma.pessoa.findFirst.mockResolvedValue({ id: 99, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({ id: 1, companyId: 10, status: 'PENDENTE', attendantId: null, firstHumanAt: null });
    prisma.message.create.mockResolvedValue({ id: 11, chatId: 1, content: 'Oi', senderType: 'ATTENDANT' });
    prisma.atendimento.update.mockResolvedValue({});
    const msg = await service.sendMessage(10, 99, { chatId: 1, content: 'Oi' } as any);
    expect(msg.id).toBe(11);
    expect(prisma.atendimento.update).toHaveBeenCalled();
  });

  it('lista mensagens com paginação', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 1, companyId: 10 });
    prisma.message.findMany.mockResolvedValue([{ id: 11 }]);
    const list = await service.listMessages(10, 1, 50, undefined);
    expect(list.length).toBe(1);
  });

  it('marca mensagem como lida', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 2, companyId: 10 });
    prisma.message.update.mockResolvedValue({ id: 33, readAt: new Date() });
    const res: any = await service.markRead(10, 2, 33);
    expect(res.readAt).toBeDefined();
  });

  it('edita mensagem registrando originalContent e editedAt', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 3, companyId: 10 });
    prisma.message.findFirst.mockResolvedValue({ id: 44, chatId: 3, content: 'Antigo', mediaType: null });
    prisma.message.update.mockImplementation(({ data }: any) => ({ id: 44, ...data }));
    const updated = await service.updateMessage(10, 3, 44, { content: 'Novo' });
    expect(updated.content).toBe('Novo');
    expect(updated.editedAt).toBeDefined();
    expect(updated.originalContent).toBe('Antigo');
  });

  it('claim atribui atendente e ativa atendimento', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 50, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({ id: 77, companyId: 10, status: 'PENDENTE', attendantId: null, firstHumanAt: null });
    prisma.atendimento.update.mockResolvedValue({ id: 77, attendantId: 50, status: 'ATIVO', firstHumanAt: new Date() });
    const res = await service.claim(10, 77, 50);
    expect(res.status).toBe('ATIVO');
    expect(res.attendantId).toBe(50);
  });

  it('close encerra atendimento', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 51, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({ id: 80, companyId: 10, status: 'ATIVO' });
    prisma.atendimento.update.mockResolvedValue({ id: 80, status: 'ENCERRADO', endedAt: new Date() });
    const res = await service.close(10, 80, 51);
    expect(res.status).toBe('ENCERRADO');
  });

  it('transfer altera departamento e atendente', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 60, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({ id: 90, companyId: 10, status: 'PENDENTE', departmentId: null, attendantId: null, firstHumanAt: null });
    prisma.department.findFirst.mockResolvedValue({ id: 5, companyId: 10 });
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 61, type: 'USUARIO' });
    prisma.departmentUser.findFirst.mockResolvedValue({ departmentId: 5, userId: 61 });
    prisma.atendimento.update.mockResolvedValue({ id: 90, departmentId: 5, attendantId: 61, status: 'ATIVO' });
    const res: any = await service.transfer(10, 90, 60, { departamentoId: 5, atendenteId: 61 });
    expect(res.departmentId).toBe(5);
    expect(res.attendantId).toBe(61);
    expect(res.status).toBe('ATIVO');
  });

  it('listChats filtra por status', async () => {
    prisma.atendimento.findMany.mockResolvedValue([{ id: 1, status: 'PENDENTE' }]);
    const res = await service.list(10, { status: 'PENDENTE' });
    expect(res[0].status).toBe('PENDENTE');
  });

  it('inbound cria atendimento BOT e registra mensagem do cliente', async () => {
    prisma.pessoa.findFirst.mockResolvedValue({ id: 70, type: 'CLIENTE' });
    prisma.atendimento.create.mockResolvedValue({ id: 500, companyId: 10, clientId: 70, status: 'BOT' });
    prisma.message.create.mockResolvedValue({ id: 900, chatId: 500, senderType: 'CLIENT', content: 'Oi' });
    const res = await service.inboundClientMessage(10, { clientId: 70, content: 'Oi' });
    expect((res as any).atendimento.status).toBe('BOT');
    expect(res.message.senderType).toBe('CLIENT');
  });

  it('botMessage só permitido em BOT', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 600, companyId: 10, status: 'BOT' });
    prisma.message.create.mockResolvedValue({ id: 901, chatId: 600, senderType: 'BOT', content: 'Olá!' });
    prisma.atendimento.update.mockResolvedValue({});
    const msg = await service.botMessage(10, 600, { content: 'Olá!' });
    expect(msg.senderType).toBe('BOT');
  });

  it('requestHuman muda status BOT -> PENDENTE', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 610, companyId: 10, status: 'BOT' });
    prisma.department.findFirst.mockResolvedValue({ id: 5, companyId: 10 });
    prisma.atendimento.update.mockResolvedValue({ id: 610, status: 'PENDENTE', departmentId: 5 });
    const chat = await service.requestHuman(10, 610, { departamentoId: 5 });
    expect(chat.status).toBe('PENDENTE');
  });
});
