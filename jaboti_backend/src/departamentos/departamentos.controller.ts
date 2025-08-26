import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiBadRequestResponse } from '@nestjs/swagger';
import { AddMembrosDepartamentoDto } from './dto/add-membros-departamento.dto';

@ApiTags('departamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireCompanyGuard)
@Controller('departamentos')
export class DepartamentosController {
  constructor(private deps: DepartamentosService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista departamentos da empresa atual', schema: { example: [{ id: 1, nome: 'Atendimento', createdAt: '2025-01-01T12:00:00Z' }] } })
  async listar(@CurrentCompanyId() companyId: number, @CurrentUser('sub') userId: number) {
    return this.deps.listar(companyId, userId);
  }

  @Post()
  async criar(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateDepartamentoDto,
  ) {
    return this.deps.criar(companyId, userId, dto);
  }

  @Patch(':id')
  async atualizar(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartamentoDto,
  ) {
    return this.deps.atualizar(companyId, id, userId, dto);
  }

  @Get(':id')
  async obter(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deps.obter(companyId, id, userId);
  }

  @Delete(':id')
  async remover(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deps.remover(companyId, id, userId);
  }

  // Membros
  @Get(':id/membros')
  @ApiOkResponse({ description: 'Lista membros (pessoas) do departamento', schema: { example: [{ id: 10, name: 'João Operador', type: 'USUARIO' }] } })
  listarMembros(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deps.listarMembros(companyId, id, userId);
  }

  @Post(':id/membros')
  @ApiOkResponse({ description: 'Adiciona membros ao departamento', schema: { example: { mensagem: '2 atendente(s) adicionado(s)', adicionados: [1,2], jaAdicionados: [3], naoEncontrados: [99] } } })
  @ApiBadRequestResponse({ description: 'Somente atendentes (USUARIO) podem ser adicionados ao departamento' })
  adicionarMembros(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMembrosDepartamentoDto,
  ) {
    return this.deps.adicionarMembros(companyId, id, userId, dto);
  }

  @Delete(':id/membros/:pessoaId')
  @ApiOkResponse({ description: 'Remove membro do departamento', schema: { example: { removido: true } } })
  removerMembro(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('pessoaId', ParseIntPipe) pessoaId: number,
  ) {
    return this.deps.removerMembro(companyId, id, userId, pessoaId);
  }
}
