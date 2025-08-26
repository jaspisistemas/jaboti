import {
  // Validation functions
  isValidEmail,
  isValidPhone,
  isValidCNPJ,
  isValidPassword,
  isValidFile,
  
  // Formatting functions
  formatPhone,
  formatCNPJ,
  formatCPF,
  formatCurrency,
  formatDate,
  formatFileSize,
  formatDuration,
  
  // String manipulation functions
  capitalize,
  removeAccents,
  generateSlug,
  truncate,
  stripHtml,
  
  // Array manipulation functions
  unique,
  groupBy,
  sortBy,
  filterBy,
  
  // Object manipulation functions
  cleanObject,
  mergeObjects,
  deepMerge,
  isEmpty,
  pick,
  omit,
  
  // Date utilities
  isValidDate,
  addDays,
  addMonths,
  addYears,
  diffInDays,
  isToday,
  isPast,
  isFuture,
  
  // Crypto utilities
  generateId,
  generateToken,
  hashString,
  
  // Performance utilities
  debounce,
  throttle,
  measureTime,
} from '../utils';

describe('Validation Functions', () => {
  describe('isValidEmail', () => {
    it('deve validar emails válidos', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('deve validar telefones válidos', () => {
      expect(isValidPhone('11999999999')).toBe(true);
      expect(isValidPhone('(11) 99999-9999')).toBe(true);
      expect(isValidPhone('+55 11 99999-9999')).toBe(true);
    });

    it('deve rejeitar telefones inválidos', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abcdefghijk')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isValidCNPJ', () => {
    it('deve validar CNPJs válidos', () => {
      expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
      expect(isValidCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJs inválidos', () => {
      expect(isValidCNPJ('11.222.333/0001-82')).toBe(false);
      expect(isValidCNPJ('123')).toBe(false);
      expect(isValidCNPJ('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('deve validar senhas válidas', () => {
      expect(isValidPassword('StrongPass123!')).toBe(true);
      expect(isValidPassword('Abc123!@#')).toBe(true);
    });

    it('deve rejeitar senhas fracas', () => {
      expect(isValidPassword('weak')).toBe(false);
      expect(isValidPassword('123456')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatPhone', () => {
    it('deve formatar telefones corretamente', () => {
      expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
      expect(formatPhone('1199999999')).toBe('(11) 9999-9999');
    });
  });

  describe('formatCNPJ', () => {
    it('deve formatar CNPJs corretamente', () => {
      expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });
  });

  describe('formatCPF', () => {
    it('deve formatar CPFs corretamente', () => {
      expect(formatCPF('12345678901')).toBe('123.456.789-01');
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores monetários corretamente', () => {
      expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
      expect(formatCurrency(0)).toBe('R$ 0,00');
      expect(formatCurrency(1000000)).toBe('R$ 1.000.000,00');
    });
  });

  describe('formatDate', () => {
    it('deve formatar datas corretamente', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toBe('15/01/2024');
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2024-01-15');
    });
  });

  describe('formatFileSize', () => {
    it('deve formatar tamanhos de arquivo corretamente', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('deve formatar durações corretamente', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3661)).toBe('1:01:01');
      expect(formatDuration(0)).toBe('0:00');
    });
  });
});

describe('String Manipulation Functions', () => {
  describe('capitalize', () => {
    it('deve capitalizar strings corretamente', () => {
      expect(capitalize('hello world')).toBe('Hello World');
      expect(capitalize('JAVASCRIPT')).toBe('Javascript');
      expect(capitalize('')).toBe('');
    });
  });

  describe('removeAccents', () => {
    it('deve remover acentos corretamente', () => {
      expect(removeAccents('café')).toBe('cafe');
      expect(removeAccents('João')).toBe('Joao');
      expect(removeAccents('São Paulo')).toBe('Sao Paulo');
    });
  });

  describe('generateSlug', () => {
    it('deve gerar slugs válidos', () => {
      expect(generateSlug('Hello World!')).toBe('hello-world');
      expect(generateSlug('São Paulo, Brasil')).toBe('sao-paulo-brasil');
      expect(generateSlug('JavaScript & TypeScript')).toBe('javascript-typescript');
    });
  });

  describe('truncate', () => {
    it('deve truncar strings corretamente', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('stripHtml', () => {
    it('deve remover HTML corretamente', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
      expect(stripHtml('<div>Content</div>')).toBe('Content');
      expect(stripHtml('Plain text')).toBe('Plain text');
    });
  });
});

describe('Array Manipulation Functions', () => {
  describe('unique', () => {
    it('deve remover duplicatas de arrays', () => {
      expect(unique([1, 2, 2, 3, 3, 4])).toEqual([1, 2, 3, 4]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
  });

  describe('groupBy', () => {
    it('deve agrupar arrays por propriedade', () => {
      const items = [
        { id: 1, category: 'A' },
        { id: 2, category: 'B' },
        { id: 3, category: 'A' },
      ];
      
      const result = groupBy(items, 'category');
      expect(result).toEqual({
        A: [{ id: 1, category: 'A' }, { id: 3, category: 'A' }],
        B: [{ id: 2, category: 'B' }],
      });
    });
  });

  describe('sortBy', () => {
    it('deve ordenar arrays por propriedade', () => {
      const items = [
        { id: 3, name: 'Charlie' },
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ];
      
      const result = sortBy(items, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });
  });
});

describe('Object Manipulation Functions', () => {
  describe('cleanObject', () => {
    it('deve limpar objetos removendo valores falsy', () => {
      const obj = { a: 1, b: 0, c: '', d: null, e: undefined, f: false };
      const result = cleanObject(obj);
      expect(result).toEqual({ a: 1, b: 0, f: false });
    });
  });

  describe('mergeObjects', () => {
    it('deve mesclar objetos corretamente', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const result = mergeObjects(obj1, obj2);
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe('isEmpty', () => {
    it('deve verificar se objetos estão vazios', () => {
      expect(isEmpty({})).toBe(true);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
    });
  });

  describe('pick', () => {
    it('deve selecionar propriedades específicas', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = pick(obj, ['a', 'c']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('deve omitir propriedades específicas', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const result = omit(obj, ['b', 'd']);
      expect(result).toEqual({ a: 1, c: 3 });
    });
  });
});

describe('Date Utilities', () => {
  describe('isValidDate', () => {
    it('deve validar datas corretamente', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2024-01-15')).toBe(true);
      expect(isValidDate('invalid-date')).toBe(false);
    });
  });

  describe('addDays', () => {
    it('deve adicionar dias corretamente', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });
  });

  describe('diffInDays', () => {
    it('deve calcular diferença em dias', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-20');
      expect(diffInDays(date1, date2)).toBe(5);
    });
  });
});

describe('Crypto Utilities', () => {
  describe('generateId', () => {
    it('deve gerar IDs únicos', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('generateToken', () => {
    it('deve gerar tokens únicos', () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
      expect(typeof token1).toBe('string');
      expect(token1.length).toBeGreaterThan(0);
    });
  });
});

describe('Performance Utilities', () => {
  describe('debounce', () => {
    it('deve debounce funções corretamente', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
        expect(callCount).toBe(1);
        done();
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();
    });
  });

  describe('throttle', () => {
    it('deve throttle funções corretamente', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
        if (callCount === 2) {
          done();
        }
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();
    });
  });

  describe('measureTime', () => {
    it('deve medir tempo de execução', async () => {
      const result = await measureTime(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'test';
      });

      expect(result.value).toBe('test');
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});
