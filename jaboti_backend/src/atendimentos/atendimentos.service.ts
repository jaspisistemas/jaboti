import { ForbiddenException, Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TransferAtendimentoDto } from './dto/transfer-atendimento.dto';
import { InboundMessageDto } from './dto/inbound-message.dto';
import { BotMessageDto } from './dto/bot-message.dto';
import { RequestHumanDto } from './dto/request-human.dto';

@Injectable()
export class AtendimentosService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: number, dto: CreateAtendimentoDto, userId?: number) {
    // Cliente precisa estar vinculado à empresa
    const client = await this.prisma.pessoa.findFirst({ where: { id: dto.clientId, companies: { some: { companyId } }, type: 'CLIENTE' } });
    if (!client) throw new BadRequestException('Cliente não pertence à empresa ou é inválido');
    // Não permitir novo atendimento se já existe um em andamento para este cliente
    const existing = await (this.prisma as any).atendimento.findFirst({
      where: { empresaId: companyId, clienteId: dto.clientId, status: { in: ['BOT', 'PENDENTE', 'ATIVO'] } },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new ConflictException(`Já existe um atendimento em andamento (ID ${existing.id}, status ${existing.status}) para este cliente`);
    }
    if (dto.departamentoId) {
      const dep = await this.prisma.department.findFirst({ where: { id: dto.departamentoId, companyId } });
      if (!dep) throw new NotFoundException('Departamento inválido');
    }
    
    // Determinar status inicial e campos relacionados
    const shouldStartActive = dto.startActive === true && userId;
    const data: any = { 
      empresaId: companyId, 
      clienteId: dto.clientId, 
      status: shouldStartActive ? 'ATIVO' : 'PENDENTE'
    };
    
    if (dto.departamentoId) data.departamentoId = dto.departamentoId;
    
    // Se iniciando como ativo, definir atendente e horário de início humano
    if (shouldStartActive) {
      data.atendenteId = userId;
      data.inicioHumanoEm = new Date();
    }
    
    const nextId = await this.getNextAtendimentoId(companyId);
    const atendimento = await (this.prisma as any).atendimento.create({ data: { ...data, id: nextId } });
    return atendimento;
  }

  async inboundClientMessage(companyId: number, dto: InboundMessageDto) {
    // Cliente precisa estar vinculado à empresa
    const client = await this.prisma.pessoa.findFirst({ where: { id: dto.clientId, companies: { some: { companyId } }, type: 'CLIENTE' } });
    if (!client) throw new BadRequestException('Cliente não pertence à empresa ou é inválido');
    const nextId = await this.getNextAtendimentoId(companyId);
    const atendimento = await (this.prisma as any).atendimento.create({ data: { empresaId: companyId, id: nextId, clienteId: client.id, status: 'BOT' } });
    const message = await this.prisma.message.create({ 
      data: { 
        atendimentoEmpresaId: companyId, 
        atendimentoId: atendimento.id, 
        senderType: 'CLIENT', 
        content: dto.content
      } 
    });
    
    // Atualizar ultimaMensagem no atendimento
    await (this.prisma as any).atendimento.update({ 
      where: { empresaId_id: { empresaId: companyId, id: atendimento.id } }, 
      data: { 
        ultimaMensagemEm: new Date(),
        ultimaMensagem: dto.content || '👤 Mensagem do cliente'
      } 
    });
    
    return { atendimento, message, created: true };
  }

  async botMessage(companyId: number, atendimentoId: number, dto: BotMessageDto) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status !== 'BOT') throw new ConflictException('Atendimento não está em modo BOT');
    const message = await this.prisma.message.create({ 
      data: { 
        atendimentoEmpresaId: companyId, 
        atendimentoId, 
        senderType: 'BOT', 
        content: dto.content, 
        mediaType: dto.mediaType
      } 
    });
    await (this.prisma as any).atendimento.update({ 
      where: { empresaId_id: { empresaId: companyId, id: atendimentoId } }, 
      data: { 
        ultimaMensagemEm: new Date(),
        ultimaMensagem: dto.content || '🤖 Mensagem do bot'
      } 
    });
    return message;
  }

  async requestHuman(companyId: number, atendimentoId: number, dto: RequestHumanDto) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status !== 'BOT') throw new ConflictException('Escalonamento só permitido a partir de BOT');
    const dep = await this.prisma.department.findFirst({ where: { id: dto.departamentoId, companyId } });
    if (!dep) throw new NotFoundException('Departamento inválido');
    return (this.prisma as any).atendimento.update({ where: { empresaId_id: { empresaId: companyId, id: atendimentoId } }, data: { departamentoId: dep.id, status: 'PENDENTE' } });
  }

  private async ensureUser(companyId: number, userId: number) {
    const u = await this.prisma.pessoa.findFirst({ where: { id: userId, companies: { some: { companyId } }, type: 'USUARIO' } });
    if (!u) throw new ForbiddenException('Usuário inválido para a empresa');
    return u;
  }

  async sendMessage(companyId: number, userId: number, dto: SendMessageDto) {
    const user = await this.ensureUser(companyId, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: dto.atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status === 'ENCERRADO') throw new ForbiddenException('Atendimento encerrado');
    if (dto.senderType !== 'CLIENT' && (atendimento as any).atendenteId && (atendimento as any).atendenteId !== user.id) {
      throw new ForbiddenException('Atendimento já está sob responsabilidade de outro atendente');
    }

    // Filtrar valores padrão inválidos do content
    let cleanContent: string | null = dto.content || null;
    const invalidDefaultValues = [
      'Imagem', 'imagem', 'IMAGEM',
      'Vídeo', 'vídeo', 'Video', 'video', 'VIDEO', 'VÍDEO',
      'Documento', 'documento', 'DOCUMENTO',
      'Arquivo', 'arquivo', 'ARQUIVO',
      'Mídia', 'mídia', 'Media', 'media', 'MEDIA', 'MÍDIA',
      'File', 'file', 'FILE',
      'Image', 'image', 'IMAGE',
      '"Imagem"', '"imagem"', '"IMAGEM"',
      '"Vídeo"', '"vídeo"', '"Video"', '"video"', '"VIDEO"', '"VÍDEO"',
      '"Documento"', '"documento"', '"DOCUMENTO"'
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
      atendimentoEmpresaId: companyId,
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
      mediaFilename: dto.mediaFilename
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
      
      msgData.metadata = {
        mediaUrl: finalMediaUrl,
        mediaFilename: dto.mediaFilename
      };
    }
    
    if (dto.replyToId) msgData.replyToId = dto.replyToId;
    const now = new Date();
    const message = await this.prisma.message.create({ 
      data: { 
        ...msgData, 
        senderUserId: msgData.senderType === 'ATTENDANT' ? user.id : null
      } 
    });
    
    // Log da mensagem criada
    console.log('✅ BACKEND sendMessage - Mensagem criada:', {
      id: message.id,
      content: message.content,
      mediaType: message.mediaType,
      senderType: message.senderType
    });
    const update: any = { ultimaMensagemEm: now };
    
    // Atualizar ultimaMensagem com o conteúdo da mensagem ou descrição da mídia
    if (cleanContent && cleanContent.trim() !== '') {
      // Se tem conteúdo (legenda) junto com mídia, formatar com ícone + legenda
      if (dto.mediaType) {
        if (dto.mediaType === 'IMAGE') {
          update.ultimaMensagem = `🖼️ ${cleanContent.trim()}`;
        } else if (dto.mediaType === 'VIDEO') {
          update.ultimaMensagem = `🎥 ${cleanContent.trim()}`;
        } else if (dto.mediaType === 'AUDIO') {
          update.ultimaMensagem = `🎤 ${cleanContent.trim()}`;
        } else {
          update.ultimaMensagem = `📄 ${cleanContent.trim()}`;
        }
      } else {
        // Apenas texto
        update.ultimaMensagem = cleanContent.trim();
      }
    } else if (dto.mediaType) {
      // Se não tem conteúdo mas tem mídia, criar descrição baseada no tipo
      if (dto.mediaType === 'IMAGE') {
        update.ultimaMensagem = '🖼️ Imagem';
      } else if (dto.mediaType === 'VIDEO') {
        update.ultimaMensagem = '🎥 Vídeo';
      } else if (dto.mediaType === 'AUDIO') {
        update.ultimaMensagem = '🎤 Áudio';
      } else {
        update.ultimaMensagem = dto.mediaFilename ? `📄 ${dto.mediaFilename}` : '📄 Documento';
      }
    }
    
    if (msgData.senderType === 'ATTENDANT') {
      if (!(atendimento as any).atendenteId) update.atendenteId = user.id;
      if ((atendimento as any).status === 'PENDENTE' || (atendimento as any).status === 'BOT') {
        update.status = 'ATIVO';
        if (!(atendimento as any).inicioHumanoEm) update.inicioHumanoEm = now;
      }
    }
    await (this.prisma as any).atendimento.update({ where: { empresaId_id: { empresaId: companyId, id: (atendimento as any).id } }, data: update });
    return message;
  }

  async listMessages(companyId: number, atendimentoId: number, limit = 100, cursor?: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const take = Math.min(Math.max(limit, 1), 500);
    const messages = await this.prisma.message.findMany({
      where: { atendimentoEmpresaId: companyId, atendimentoId, ...(cursor ? { id: { gt: cursor } } : {}) },
      orderBy: { id: 'asc' },
      take,
    });

    // Log das mensagens retornadas (apenas com mídia)
    const mediaMessages = messages.filter((msg: any) => msg.mediaType);
    if (mediaMessages.length > 0) {
      console.log('📋 BACKEND listMessages - Mensagens com mídia:', mediaMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        mediaType: msg.mediaType,
        senderType: msg.senderType
      })));
    }

    return messages;
  }

  async markRead(companyId: number, atendimentoId: number, messageId: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    return this.prisma.message.update({ where: { id: messageId }, data: { readAt: new Date() } as any });
  }

  async bulkMarkRead(companyId: number, atendimentoId: number, olderThanId?: number) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const where: any = { atendimentoEmpresaId: companyId, atendimentoId, readAt: null };
    if (olderThanId) where.id = { lte: olderThanId };
    const res = await this.prisma.message.updateMany({ where, data: { readAt: new Date() } as any });
    return { updated: res.count };
  }

  async updateMessage(companyId: number, atendimentoId: number, messageId: number, data: { content?: string; mediaType?: string }) {
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    const existing: any = await this.prisma.message.findFirst({ where: { id: messageId, atendimentoEmpresaId: companyId, atendimentoId } });
    if (!existing) throw new NotFoundException('Mensagem não encontrada');
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
    if (existing.timestamp && existing.timestamp.getTime && existing.timestamp.getTime() < fifteenMinAgo) {
      throw new ForbiddenException('Janela de edição expirada');
    }
    const updateData: any = {};
    if (data.content && data.content !== existing.content) {
      updateData.originalContent = existing.originalContent ?? existing.content;
      updateData.content = data.content;
      updateData.editedAt = new Date();
    }
    if (data.mediaType && data.mediaType !== existing.mediaType) {
      updateData.mediaType = data.mediaType;
      updateData.editedAt = new Date();
    }
    if (Object.keys(updateData).length === 0) return existing;
    return this.prisma.message.update({ where: { id: messageId }, data: updateData });
  }

  async claim(companyId: number, atendimentoId: number, userId: number) {
    const user = await this.ensureUser(companyId, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status === 'ENCERRADO') throw new ForbiddenException('Atendimento encerrado');
    if ((atendimento as any).atendenteId && (atendimento as any).atendenteId !== user.id) {
      throw new ForbiddenException('Atendimento já está atribuído a outro atendente');
    }
    const update: any = {};
    if (!(atendimento as any).atendenteId) update.atendenteId = user.id;
    if ((atendimento as any).status === 'PENDENTE' || (atendimento as any).status === 'BOT') update.status = 'ATIVO';
    if (!(atendimento as any).inicioHumanoEm) update.inicioHumanoEm = new Date();
    if (Object.keys(update).length === 0) return atendimento;
    return (this.prisma as any).atendimento.update({ where: { empresaId_id: { empresaId: companyId, id: atendimentoId } }, data: update });
  }

  async close(companyId: number, atendimentoId: number, userId: number) {
    await this.ensureUser(companyId, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status === 'ENCERRADO') return atendimento;
    const update: any = { status: 'ENCERRADO', fimEm: new Date() };
    if (!(atendimento as any).atendenteId) {
      update.atendenteId = userId;
      if (!(atendimento as any).inicioHumanoEm) update.inicioHumanoEm = new Date();
    }
    return (this.prisma as any).atendimento.update({ where: { empresaId_id: { empresaId: companyId, id: atendimentoId } }, data: update });
  }

  async transfer(companyId: number, atendimentoId: number, userId: number, dto: TransferAtendimentoDto) {
    const user = await this.ensureUser(companyId, userId);
    const atendimento = await (this.prisma as any).atendimento.findFirst({ where: { id: atendimentoId, empresaId: companyId } });
    if (!atendimento) throw new NotFoundException('Atendimento não encontrado');
    if ((atendimento as any).status === 'ENCERRADO') throw new ForbiddenException('Atendimento encerrado');
    if ((atendimento as any).atendenteId && (atendimento as any).atendenteId !== user.id && dto.atendenteId && dto.atendenteId !== (atendimento as any).atendenteId) {
      throw new ForbiddenException('Não é possível transferir - outro atendente possui o atendimento');
    }
    const update: any = {};
    let targetDepartmentId = (atendimento as any).departamentoId;
    if (dto.departamentoId !== undefined) {
      const dep = await this.prisma.department.findFirst({ where: { id: dto.departamentoId, companyId } });
      if (!dep) throw new NotFoundException('Departamento destino inválido');
      update.departamentoId = dto.departamentoId;
      targetDepartmentId = dto.departamentoId;
    }
    if (dto.atendenteId !== undefined) {
      const att = await this.prisma.pessoa.findFirst({ where: { id: dto.atendenteId, companies: { some: { companyId } }, type: 'USUARIO' } });
      if (!att) throw new NotFoundException('Atendente destino inválido');
      if (targetDepartmentId) {
        const membership = await this.prisma.departmentUser.findFirst({ where: { departmentId: targetDepartmentId, userId: dto.atendenteId } });
        if (!membership) throw new BadRequestException('Atendente não pertence ao departamento destino');
      }
      update.atendenteId = dto.atendenteId;
    } else {
      // Se não foi especificado atendente na transferência, desatribui
      update.atendenteId = null;
    }
    // Após transferência, atendimento volta a ficar pendente
    update.status = 'PENDENTE';
    // Não alterar inicioHumanoEm neste fluxo
    return (this.prisma as any).atendimento.update({ where: { empresaId_id: { empresaId: companyId, id: atendimentoId } }, data: update });
  }

  async list(companyId: number, opts: { status?: string; departmentId?: number; limit?: number; attendantIdFilter?: number } = {}) {
    const where: any = { empresaId: companyId };
    if (opts.status) where.status = opts.status;
    if (opts.departmentId !== undefined) where.departamentoId = opts.departmentId;
    const take = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const baseQuery: any = {
      where,
      orderBy: { id: 'desc' },
      take,
      include: {
        client: { select: { id: true, name: true, chatName: true, phone: true, photoUrl: true } },
        department: { select: { id: true, name: true } },
      },
    };
    if (opts.status === 'PENDENTE' && opts.attendantIdFilter) {
      baseQuery.where = { ...where, department: { users: { some: { userId: opts.attendantIdFilter } } } };
    }
    if (opts.status === 'ENCERRADO') {
      // Histórico do dia: apenas atendimentos encerrados hoje e (se informado) do atendente logado
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
      baseQuery.where = {
        ...baseQuery.where,
        fimEm: { gte: start, lt: end },
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
            name: r.department.name,
          }
        : null,
    }));
  }

  private async getNextAtendimentoId(companyId: number): Promise<number> {
    const last = await (this.prisma as any).atendimento.findFirst({ where: { empresaId: companyId }, orderBy: { id: 'desc' }, select: { id: true } }).catch(() => null);
    return (last?.id ?? 0) + 1;
  }
}


