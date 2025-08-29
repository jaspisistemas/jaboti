import { Controller, Get, Query, Post, Body, Param, ParseIntPipe, Patch, Delete, UseGuards } from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PessoaResponseDto } from './dto/pessoa-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('pessoas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireCompanyGuard)
@Controller('pessoas')
export class PessoasController {
  constructor(private service: PessoasService) {}

  @Get()
  @ApiQuery({ name: 'tipo', required: false, enum: ['CLIENTE','USUARIO'], description: 'Filtra por tipo (CLIENTE/USUARIO)' })
  @ApiQuery({ name: 'q', required: false, description: 'Busca parcial em name, email, phone' })
  @ApiQuery({ name: 'page', required: false, description: 'Página (1..n)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página (1..200)' })
  @ApiOkResponse({ type: PessoaResponseDto, isArray: true })
  list(@CurrentCompanyId() companyId: number, @Query('tipo') tipo?: any, @Query('q') q?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    if (page || limit) {
      return this.service.listPaged(companyId, { tipo, q, page: Number(page || 1), limit: Number(limit || 20) }).then((res: any) => ({ ...res, items: res.items.map(this.safe) }));
    }
    return this.service.list(companyId, tipo, q).then(items => items.map(this.safe));
  }

  @Get('me')
  @ApiOkResponse({ type: PessoaResponseDto })
  me(@CurrentCompanyId() companyId: number, @CurrentUser('sub') userId: number) {
  return this.service.get(companyId, userId).then(this.safe);
  }

  @Post()
  @ApiOkResponse({ type: PessoaResponseDto })
  create(@CurrentCompanyId() companyId: number, @Body() dto: CreatePessoaDto) {
  return this.service.create(companyId, dto).then(this.safe);
  }

  @Get(':id')
  @ApiOkResponse({ type: PessoaResponseDto })
  get(@CurrentCompanyId() companyId: number, @Param('id', ParseIntPipe) id: number) {
  return this.service.get(companyId, id).then(this.safe);
  }

  @Patch(':id')
  @ApiOkResponse({ type: PessoaResponseDto })
  update(@CurrentCompanyId() companyId: number, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePessoaDto) {
  return this.service.update(companyId, id, dto).then(this.safe);
  }

  @Delete(':id')
  remove(@CurrentCompanyId() companyId: number, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(companyId, id);
  }

  @Post('change-password')
  changePassword(@CurrentCompanyId() companyId: number, @CurrentUser('sub') userId: number, @Body() dto: ChangePasswordDto) {
    return this.service.changePassword(companyId, userId, dto);
  }

  private safe = (p: any) => {
    if (!p) return p;
    const { passwordHash, ...rest } = p;
    return rest;
  };
}
