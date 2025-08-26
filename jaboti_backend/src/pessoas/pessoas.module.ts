import { Module } from '@nestjs/common';
import { PessoasService } from './pessoas.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PessoasController } from './pessoas.controller';

@Module({
  imports: [PrismaModule],
  providers: [PessoasService],
  controllers: [PessoasController],
  exports: [PessoasService],
})
export class PessoasModule {}
