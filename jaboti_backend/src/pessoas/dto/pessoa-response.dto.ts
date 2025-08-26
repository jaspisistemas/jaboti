import { ApiProperty } from '@nestjs/swagger';
import { PessoaTipo, UserRole } from '@prisma/client';

export class PessoaResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty({ required: false })
  user?: string | null;
  @ApiProperty()
  name!: string;
  @ApiProperty({ required: false })
  chatName?: string | null;
  @ApiProperty({ required: false })
  phone?: string | null;
  @ApiProperty({ required: false })
  email?: string | null;
  @ApiProperty({ required: false })
  documento?: string | null;
  @ApiProperty({ required: false })
  tipoDocumento?: string | null;
  @ApiProperty({ required: false })
  dataNascimento?: Date | null;
  @ApiProperty({ required: false })
  genero?: string | null;
  @ApiProperty({ enum: PessoaTipo })
  type!: PessoaTipo;
  @ApiProperty({ enum: UserRole })
  role!: UserRole;
  @ApiProperty({ required: false })
  photoUrl?: string | null;
  @ApiProperty({ required: false })
  cep?: string | null;
  @ApiProperty({ required: false })
  endereco?: string | null;
  @ApiProperty({ required: false })
  numero?: string | null;
  @ApiProperty({ required: false })
  complemento?: string | null;
  @ApiProperty({ required: false })
  bairro?: string | null;
  @ApiProperty({ required: false })
  cidade?: string | null;
  @ApiProperty({ required: false })
  estado?: string | null;
  @ApiProperty({ required: false })
  empresa?: string | null;
  @ApiProperty({ required: false })
  cargo?: string | null;
  @ApiProperty({ required: false })
  origem?: string | null;
  @ApiProperty({ required: false })
  etapa?: string | null;
  @ApiProperty({ required: false })
  interesses?: any;
  @ApiProperty({ required: false, type: [String] })
  tags?: string[] | null;
  @ApiProperty({ required: false })
  canalPreferido?: string | null;
  @ApiProperty({ required: false })
  consenteMarketing?: boolean | null;
  @ApiProperty({ required: false })
  whatsappOptIn?: boolean | null;
  @ApiProperty({ required: false })
  ultimoContatoEm?: Date | null;
  @ApiProperty({ required: false })
  observacoes?: string | null;
  @ApiProperty()
  active!: boolean;
  @ApiProperty()
  online!: boolean;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
