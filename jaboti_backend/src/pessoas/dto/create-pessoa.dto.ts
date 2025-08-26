import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsEnum, MinLength, MaxLength, IsDateString, IsBoolean } from 'class-validator';
import { PessoaTipo, Genero, LeadStage, CanalPreferido } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePessoaDto {
  @ApiPropertyOptional({ description: 'Username para login (USUARIO). Se omitido, usa name', example: 'joao' })
  @IsOptional() @IsString() @Length(2, 120)
  user?: string;

  @ApiProperty({ example: 'João da Silva' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '+5511999999999', minLength:5, maxLength:30 })
  @IsOptional() @IsString() @Length(5,30)
  phone?: string;

  @ApiPropertyOptional({ example: 'joao@empresa.com' })
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

  @ApiPropertyOptional({ enum: Genero, example: 'MASCULINO' })
  @IsOptional() @IsEnum(Genero)
  genero?: Genero;

  @ApiPropertyOptional({ description: 'Nome curto para chat', example: 'João S.' })
  @IsOptional() @IsString() @Length(1,120)
  chatName?: string;

  @ApiPropertyOptional({ description: 'CEP', example: '01310-100' })
  @IsOptional() @IsString() @Length(4,12)
  cep?: string;
  @ApiPropertyOptional({ description: 'Endereço', example: 'Av. Paulista' })
  @IsOptional() @IsString() @Length(1,180)
  endereco?: string;
  @ApiPropertyOptional({ description: 'Número', example: '1000' })
  @IsOptional() @IsString() @Length(0,12)
  numero?: string;
  @ApiPropertyOptional({ description: 'Complemento', example: 'Conj. 101' })
  @IsOptional() @IsString() @Length(0,60)
  complemento?: string;
  @ApiPropertyOptional({ description: 'Bairro', example: 'Bela Vista' })
  @IsOptional() @IsString() @Length(0,90)
  bairro?: string;
  @ApiPropertyOptional({ description: 'Cidade', example: 'São Paulo' })
  @IsOptional() @IsString() @Length(0,90)
  cidade?: string;
  @ApiPropertyOptional({ description: 'UF', example: 'SP' })
  @IsOptional() @IsString() @Length(2,2)
  estado?: string;

  @ApiPropertyOptional({ description: 'Empresa (Lead B2B)', example: 'ACME S/A' })
  @IsOptional() @IsString() @Length(0,140)
  empresa?: string;
  @ApiPropertyOptional({ description: 'Cargo', example: 'Comprador' })
  @IsOptional() @IsString() @Length(0,90)
  cargo?: string;
  @ApiPropertyOptional({ description: 'Origem do lead', example: 'Landing Page' })
  @IsOptional() @IsString() @Length(0,60)
  origem?: string;
  @ApiPropertyOptional({ enum: LeadStage, description: 'Estágio do lead', example: 'LEAD' })
  @IsOptional() @IsEnum(LeadStage)
  etapa?: LeadStage;
  @ApiPropertyOptional({ description: 'Interesses (JSON)', example: ['produtoA','servicoB'] })
  @IsOptional()
  interesses?: any;
  @ApiPropertyOptional({ description: 'Tags', example: ['vip','trial'] })
  @IsOptional()
  tags?: string[];
  @ApiPropertyOptional({ enum: CanalPreferido, description: 'Canal preferido de contato', example: 'WHATSAPP' })
  @IsOptional() @IsEnum(CanalPreferido)
  canalPreferido?: CanalPreferido;
  @ApiPropertyOptional({ description: 'Aceita comunicações de marketing', example: true })
  @IsOptional() @IsBoolean()
  consenteMarketing?: boolean;
  @ApiPropertyOptional({ description: 'Opt-in de WhatsApp', example: true })
  @IsOptional() @IsBoolean()
  whatsappOptIn?: boolean;
  @ApiPropertyOptional({ description: 'Observações gerais', example: 'Cliente prefere atendimento à tarde.' })
  @IsOptional() @IsString() @Length(0, 1000)
  observacoes?: string;

  @ApiProperty({ enum: PessoaTipo, example: PessoaTipo.CLIENTE })
  @IsEnum(PessoaTipo)
  type!: PessoaTipo; // CLIENTE ou USUARIO

  @ApiPropertyOptional({ description: 'Senha inicial (apenas para USUARIO). Se omitida: "changeme"', minLength: 6, example: 'SenhaForte123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ description: 'URL da foto / avatar', example: 'https://cdn.exemplo.com/avatars/joao.png' })
  @IsOptional()
  @IsString()
  @Length(5, 50000)
  photoUrl?: string;
}
