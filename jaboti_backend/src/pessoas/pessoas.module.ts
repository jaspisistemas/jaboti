import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoasController } from './pessoas.controller';
import { PessoasService } from './pessoas.service';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [PessoasService],
  controllers: [PessoasController],
  exports: [PessoasService],
})
export class PessoasModule {}
