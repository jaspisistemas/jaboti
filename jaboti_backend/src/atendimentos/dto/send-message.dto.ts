import { IsIn, IsInt, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 2001, description: 'Atendimento ID' })
  @IsInt()
  atendimentoId!: number;

  @ApiPropertyOptional({ example: 'Olá, tudo bem?', description: 'Conteúdo textual (opcional para mídias)' })
  @IsOptional()
  @IsString()
  @Length(0, 4000)
  content?: string;

  @ApiPropertyOptional({ 
    example: 'IMAGE', 
    description: 'Tipo de mídia baseado na intenção do usuário (IMAGE, VIDEO, DOCUMENT, AUDIO)',
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']
  })
  @IsOptional()
  @IsString()
  @IsIn(['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO'])
  mediaType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';

  @ApiPropertyOptional({ example: 'http://.../uploads/chat-images/file.jpg', description: 'URL da mídia se houver' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ example: 'abc123.jpg', description: 'Nome do arquivo da mídia se houver' })
  @IsOptional()
  @IsString()
  mediaFilename?: string;

  @ApiPropertyOptional({ example: 1234, description: 'Mensagem que está sendo respondida' })
  @IsOptional()
  @IsInt()
  replyToId?: number;

  @ApiPropertyOptional({
    description: 'Tipo do remetente',
    enum: ['CLIENT', 'ATTENDANT', 'BOT'],
    example: 'ATTENDANT',
  })
  @IsOptional()
  @IsString()
  @IsIn(['CLIENT', 'ATTENDANT', 'BOT'])
  senderType?: 'CLIENT' | 'ATTENDANT' | 'BOT';
}


