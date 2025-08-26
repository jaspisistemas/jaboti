import { IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TransferAtendimentoDto {
  @ApiPropertyOptional({ description: 'Novo departamento', example: 5 })
  @IsOptional()
  @IsInt()
  departamentoId?: number;

  @ApiPropertyOptional({ description: 'Novo atendente', example: 61 })
  @IsOptional()
  @IsInt()
  atendenteId?: number;
}


