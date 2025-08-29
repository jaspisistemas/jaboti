import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CodigoSequencialService } from './services/codigo-sequencial.service';

@Module({
  imports: [PrismaModule],
  providers: [CodigoSequencialService],
  exports: [CodigoSequencialService],
})
export class CommonModule {}
