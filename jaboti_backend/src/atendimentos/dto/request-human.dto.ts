import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestHumanDto {
  @ApiProperty({ description: 'Departamento alvo', example: 5 })
  @IsInt()
  departamentoId!: number;
}


