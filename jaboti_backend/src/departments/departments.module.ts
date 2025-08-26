// DEPRECATED English module - kept only for reference during migration to 'departamentos'
import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { RequireCompanyGuard } from '../common/guards/require-company.guard';

@Module({
  providers: [DepartmentsService, RequireCompanyGuard],
  controllers: [DepartmentsController],
})
export class DepartmentsModule {}
