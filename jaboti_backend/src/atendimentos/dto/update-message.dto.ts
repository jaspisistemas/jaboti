import { IsOptional, IsString, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Novo conteúdo da mensagem', example: 'Atualizando a informação enviada.' })
  @IsOptional()
  @IsString()
  @Length(1, 4000)
  content?: string;

  @ApiPropertyOptional({ description: 'Novo tipo de mídia', example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  mediaType?: string;
}


