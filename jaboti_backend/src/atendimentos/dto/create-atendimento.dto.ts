import { IsInt, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAtendimentoDto {
  @ApiProperty({ description: 'ID do cliente (Pessoa cliente) que inicia o atendimento', example: 101 })
  @IsInt()
  clientId!: number;

  @ApiProperty({ description: 'Departamento alvo opcional', example: 5, required: false })
  @IsOptional()
  @IsInt()
  departamentoId?: number;

  @ApiProperty({ description: 'Se true, inicia o atendimento como ativo (atribuído ao usuário logado)', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  startActive?: boolean;
}


