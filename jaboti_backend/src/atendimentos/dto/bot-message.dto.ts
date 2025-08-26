import { IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BotMessageDto {
  @ApiProperty({ description: 'Conteúdo da mensagem do BOT', example: 'Sou o assistente virtual, em que posso ajudar?' })
  @IsString()
  @Length(1, 4000)
  content!: string;

  @ApiPropertyOptional({ description: 'Tipo de mídia', example: 'image/png' })
  @IsOptional()
  @IsString()
  mediaType?: string;
}


