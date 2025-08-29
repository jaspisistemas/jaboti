import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BotMessageDto } from './dto/bot-message.dto';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { InboundMessageDto } from './dto/inbound-message.dto';
import { RequestHumanDto } from './dto/request-human.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TransferAtendimentoDto } from './dto/transfer-atendimento.dto';

@Injectable()
export class AtendimentosService {
  constructor(private prisma: PrismaService) {}

  async create(empCod: number, dto: CreateAtendimentoDto, userId?: number) {
    // Cliente precisa estar vinculado à empresa
    const client = await this.prisma.pessoa.findFirst({
      where: { id: dto.clientId, empCod: empCod, type: 'CLIENTE' },
    });
    if (!client) throw new BadRequestException('Cliente não pertence à empresa ou é inválido');
    // Não permitir novo atendimento se já existe um em andamento para este cliente
    const existing = await (this.prisma as any).atendimento.findFirst({
      where: {
        empCod: empCod,
        clienteId: dto.clientId,
        atendimStatus: { in: ['BOT', 'PENDENTE', 'ATIVO'] },
      },
      select: { id: true, atendimStatus: true },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um atendimento em andamento (ID ${existing.id}, status ${existing.atendimStatus}) para este cliente`,
      );
    }
    if (dto.departamentoId) {
      const dep = await (this.prisma as any).departamento.findFirst({
        where: { id: dto.departamentoId, empCod },
      });
      if (!dep) throw new NotFoundException('Departamento inválido');
    }

    // Determinar status inicial e campos relacionados
    const shouldStartActive = dto.startActive === true && userId;
    const data: any = {
      empCod: empCod,
      clienteId: dto.clientId,
      atendimStatus: shouldStartActive ? 'ATIVO' : 'PENDENTE',
    };

    if (dto.departamentoId) data.departamentoId = dto.departamentoId;

    // Se iniciando como ativo, definir atendente e horário de início humano
    if (shouldStartActive) {
      data.atendenteId = userId;
      data.atendimDtaHorHumanoIni = new Date();
    }

    const nextId = await this.getNextAtendimentoId(empCod);
    const atendimento = await (this.prisma as any).atendimento.create({
      data: { ...data, id: nextId },
    });
    return atendimento;
  }

  async inboundClientMessage(empCod: number, dto: InboundMessageDto) {
    // Cliente precisa estar vinculado à empresa
    const client = await this.prisma.pessoa.findFirst({
      where: { id: dto.clientId, empCod: empCod, type: 'CLIENTE' },
    });
    if (!client) throw new BadRequestException('Cliente não pertence à empresa ou é inválido');
    const nextId = await this.getNextAtendimentoId(empCod);
    const atendimento = await (this.prisma as any).atendimento.create({
      data: { empCod: empCod, id: nextId, clienteId: client.id, status: 'BOT' },
    });
    const message = await (this.prisma as any).mensagem.create({
      data: {
        msgGuid: randomUUID(),
        empCod: empCod,
        janAtendimId: atendimento.id,
        msgTip: 'CLIENT',
        msgTxt: dto.content,
        msgDtaHorEnv: new Date(),
        msgIsBot: false,
      },
    });

    // Atualizar atendimUltMsg no atendimento
    await (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimento.id } },
      data: {
        atendimDtaHorUltMsg: new Date(),
        atendimUltMsg: dto.content || '👤 Mensagem do cliente',
      },
    });

    return { atendimento, message, created: true };
  }

  async botMessage(empCod: number, atendimentoId: number, dto: BotMessageDto) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus !== 'BOT')
      throw new ConflictException('Atendimento não está em modo BOT');
    const message = await (this.prisma as any).mensagem.create({
      data: {
        msgGuid: randomUUID(),
        empCod: empCod,
        janAtendimId: atendimentoId,
        msgTip: 'BOT',
        msgTxt: dto.content,
        msgDtaHorEnv: new Date(),
        msgIsBot: true,
        msgArqTip: dto.mediaType,
      },
    });
    await (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimentoId } },
      data: {
        atendimDtaHorUltMsg: new Date(),
        atendimUltMsg: dto.content || '🤖 Mensagem do bot',
      },
    });
    return message;
  }

  async requestHuman(empCod: number, atendimentoId: number, dto: RequestHumanDto) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus !== 'BOT')
      throw new ConflictException('Escalonamento só permitido a partir de BOT');
    const dep = await (this.prisma as any).departamento.findFirst({
      where: { id: dto.departamentoId, empCod },
    });
    if (!dep) throw new NotFoundException('Departamento inválido');
    return (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimentoId } },
      data: { departamentoId: dep.id, status: 'PENDENTE' },
    });
  }

  private async ensureUser(empCod: number, userId: number) {
    const u = await this.prisma.pessoa.findFirst({
      where: { id: userId, empCod: empCod, type: 'USUARIO' },
    });
    if (!u) throw new ForbiddenException('Usuário inválido para a empresa');
    return u;
  }

  async sendMessage(empCod: number, userId: number, dto: SendMessageDto) {
    const user = await this.ensureUser(empCod, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: dto.atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus === 'ENCERRADO')
      throw new ForbiddenException('Atendimento encerrado');
    if (
      dto.senderType !== 'CLIENT' &&
      (atendimento as any).atendenteId &&
      (atendimento as any).atendenteId !== user.id
    ) {
      throw new ForbiddenException('Atendimento já está sob responsabilidade de outro atendente');
    }

    // Filtrar valores padrão inválidos do content
    let cleanContent: string | null = dto.content || null;
    const invalidDefaultValues = [
      'Imagem',
      'imagem',
      'IMAGEM',
      'Vídeo',
      'vídeo',
      'Video',
      'video',
      'VIDEO',
      'VÍDEO',
      'Documento',
      'documento',
      'DOCUMENTO',
      'Arquivo',
      'arquivo',
      'ARQUIVO',
      'Mídia',
      'mídia',
      'Media',
      'media',
      'MEDIA',
      'MÍDIA',
      'File',
      'file',
      'FILE',
      'Image',
      'image',
      'IMAGE',
      '"Imagem"',
      '"imagem"',
      '"IMAGEM"',
      '"Vídeo"',
      '"vídeo"',
      '"Video"',
      '"video"',
      '"VIDEO"',
      '"VÍDEO"',
      '"Documento"',
      '"documento"',
      '"DOCUMENTO"',
    ];

    // Se tem mídia e o content é um valor padrão inválido, definir como null
    if (dto.mediaType && cleanContent && invalidDefaultValues.includes(cleanContent.trim())) {
      console.warn('🚨 BACKEND: Valor padrão inválido detectado e filtrado:', cleanContent);
      cleanContent = null;
    }

    // Se tem mídia mas não tem content válido, usar null
    if (dto.mediaType && (!cleanContent || cleanContent.trim() === '')) {
      cleanContent = null;
    }

    const msgData: any = {
      atendimentoEmpresaId: empCod,
      atendimentoId: (atendimento as any).id,
      senderType: dto.senderType || 'ATTENDANT',
      content: cleanContent,
      mediaType: dto.mediaType, // Agora é 'IMAGE', 'VIDEO' ou 'DOCUMENT'
    };

    // Log para debug
    console.log('🔍 BACKEND sendMessage - Dados recebidos:', {
      originalContent: dto.content,
      cleanContent,
      mediaType: dto.mediaType,
      mediaUrl: dto.mediaUrl,
      mediaFilename: dto.mediaFilename,
    });

    // Adicionar metadados da mídia se houver
    if (dto.mediaUrl || dto.mediaFilename) {
      // Para áudios, se o mediaFilename termina com .mp3, atualizar a URL
      let finalMediaUrl = dto.mediaUrl;
      if (dto.mediaType === 'AUDIO' && dto.mediaFilename && dto.mediaFilename.endsWith('.mp3')) {
        // Construir URL correta para o arquivo MP3
        const baseUrl = process.env.API_BASE_URL || 'http://192.168.100.46:3523';
        finalMediaUrl = `${baseUrl}/uploads/chat/${dto.mediaFilename}`;
      }

      msgData.metadata = JSON.stringify({
        mediaUrl: finalMediaUrl,
        mediaFilename: dto.mediaFilename,
      });
    }

    if (dto.replyToId) msgData.replyToId = dto.replyToId;
    const now = new Date();
    const message = await (this.prisma as any).mensagem.create({
      data: {
        msgGuid: randomUUID(),
        empCod: empCod,
        janAtendimId: dto.atendimentoId,
        msgTip: dto.senderType,
        msgTxt: dto.content,
        msgDtaHorEnv: now,
        msgRemCod: dto.senderType === 'ATTENDANT' ? user.id : null,
        msgIsBot: dto.senderType === 'BOT',
        msgOldCod: dto.replyToId,
        // Campos de mídia
        msgArqGUID: dto.mediaUrl ? randomUUID() : null,
        msgArqNom: dto.mediaFilename,
        msgArqTip: dto.mediaType,
        msgArqURLFisVir: dto.mediaUrl,
        // Metadata como string JSON
        msgConteudo:
          dto.mediaUrl || dto.mediaFilename
            ? JSON.stringify({
                mediaUrl: dto.mediaUrl,
                mediaFilename: dto.mediaFilename,
              })
            : null,
      },
    });

    // Log da mensagem criada
    console.log('✅ BACKEND sendMessage - Mensagem criada:', {
      id: message.id,
      content: message.msgTxt,
      mediaType: message.msgArqTip,
      senderType: message.msgTip,
    });
    const update: any = { atendimDtaHorUltMsg: now };

    // Atualizar atendimUltMsg com o conteúdo da mensagem ou descrição da mídia
    if (cleanContent && cleanContent.trim() !== '') {
      // Se tem conteúdo (legenda) junto com mídia, formatar com ícone + legenda
      if (dto.mediaType) {
        if (dto.mediaType === 'IMAGE') {
          update.atendimUltMsg = `🖼️ ${cleanContent.trim()}`;
        } else if (dto.mediaType === 'VIDEO') {
          update.atendimUltMsg = `🎥 ${cleanContent.trim()}`;
        } else if (dto.mediaType === 'AUDIO') {
          update.atendimUltMsg = `🎤 ${cleanContent.trim()}`;
        } else {
          update.atendimUltMsg = `📄 ${cleanContent.trim()}`;
        }
      } else {
        // Apenas texto
        update.atendimUltMsg = cleanContent.trim();
      }
    } else if (dto.mediaType) {
      // Se não tem conteúdo mas tem mídia, criar descrição baseada no tipo
      if (dto.mediaType === 'IMAGE') {
        update.atendimUltMsg = '🖼️ Imagem';
      } else if (dto.mediaType === 'VIDEO') {
        update.atendimUltMsg = '🎥 Vídeo';
      } else if (dto.mediaType === 'AUDIO') {
        update.atendimUltMsg = '🎤 Áudio';
      } else {
        update.atendimUltMsg = dto.mediaFilename ? `📄 ${dto.mediaFilename}` : '📄 Documento';
      }
    }

    if (dto.senderType === 'ATTENDANT') {
      if (!(atendimento as any).atendenteId) update.atendenteId = user.id;
      if (
        (atendimento as any).atendimStatus === 'PENDENTE' ||
        (atendimento as any).atendimStatus === 'BOT'
      ) {
        update.atendimStatus = 'ATIVO';
        if (!(atendimento as any).atendimDtaHorHumanoIni) update.atendimDtaHorHumanoIni = now;
      }
    }
    await (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: (atendimento as any).id } },
      data: update,
    });
    return message;
  }

  async listMessages(empCod: number, atendimentoId: number, limit = 100, cursor?: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const take = Math.min(Math.max(limit, 1), 500);
    const messages = await (this.prisma as any).mensagem.findMany({
      where: {
        empCod: empCod,
        janAtendimId: atendimentoId,
        ...(cursor ? { id: { gt: cursor } } : {}),
      },
      orderBy: { id: 'asc' },
      take,
    });

    // Processar metadata (converter string JSON para objeto)
    const processedMessages = messages.map((msg: any) => {
      if (msg.msgConteudo && typeof msg.msgConteudo === 'string') {
        try {
          msg.metadata = JSON.parse(msg.msgConteudo);
        } catch (error) {
          console.warn('Erro ao fazer parse do metadata:', error);
          msg.metadata = null;
        }
      }

      // Mapear campos antigos para compatibilidade
      msg.content = msg.msgTxt;
      msg.mediaType = msg.msgArqTip;
      msg.senderType = msg.msgTip;
      msg.timestamp = msg.msgDtaHorEnv;
      msg.readAt = msg.msgDtaHorLid;
      msg.editedAt = msg.msgIsEdt ? msg.msgDtaHorEnv : null;
      msg.originalContent = msg.msgOldTxt;
      msg.replyToId = msg.msgOldCod;

      return msg;
    });

    // Log das mensagens retornadas (apenas com mídia)
    const mediaMessages = processedMessages.filter((msg: any) => msg.mediaType);
    if (mediaMessages.length > 0) {
      console.log(
        '📋 BACKEND listMessages - Mensagens com mídia:',
        mediaMessages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          mediaType: msg.mediaType,
          senderType: msg.senderType,
        })),
      );
    }

    return processedMessages;
  }

  async markRead(empCod: number, atendimentoId: number, messageId: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    return (this.prisma as any).mensagem.update({
      where: { id: messageId },
      data: { msgDtaHorLid: new Date() } as any,
    });
  }

  async bulkMarkRead(empCod: number, atendimentoId: number, olderThanId?: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const where: any = { empCod: empCod, janAtendimId: atendimentoId, msgDtaHorLid: null };
    if (olderThanId) where.id = { lte: olderThanId };
    const res = await (this.prisma as any).mensagem.updateMany({
      where,
      data: { msgDtaHorLid: new Date() } as any,
    });
    return { updated: res.count };
  }

  async updateMessage(
    empCod: number,
    atendimentoId: number,
    messageId: number,
    data: { content?: string; mediaType?: string },
  ) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const existing: any = await (this.prisma as any).mensagem.findFirst({
      where: { id: messageId, empCod: empCod, janAtendimId: atendimentoId },
    });
    if (!existing) throw new NotFoundException('Mensagem não encontrada');
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
    if (
      existing.msgDtaHorEnv &&
      existing.msgDtaHorEnv.getTime &&
      existing.msgDtaHorEnv.getTime() < fifteenMinAgo
    ) {
      throw new ForbiddenException('Janela de edição expirada');
    }
    const updateData: any = {};
    if (data.content && data.content !== existing.msgTxt) {
      updateData.msgOldTxt = existing.msgOldTxt ?? existing.msgTxt;
      updateData.msgTxt = data.content;
      updateData.msgIsEdt = true;
    }
    if (data.mediaType && data.mediaType !== existing.msgTip) {
      updateData.msgTip = data.mediaType;
      updateData.msgIsEdt = true;
    }
    if (Object.keys(updateData).length === 0) return existing;
    return (this.prisma as any).mensagem.update({ where: { id: messageId }, data: updateData });
  }

  async claim(empCod: number, atendimentoId: number, userId: number) {
    const user = await this.ensureUser(empCod, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus === 'ENCERRADO')
      throw new ForbiddenException('Atendimento encerrado');
    if ((atendimento as any).atendenteId && (atendimento as any).atendenteId !== user.id) {
      throw new ForbiddenException('Atendimento já está atribuído a outro atendente');
    }
    const update: any = {};
    if (!(atendimento as any).atendenteId) update.atendenteId = user.id;
    if (
      (atendimento as any).atendimStatus === 'PENDENTE' ||
      (atendimento as any).atendimStatus === 'BOT'
    )
      update.atendimStatus = 'ATIVO';
    if (!(atendimento as any).atendimDtaHorHumanoIni) update.atendimDtaHorHumanoIni = new Date();
    if (Object.keys(update).length === 0) return atendimento;
    return (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimentoId } },
      data: update,
    });
  }

  async close(empCod: number, atendimentoId: number, userId: number) {
    await this.ensureUser(empCod, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus === 'ENCERRADO') return atendimento;
    const update: any = { status: 'ENCERRADO', atendimDtaHorFin: new Date() };
    if (!(atendimento as any).atendenteId) {
      update.atendenteId = userId;
      if (!(atendimento as any).atendimDtaHorHumanoIni) update.atendimDtaHorHumanoIni = new Date();
    }
    return (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimentoId } },
      data: update,
    });
  }

  async transfer(
    empCod: number,
    atendimentoId: number,
    userId: number,
    dto: TransferAtendimentoDto,
  ) {
    const user = await this.ensureUser(empCod, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({
      where: { id: atendimentoId, empCod: empCod },
    });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).atendimStatus === 'ENCERRADO')
      throw new ForbiddenException('Atendimento encerrado');
    if (
      (atendimento as any).atendenteId &&
      (atendimento as any).atendenteId !== user.id &&
      dto.atendenteId &&
      dto.atendenteId !== (atendimento as any).atendenteId
    ) {
      throw new ForbiddenException(
        'Não é possível transferir - outro atendente possui o atendimento',
      );
    }
    const update: any = {};
    let targetDepartmentId = (atendimento as any).departamentoId;
    if (dto.departamentoId !== undefined) {
      const dep = await (this.prisma as any).departamento.findFirst({
        where: { id: dto.departamentoId, empCod },
      });
      if (!dep) throw new NotFoundException('Departamento destino inválido');
      update.departamentoId = dto.departamentoId;
      targetDepartmentId = dto.departamentoId;
    }
    if (dto.atendenteId !== undefined) {
      const att = await this.prisma.pessoa.findFirst({
        where: { id: dto.atendenteId, empCod: empCod, type: 'USUARIO' },
      });
      if (!att) throw new NotFoundException('Atendente destino inválido');
      if (targetDepartmentId) {
        const membership = await (this.prisma as any).departamentoPessoa.findFirst({
          where: { depCod: targetDepartmentId, userId: dto.atendenteId },
        });
        if (!membership)
          throw new BadRequestException('Atendente não pertence ao departamento destino');
      }
      update.atendenteId = dto.atendenteId;
    } else {
      // Se não foi especificado atendente na transferência, desatribui
      update.atendenteId = null;
    }
    // Após transferência, atendimento volta a ficar pendente
    update.atendimStatus = 'PENDENTE';
    // Não alterar atendimDtaHorHumanoIni neste fluxo
    return (this.prisma as any).atendimento.update({
      where: { empCod_id: { empCod: empCod, id: atendimentoId } },
      data: update,
    });
  }

  async list(
    empCod: number,
    opts: {
      atendimStatus?: string;
      departmentId?: number;
      limit?: number;
      attendantIdFilter?: number;
    } = {},
  ) {
    const where: any = { empCod: empCod };
    if (opts.atendimStatus) where.atendimStatus = opts.atendimStatus;
    if (opts.departmentId !== undefined) where.departamentoId = opts.departmentId;
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const baseQuery: any = {
      where,
      orderBy: { id: 'desc' },
      take,
      include: {
        client: { select: { id: true, name: true, chatName: true, phone: true, photoUrl: true } },
        department: { select: { id: true, depNom: true } },
      },
    };
    if (opts.atendimStatus === 'PENDENTE' && opts.attendantIdFilter) {
      baseQuery.where = {
        ...where,
        department: { users: { some: { userId: opts.attendantIdFilter } } },
      };
    }
    if (opts.atendimStatus === 'ENCERRADO') {
      // Histórico do dia: apenas atendimentos encerrados hoje e (se informado) do atendente logado
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      baseQuery.where = {
        ...baseQuery.where,
        atendimDtaHorFin: { gte: start, lt: end },
        ...(opts.attendantIdFilter ? { atendenteId: opts.attendantIdFilter } : {}),
      };
    }
    const rows = await (this.prisma as any).atendimento.findMany(baseQuery);
    // Mapear campos do cliente para português esperado no frontend
    return rows.map((r: any) => ({
      ...r,
      cliente: r.client
        ? {
            id: r.client.id,
            nome: r.client.chatName || r.client.name,
            telefone: r.client.phone,
            foto: r.client.photoUrl,
          }
        : null,
      departamento: r.department
        ? {
            id: r.department.id,
            name: r.department.depNom,
          }
        : null,
    }));
  }

  private async getNextAtendimentoId(empCod: number): Promise<number> {
    try {
      const last = await (this.prisma as any).atendimento.findFirst({
        where: { empCod: empCod },
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return (last?.id ?? 0) + 1;
    } catch (error) {
      return 1; // Se der erro, começa do 1
    }
  }
}
