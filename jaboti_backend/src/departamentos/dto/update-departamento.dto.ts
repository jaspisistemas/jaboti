import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartamentoDto {
  @ApiPropertyOptional({ example: 'Suporte Nível 2', description: 'Novo nome do departamento' })
  @IsString()
  @IsOptional()
  nome?: string;
}
