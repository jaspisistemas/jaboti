# Sistema de Códigos Sequenciais

Este sistema foi criado para controlar a geração de IDs sequenciais para diferentes entidades do sistema, baseado no procedimento Genexus `ultimoCodigoEmpresa`.

## Estrutura

### Tabela Parametro

A tabela `Parametro` controla a geração de códigos sequenciais com os seguintes campos:

- **EmpCod**: Código da empresa
- **ParSeq**: Sequencial único da tela (chave primária composta com EmpCod)
- **ParFilCod**: Código da filial (não utilizado atualmente, padrão = 1)
- **ParCod**: Código do parâmetro (tipo de entidade: PESSOA, EMPRESA, DEPARTAMENTO)
- **ParNom**: Nome descritivo do parâmetro
- **ParUltCod**: Último código usado (incrementa automaticamente)

### Enum DomParCod

Define os tipos de entidades que podem gerar códigos sequenciais:

```typescript
export enum DomParCod {
  PESSOA = 'PESSOA',
  EMPRESA = 'EMPRESA',
  DEPARTAMENTO = 'DEPARTAMENTO',
}
```

## Como Usar

### 1. Injeção de Dependência

```typescript
import { CodigoSequencialService } from '../common/services/codigo-sequencial.service';
import { DomParCod } from '../common/enums/dom-par-cod.enum';

@Injectable()
export class SeuService {
  constructor(private codigoSequencialService: CodigoSequencialService) {}

  async criarNovaEntidade(empCod: number) {
    const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
      empCod,
      DomParCod.PESSOA,
    );

    // Use o proximoCodigo para criar a entidade
    return proximoCodigo;
  }
}
```

### 2. Importar o CommonModule

```typescript
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  // ... resto da configuração
})
export class SeuModule {}
```

## Funcionalidades

### gerarProximoCodigo(empCod, parCod, filCod?)

- **empCod**: Código da empresa
- **parCod**: Tipo de entidade (PESSOA, EMPRESA, DEPARTAMENTO)
- **filCod**: Código da filial (opcional, padrão = 1)

Retorna o próximo código sequencial disponível.

### obterUltimoCodigo(empCod, parCod, filCod?)

Retorna o último código usado para uma entidade específica.

### resetarContador(empCod, parCod, filCod?)

Reseta o contador para 0 (útil para testes ou reinicialização).

## Exemplo de Uso no Serviço de Pessoas

```typescript
async create(companyId: number, dto: CreatePessoaDto) {
  // Gerar código sequencial para a pessoa
  const proximoCodigo = await this.codigoSequencialService.gerarProximoCodigo(
    companyId,
    DomParCod.PESSOA
  );

  // Preparar dados para criação
  const createData: Prisma.PessoaCreateInput = {
    company: { connect: { id: companyId } },
    id: proximoCodigo, // Usar o código gerado
    // ... resto dos dados
  };

  return this.prisma.pessoa.create({ data: createData });
}
```

## Migração

Para criar a tabela no banco de dados, execute o script SQL:

```sql
-- Executar o arquivo: scripts/create-parametros-table.sql
```

## Vantagens

1. **Controle Centralizado**: Todos os códigos sequenciais são gerenciados em uma única tabela
2. **Thread-Safe**: Usa transações do banco para evitar conflitos
3. **Flexível**: Fácil adicionar novos tipos de entidades
4. **Rastreável**: Mantém histórico de códigos usados
5. **Compatível**: Segue o padrão Genexus existente

## Considerações

- O sistema suporta até 8 casas decimais (int)
- Cada empresa tem sua própria sequência
- O campo `ParFilCod` está preparado para uso futuro com filiais
- Os códigos são incrementados automaticamente a cada uso
