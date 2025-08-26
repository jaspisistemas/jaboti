import { Module } from '@nestjs/common';
import { DepartamentosService } from './departamentos.service';
import { DepartamentosController } from './departamentos.controller';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';

@Module({
  providers: [DepartamentosService, RequireCompanyGuard],
  controllers: [DepartamentosController],
})
export class DepartamentosModule {}
