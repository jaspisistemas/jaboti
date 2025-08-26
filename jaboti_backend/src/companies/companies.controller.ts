import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private companies: CompaniesService) {}

  @Get()
  async list(@CurrentUser('sub') userId: number) {
    return this.companies.listForUser(userId);
  }

  @Post()
  async create(@Body() dto: CreateCompanyDto, @CurrentUser('sub') userId: number) {
    return this.companies.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.companies.update(id, dto, userId);
  }

  @Post(':id/join')
  async join(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.companies.join(id, userId);
  }
}
