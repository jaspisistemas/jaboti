// DEPRECATED: Use Portugues endpoints em 'departamentos'. This controller kept temporarily for backward compatibility if re-enabled.
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentCompanyId } from '../common/decorators/current-company.decorator';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('departamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RequireCompanyGuard)
@Controller('departamentos')
export class DepartmentsController {
  constructor(private departments: DepartmentsService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista departamentos da empresa atual', schema: { example: [{ id: 1, nome: 'Atendimento', depDtaCri: '2025-01-01T12:00:00Z' }] } })
  async list(@CurrentCompanyId() companyId: number, @CurrentUser('sub') userId: number) {
    const list = await this.departments.list(companyId, userId);
    return list.map(d => ({ id: d.id, nome: d.depNom, depDtaCri: d.depDtaCri, depUltAtu: d.depUltAtu }));
  }

  @Post()
  async create(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateDepartmentDto,
  ) {
    const dep = await this.departments.create(companyId, userId, dto);
    return { id: dep.id, nome: dep.depNom, depDtaCri: dep.depDtaCri, depUltAtu: dep.depUltAtu };
  }

  @Patch(':id')
  async update(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const dep = await this.departments.update(companyId, id, userId, dto);
    return { id: dep.id, nome: dep.depNom, depDtaCri: dep.depDtaCri, depUltAtu: dep.depUltAtu };
  }

  @Get(':id')
  async get(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const dep = await this.departments.get(companyId, id, userId);
    return { id: dep.id, nome: dep.depNom, depDtaCri: dep.depDtaCri, depUltAtu: dep.depUltAtu };
  }

  @Delete(':id')
  async remove(
    @CurrentCompanyId() companyId: number,
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departments.remove(companyId, id, userId);
  }
}
