import { IsEmail, IsOptional, IsString, Length, MinLength, MaxLength, IsDateString, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePessoaDto {
  @ApiPropertyOptional({ example: 'joao' })
  @IsOptional() @IsString() @Length(2, 120)
  user?: string;

  @ApiPropertyOptional({ example: 'João Atualizado' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+5511888887777', minLength:5, maxLength:30 })
  @IsOptional() @IsString() @Length(5,30)
  phone?: string;

  @ApiPropertyOptional({ example: 'joao.novo@empresa.com' })
  @IsOptional() @IsEmail({ require_tld: false })
  email?: string;

  @ApiPropertyOptional({ description: 'Documento (CPF/CNPJ/Outro)', example: '123.456.789-00' })
  @IsOptional() @IsString() @Length(3, 40)
  documento?: string;

  @ApiPropertyOptional({ description: 'Tipo do documento', example: 'CPF' })
  @IsOptional() @IsString() @Length(2, 16)
  tipoDocumento?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento (YYYY-MM-DD)', example: '1990-05-20' })
  @IsOptional() @IsDateString()
  dataNascimento?: string;

  @ApiPropertyOptional({ enum: ['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO'] })
  @IsOptional() @IsIn(['MASCULINO', 'FEMININO', 'OUTRO', 'NAO_INFORMADO'])
  genero?: string;

  @ApiPropertyOptional({ example: 'João N.' })
  @IsOptional() @IsString() @Length(1,120)
  chatName?: string;

  @ApiPropertyOptional({ description: 'CEP', example: '01310-100' })
  @IsOptional() @IsString() @Length(4,12)
  cep?: string;
  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional() @IsString() @Length(0,180)
  endereco?: string;
  @ApiPropertyOptional({ description: 'Número' })
  @IsOptional() @IsString() @Length(0,12)
  numero?: string;
  @ApiPropertyOptional({ description: 'Complemento' })
  @IsOptional() @IsString() @Length(0,60)
  complemento?: string;
  @ApiPropertyOptional({ description: 'Bairro' })
  @IsOptional() @IsString() @Length(0,90)
  bairro?: string;
  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional() @IsString() @Length(0,90)
  cidade?: string;
  @ApiPropertyOptional({ description: 'UF' })
  @IsOptional() @IsString() @Length(2,2)
  estado?: string;

  @ApiPropertyOptional({ description: 'Empresa (Lead B2B)' })
  @IsOptional() @IsString() @Length(0,140)
  empresa?: string;
  @ApiPropertyOptional({ description: 'Cargo' })
  @IsOptional() @IsString() @Length(0,90)
  cargo?: string;
  @ApiPropertyOptional({ description: 'Origem do lead' })
  @IsOptional() @IsString() @Length(0,60)
  origem?: string;
  @ApiPropertyOptional({ enum: ['LEAD', 'OPORTUNIDADE', 'CLIENTE', 'INATIVO'] })
  @IsOptional() @IsIn(['LEAD', 'OPORTUNIDADE', 'CLIENTE', 'INATIVO'])
  etapa?: string;
  @ApiPropertyOptional({ description: 'Interesses (JSON)' })
  @IsOptional()
  interesses?: any;
  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  tags?: string[];
  @ApiPropertyOptional({ enum: ['WHATSAPP', 'EMAIL', 'TELEFONE', 'SMS', 'OUTRO'] })
  @IsOptional() @IsIn(['WHATSAPP', 'EMAIL', 'TELEFONE', 'SMS', 'OUTRO'])
  canalPreferido?: string;
  @ApiPropertyOptional({ description: 'Aceita comunicações de marketing' })
  @IsOptional() @IsBoolean()
  consenteMarketing?: boolean;
  @ApiPropertyOptional({ description: 'Opt-in de WhatsApp' })
  @IsOptional() @IsBoolean()
  whatsappOptIn?: boolean;
  @ApiPropertyOptional({ description: 'Observações gerais' })
  @IsOptional() @IsString() @Length(0, 1000)
  observacoes?: string;

  @ApiPropertyOptional({ enum: ['CLIENTE', 'USUARIO'] })
  @IsOptional() @IsIn(['CLIENTE', 'USUARIO'])
  type?: string;

  @ApiPropertyOptional({ description: 'Nova senha (USUARIO).', minLength: 6, example: 'NovaSenhaSegura456' })
  @IsOptional() @IsString() @MinLength(6) @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ description: 'URL da foto / avatar', example: 'https://cdn.exemplo.com/avatars/joao2.png' })
  @IsOptional() @IsString() @Length(5, 50000)
  photoUrl?: string;
}
