// Utilitários compartilhados entre Frontend e Backend

// ===== VALIDAÇÃO =====
export const validation = {
  /**
   * Valida se um email é válido
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida se um telefone é válido (formato brasileiro)
   */
  isValidPhone: (phone: string): boolean => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Deve ter 10 ou 11 dígitos (com DDD)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  },

  /**
   * Valida se um CNPJ é válido
   */
  isValidCNPJ: (cnpj: string): boolean => {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Deve ter 14 dígitos
    if (cleanCNPJ.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let weight = 2;
    
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    sum = 0;
    weight = 2;
    
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCNPJ[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return parseInt(cleanCNPJ[12]) === digit1 && parseInt(cleanCNPJ[13]) === digit2;
  },

  /**
   * Valida se uma senha é forte
   */
  isStrongPassword: (password: string): boolean => {
    // Mínimo 8 caracteres, pelo menos 1 maiúscula, 1 minúscula, 1 número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Valida se um arquivo é válido
   */
  isValidFile: (file: File, maxSize: number, allowedTypes: string[]): boolean => {
    if (file.size > maxSize) return false;
    if (!allowedTypes.includes(file.type)) return false;
    return true;
  },
};

// ===== FORMATAÇÃO =====
export const formatting = {
  /**
   * Formata um número de telefone brasileiro
   */
  formatPhone: (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 11) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    } else if (cleanPhone.length === 10) {
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
    }
    
    return phone;
  },

  /**
   * Formata um CNPJ
   */
  formatCNPJ: (cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length === 14) {
      return `${cleanCNPJ.slice(0, 2)}.${cleanCNPJ.slice(2, 5)}.${cleanCNPJ.slice(5, 8)}/${cleanCNPJ.slice(8, 12)}-${cleanCNPJ.slice(12)}`;
    }
    
    return cnpj;
  },

  /**
   * Formata um CPF
   */
  formatCPF: (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length === 11) {
      return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9)}`;
    }
    
    return cpf;
  },

  /**
   * Formata um valor monetário
   */
  formatCurrency: (value: number, locale: string = 'pt-BR', currency: string = 'BRL'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  },

  /**
   * Formata uma data
   */
  formatDate: (date: Date | string, locale: string = 'pt-BR'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale).format(dateObj);
  },

  /**
   * Formata uma data e hora
   */
  formatDateTime: (date: Date | string, locale: string = 'pt-BR'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  },

  /**
   * Formata um tamanho de arquivo
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Formata uma duração em segundos para mm:ss
   */
  formatDuration: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
};

// ===== MANIPULAÇÃO DE STRINGS =====
export const strings = {
  /**
   * Capitaliza a primeira letra de cada palavra
   */
  capitalize: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  /**
   * Remove acentos de uma string
   */
  removeAccents: (str: string): string => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  /**
   * Gera um slug a partir de uma string
   */
  generateSlug: (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /**
   * Trunca uma string no comprimento especificado
   */
  truncate: (str: string, length: number, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  /**
   * Remove HTML tags de uma string
   */
  stripHtml: (html: string): string => {
    return html.replace(/<[^>]*>/g, '');
  },
};

// ===== MANIPULAÇÃO DE ARRAYS =====
export const arrays = {
  /**
   * Remove duplicatas de um array
   */
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)];
  },

  /**
   * Agrupa um array por uma chave específica
   */
  groupBy: <T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> => {
    return arr.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Ordena um array por uma chave específica
   */
  sortBy: <T, K extends keyof T>(arr: T[], key: K, order: 'asc' | 'desc' = 'asc'): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },

  /**
   * Filtra um array por múltiplas condições
   */
  filterBy: <T>(arr: T[], filters: Partial<T>): T[] => {
    return arr.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return item[key as keyof T] === value;
      });
    });
  },
};

// ===== MANIPULAÇÃO DE OBJETOS =====
export const objects = {
  /**
   * Remove propriedades undefined/null de um objeto
   */
  clean: <T extends Record<string, any>>(obj: T): Partial<T> => {
    const cleaned: Partial<T> = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleaned[key as keyof T] = value;
      }
    });
    
    return cleaned;
  },

  /**
   * Faz merge de dois objetos
   */
  merge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    return { ...target, ...source };
  },

  /**
   * Faz merge profundo de dois objetos
   */
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    Object.entries(source).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof T] = deepMerge(target[key as keyof T] || {}, value);
      } else {
        result[key as keyof T] = value;
      }
    });
    
    return result;
  },

  /**
   * Verifica se um objeto está vazio
   */
  isEmpty: (obj: Record<string, any>): boolean => {
    return Object.keys(obj).length === 0;
  },

  /**
   * Pega apenas as propriedades especificadas de um objeto
   */
  pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    
    return result;
  },

  /**
   * Remove propriedades específicas de um objeto
   */
  omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    
    keys.forEach(key => {
      delete result[key];
    });
    
    return result;
  },
};

// ===== UTILITÁRIOS DE DATA =====
export const dates = {
  /**
   * Verifica se uma data é válida
   */
  isValid: (date: any): boolean => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  /**
   * Adiciona dias a uma data
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Adiciona meses a uma data
   */
  addMonths: (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  /**
   * Adiciona anos a uma data
   */
  addYears: (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  },

  /**
   * Calcula a diferença em dias entre duas datas
   */
  diffInDays: (date1: Date, date2: Date): number => {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  },

  /**
   * Verifica se uma data é hoje
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  /**
   * Verifica se uma data é no passado
   */
  isPast: (date: Date): boolean => {
    return date < new Date();
  },

  /**
   * Verifica se uma data é no futuro
   */
  isFuture: (date: Date): boolean => {
    return date > new Date();
  },
};

// ===== UTILITÁRIOS DE CRIPTOGRAFIA =====
export const crypto = {
  /**
   * Gera um ID único
   */
  generateId: (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Gera um token aleatório
   */
  generateToken: (length: number = 32): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  },

  /**
   * Faz hash de uma string (simples, para uso básico)
   */
  hash: (str: string): string => {
    let hash = 0;
    
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  },
};

// ===== UTILITÁRIOS DE PERFORMANCE =====
export const performance = {
  /**
   * Debounce de uma função
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle de uma função
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Mede o tempo de execução de uma função
   */
  measureTime: <T>(func: () => T): { result: T; time: number } => {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    return {
      result,
      time: end - start,
    };
  },
};
