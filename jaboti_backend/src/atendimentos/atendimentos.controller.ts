import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';
import { AtendimentosService } from './atendimentos.service';
import { BotMessageDto } from './dto/bot-message.dto';
import { CreateAtendimentoDto } from './dto/create-atendimento.dto';
import { InboundMessageDto } from './dto/inbound-message.dto';
import { RequestHumanDto } from './dto/request-human.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TransferAtendimentoDto } from './dto/transfer-atendimento.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

@ApiTags('atendimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireCompanyGuard)
@Controller('atendimentos')
export class AtendimentosController {
  constructor(private service: AtendimentosService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Atendimento criado',
    schema: {
      example: {
        empresaId: 10,
        id: 1,
        clienteId: 55,
        status: 'ATIVO',
        atendenteId: 123,
        inicioEm: '2025-01-01T12:00:00Z',
        inicioHumanoEm: '2025-01-01T12:00:00Z',
      },
    },
  })
  create(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateAtendimentoDto,
  ) {
    return this.service.create(companyId, dto, userId);
  }

  @Get()
  @ApiOkResponse({
    description: 'Lista atendimentos (fila / filtro)',
    schema: {
      example: [{ empresaId: 10, id: 1, status: 'PENDENTE', clienteId: 5, departamentoId: 2 }],
    },
  })
  list(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Query('status') status?: string,
    @Query('departamentoId') departamentoId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(companyId, {
      atendimStatus: status,
      departmentId: departamentoId ? parseInt(departamentoId, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      attendantIdFilter: status === 'PENDENTE' || status === 'ENCERRADO' ? userId : undefined,
    });
  }

  @Post('message')
  @ApiCreatedResponse({
    description: 'Mensagem enviada',
    schema: {
      example: {
        id: 1,
        atendimentoId: 1,
        senderType: 'ATTENDANT',
        senderUserId: 99,
        content: 'Olá',
        timestamp: '2025-01-01T12:00:05Z',
      },
    },
  })
  send(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(companyId, userId, dto);
  }

  @Get(':id/messages')
  @ApiOkResponse({
    description: 'Lista mensagens do atendimento',
    schema: { example: [{ id: 1, content: 'Olá', senderType: 'ATTENDANT' }] },
  })
  listMessages(
    @CurrentCompanyId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.listMessages(
      companyId,
      id,
      limit ? parseInt(limit, 10) : 100,
      cursor ? parseInt(cursor, 10) : undefined,
    );
  }

  @Patch(':atendimentoId/messages/:messageId/read')
  @ApiOkResponse({
    description: 'Mensagem marcada como lida',
    schema: { example: { id: 10, readAt: '2025-01-01T12:05:00Z' } },
  })
  markRead(
    @CurrentCompanyId() companyId: number,
    @Param('atendimentoId', ParseIntPipe) atendimentoId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
  ) {
    return this.service.markRead(companyId, atendimentoId, messageId);
  }

  @Patch(':atendimentoId/messages/read-bulk/:olderThanId?')
  @ApiOkResponse({
    description: 'Mensagens marcadas como lidas em lote',
    schema: { example: { updated: 42 } },
  })
  bulkRead(
    @CurrentCompanyId() companyId: number,
    @Param('atendimentoId', ParseIntPipe) atendimentoId: number,
    @Param('olderThanId') olderThanId?: string,
  ) {
    return this.service.bulkMarkRead(
      companyId,
      atendimentoId,
      olderThanId ? parseInt(olderThanId, 10) : undefined,
    );
  }

  @Patch(':atendimentoId/messages/:messageId')
  @ApiOkResponse({
    description: 'Mensagem atualizada (edição)',
    schema: {
      example: {
        id: 10,
        content: 'Novo texto',
        editedAt: '2025-01-01T12:06:00Z',
        originalContent: 'Texto antigo',
      },
    },
  })
  updateMessage(
    @CurrentCompanyId() companyId: number,
    @Param('atendimentoId', ParseIntPipe) atendimentoId: number,
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.service.updateMessage(companyId, atendimentoId, messageId, dto);
  }

  @Patch(':id/claim')
  @ApiOkResponse({
    description: 'Atendimento assumido',
    schema: {
      example: { id: 1, atendenteId: 99, status: 'ATIVO', inicioHumanoEm: '2025-01-01T12:01:00Z' },
    },
  })
  claim(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.claim(companyId, id, userId);
  }

  @Patch(':id/close')
  @ApiOkResponse({
    description: 'Atendimento encerrado',
    schema: { example: { id: 1, status: 'ENCERRADO', fimEm: '2025-01-01T13:00:00Z' } },
  })
  close(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.close(companyId, id, userId);
  }

  @Patch(':id/transfer')
  @ApiOkResponse({
    description: 'Atendimento transferido',
    schema: { example: { id: 1, departamentoId: 7, atendenteId: 55, status: 'ATIVO' } },
  })
  @ApiBadRequestResponse({ description: 'Atendente não pertence ao departamento destino' })
  transfer(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TransferAtendimentoDto,
  ) {
    return this.service.transfer(companyId, id, userId, dto);
  }

  @Post('inbound')
  @ApiCreatedResponse({
    description: 'Mensagem inbound registrada e atendimento criado',
    schema: {
      example: {
        atendimento: { empresaId: 10, id: 10, status: 'BOT' },
        message: { id: 500, senderType: 'CLIENT', content: 'Olá' },
        created: true,
      },
    },
  })
  inbound(@CurrentCompanyId() companyId: number, @Body() dto: InboundMessageDto) {
    return this.service.inboundClientMessage(companyId, dto);
  }

  @Post(':id/bot-message')
  @ApiCreatedResponse({
    description: 'Mensagem BOT registrada',
    schema: { example: { id: 999, senderType: 'BOT', content: 'Como posso ajudar?' } },
  })
  botMessage(
    @CurrentCompanyId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BotMessageDto,
  ) {
    return this.service.botMessage(companyId, id, dto);
  }

  @Patch(':id/request-human')
  @ApiOkResponse({
    description: 'Atendimento escalonado para humano',
    schema: { example: { id: 10, status: 'PENDENTE', departamentoId: 5 } },
  })
  requestHuman(
    @CurrentCompanyId() companyId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestHumanDto,
  ) {
    return this.service.requestHuman(companyId, id, dto);
  }
}
