import { IsInt, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InboundMessageDto {
  @ApiProperty({ description: 'Cliente (Pessoa) remetente', example: 70 })
  @IsInt()
  clientId!: number;

  @ApiProperty({ description: 'Conteúdo da mensagem do cliente' })
  @IsString()
  @Length(1, 4000)
  content!: string;
}


