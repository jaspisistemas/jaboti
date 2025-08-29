import { Test } from '@nestjs/testing';
import { AtendimentosService } from '../src/atendimentos/atendimentos.service';
import { PrismaService } from '../src/prisma/prisma.service';

class PrismaMock {
  pessoa = { findFirst: jest.fn() } as any;
  atendimento = {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  } as any;
  mensagem = {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  } as any;
  departamento = { findFirst: jest.fn() } as any;
  departamentoPessoa = { findFirst: jest.fn() } as any;
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
    prisma.atendimento.create.mockResolvedValue({
      id: 1,
      companyId: 10,
      clientId: 5,
      status: 'PENDENTE',
    });
    const a = await service.create(10, { clientId: 5 } as any);
    expect(a.status).toBe('PENDENTE');
    expect(prisma.atendimento.create).toHaveBeenCalled();
  });

  it('envia mensagem e atualiza lastMessageAt com auto claim', async () => {
    prisma.pessoa.findFirst.mockResolvedValue({ id: 99, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({
      id: 1,
      companyId: 10,
      status: 'PENDENTE',
      attendantId: null,
      firstHumanAt: null,
    });
    prisma.mensagem.create.mockResolvedValue({
      id: 11,
      chatId: 1,
      content: 'Oi',
      senderType: 'ATTENDANT',
    });
    prisma.atendimento.update.mockResolvedValue({});
    const msg = await service.sendMessage(10, 99, { chatId: 1, content: 'Oi' } as any);
    expect(msg.id).toBe(11);
    expect(prisma.atendimento.update).toHaveBeenCalled();
  });

  it('lista mensagens com paginação', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 1, companyId: 10 });
    prisma.mensagem.findMany.mockResolvedValue([{ id: 11 }]);
    const list = await service.listMessages(10, 1, 50, undefined);
    expect(list.length).toBe(1);
  });

  it('marca mensagem como lida', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 2, companyId: 10 });
    prisma.mensagem.update.mockResolvedValue({ id: 33, readAt: new Date() });
    const res: any = await service.markRead(10, 2, 33);
    expect(res.readAt).toBeDefined();
  });

  it('edita mensagem registrando originalContent e editedAt', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 3, empCod: 10 });
    prisma.mensagem.findFirst.mockResolvedValue({
      id: 44,
      janAtendimId: 3,
      msgTxt: 'Antigo',
      msgTip: null,
    });
    prisma.mensagem.update.mockImplementation(({ data }: any) => ({ id: 44, ...data }));
    const updated = await service.updateMessage(10, 3, 44, { content: 'Novo' });
    expect(updated.msgTxt).toBe('Novo');
    expect(updated.msgIsEdt).toBe(true);
    expect(updated.msgOldTxt).toBe('Antigo');
  });

  it('claim atribui atendente e ativa atendimento', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 50, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({
      id: 77,
      empCod: 10,
      atendimStatus: 'PENDENTE',
      atendenteId: null,
      atendimDtaHorHumanoIni: null,
    });
    prisma.atendimento.update.mockResolvedValue({
      id: 77,
      atendenteId: 50,
      atendimStatus: 'ATIVO',
      atendimDtaHorHumanoIni: new Date(),
    });
    const res = await service.claim(10, 77, 50);
    expect(res.atendimStatus).toBe('ATIVO');
    expect(res.atendenteId).toBe(50);
  });

  it('close encerra atendimento', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 51, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({ id: 80, empCod: 10, atendimStatus: 'ATIVO' });
    prisma.atendimento.update.mockResolvedValue({
      id: 80,
      status: 'ENCERRADO',
      atendimDtaHorFin: new Date(),
    });
    const res = await service.close(10, 80, 51);
    expect(res.status).toBe('ENCERRADO');
  });

  it('transfer altera departamento e atendente', async () => {
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 60, type: 'USUARIO' });
    prisma.atendimento.findFirst.mockResolvedValue({
      id: 90,
      empCod: 10,
      atendimStatus: 'PENDENTE',
      departamentoId: null,
      atendenteId: null,
      atendimDtaHorHumanoIni: null,
    });
    prisma.departamento.findFirst.mockResolvedValue({ id: 5, empCod: 10 });
    prisma.pessoa.findFirst.mockResolvedValueOnce({ id: 61, type: 'USUARIO' });
    prisma.departamentoPessoa.findFirst.mockResolvedValue({ depCod: 5, userId: 61 });
    prisma.atendimento.update.mockResolvedValue({
      id: 90,
      departamentoId: 5,
      atendenteId: 61,
      atendimStatus: 'PENDENTE',
    });
    const res: any = await service.transfer(10, 90, 60, { departamentoId: 5, atendenteId: 61 });
    expect(res.departamentoId).toBe(5);
    expect(res.atendenteId).toBe(61);
    expect(res.atendimStatus).toBe('PENDENTE');
  });

  it('listChats filtra por status', async () => {
    prisma.atendimento.findMany.mockResolvedValue([{ id: 1, atendimStatus: 'PENDENTE' }]);
    const res = await service.list(10, { atendimStatus: 'PENDENTE' });
    expect(res[0].atendimStatus).toBe('PENDENTE');
  });

  it('inbound cria atendimento BOT e registra mensagem do cliente', async () => {
    prisma.pessoa.findFirst.mockResolvedValue({ id: 70, type: 'CLIENTE' });
    prisma.atendimento.create.mockResolvedValue({
      id: 500,
      empCod: 10,
      clientId: 70,
      atendimStatus: 'BOT',
    });
    prisma.mensagem.create.mockResolvedValue({
      id: 900,
      janAtendimId: 500,
      msgTip: 'CLIENT',
      msgTxt: 'Oi',
    });
    const res = await service.inboundClientMessage(10, { clientId: 70, content: 'Oi' });
    expect((res as any).atendimento.atendimStatus).toBe('BOT');
    expect(res.message.msgTip).toBe('CLIENT');
  });

  it('botMessage só permitido em BOT', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 600, empCod: 10, atendimStatus: 'BOT' });
    prisma.mensagem.create.mockResolvedValue({
      id: 901,
      janAtendimId: 600,
      msgTip: 'BOT',
      msgTxt: 'Olá!',
    });
    prisma.atendimento.update.mockResolvedValue({});
    const msg = await service.botMessage(10, 600, { content: 'Olá!' });
    expect(msg.msgTip).toBe('BOT');
  });

  it('requestHuman muda status BOT -> PENDENTE', async () => {
    prisma.atendimento.findFirst.mockResolvedValue({ id: 610, empCod: 10, atendimStatus: 'BOT' });
    prisma.departamento.findFirst.mockResolvedValue({ id: 5, empCod: 10 });
    prisma.atendimento.update.mockResolvedValue({
      id: 610,
      atendimStatus: 'PENDENTE',
      departamentoId: 5,
    });
    const chat = await service.requestHuman(10, 610, { departamentoId: 5 });
    expect(chat.atendimStatus).toBe('PENDENTE');
  });
});
