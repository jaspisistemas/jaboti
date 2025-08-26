import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartamentoDto {
  @ApiProperty({ example: 'Atendimento', description: 'Nome do departamento (exibido nas telas)' })
  @IsString()
  @IsNotEmpty()
  nome!: string;
}
