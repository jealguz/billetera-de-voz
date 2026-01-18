// nlpService.ts - Versión sin dependencias de Node.js
import { franc } from 'franc';
import { formatCurrency } from '../utils/formatters';

export interface ParsedCommand {
  intent: 'add_debt' | 'add_payment' | 'query_debt' | 'show_summary' | 'create_client' | 'unknown';
  entities: {
    person?: string;
    amount?: number;
    description?: string;
    date?: Date;
    action?: 'debe' | 'pagó' | 'pagar' | 'consultar';
  };
  confidence: number;
  rawText: string;
  language: string;
}

class NLPService {
  private cache = new Map<string, ParsedCommand>();

  // Tokenizer simple sin dependencias
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñ]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // Detectar idioma
  detectLanguage(text: string): string {
    const lang = franc(text);
    return lang === 'spa' ? 'es' : 'en';
  }

  // Extraer nombres de personas
// En tu nlpService.ts, reemplaza el método extractPerson por esta versión mejorada:
extractPerson(text: string): string | null {
  try {
    console.log('👤 Buscando persona en:', text);

    // Método 1: Buscar patrones de nombre completo mejorados
    const namePatterns = [
      // Patrón: "Al señor José Amaya le debo 12000" (tratamientos primero)
      /(?:al|a el|a la)\s+(?:señor|señora|señorita|joven|jovencita|muchacho|muchacha|don|doña|doctor|doctora|ingeniero|ingeniera|licenciado|licenciada|profesor|profesora|arquitecto|arquitecta|abogado|abogada|maestro|maestra)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "A José Hernández le debo 20000"
      /^A\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "Camilo Arango me debe $3000"
      /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "me debe Camilo Arango $3000"
      /(?:me debe|debe|pagó|abonó)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "de Camilo Arango $3000"
      /de\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "$3000 de Camilo Arango"
      /(?:\$\d+|de)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "yo le debo a Camilo Arango"
      /yo le debo a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "debo a Camilo Arango"
      /debo a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "le abono a Camilo Arango"
      /le abono a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "abono a Camilo Arango"
      /abono a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      // Patrón: "le debo a Camilo Arango"
      /le debo a\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const fullName = match[1].trim();
        console.log('👤 Patrón encontrado:', fullName);
        // Verificar que no sea una palabra común
        const nameParts = fullName.split(' ');
        if (nameParts.length >= 2 &&
            !this.isCommonWord(nameParts[0]) &&
            !this.isCommonWord(nameParts[1])) {
          return this.capitalizeFullName(fullName);
        }
      }
    }

    // Método 2: Buscar palabras que comienzan con mayúscula consecutivas (sin símbolos)
    const words = text.split(/\s+/).map(w => w.replace(/[^\w\sáéíóúñ]/gi, ''));
    const possibleNames: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];

      if (word1.length > 2 && word2.length > 2 &&
          /^[A-ZÁÉÍÓÚÑ]/.test(word1) && /^[A-ZÁÉÍÓÚÑ]/.test(word2) &&
          !this.isCommonWord(word1) && !this.isCommonWord(word2)) {
        possibleNames.push(`${word1} ${word2}`);
      }
    }

    if (possibleNames.length > 0) {
      console.log('👤 Nombre por mayúsculas:', possibleNames[0]);
      return this.capitalizeFullName(possibleNames[0]);
    }

    // Método 3: Buscar solo primer nombre (fallback)
    for (const word of words) {
      if (word.length > 2 &&
          /^[A-ZÁÉÍÓÚÑ]/.test(word) &&
          !this.isCommonWord(word)) {
        console.log('👤 Nombre único:', word);
        return this.capitalizeName(word);
      }
    }

    console.log('👤 No se encontró persona');
    return null;
  } catch (error) {
    console.warn('Error extrayendo persona:', error);
    return null;
  }
}

  private parseComplexAmount(text: string): number | null {
    const lowerText = text.toLowerCase().trim();

    // Patrones para centenas + mil (ej. "quinientos mil")
    const patterns = [
      // "cinco millones" -> 5000000 (primero los más largos)
      { regex: /(\w+)\s+millon(?:es)?/, multiplier: 1000000 },
      // "quinientos mil" -> 500000
      { regex: /(\w+)\s+mil/, multiplier: 1000 },
    ];

    for (const { regex, multiplier } of patterns) {
      const match = lowerText.match(regex);
      if (match) {
        const word = match[1];
        const base = this.parseNumberWord(word) || this.parseHundreds(word);
        if (base) {
          return base * multiplier;
        }
      }
    }

    return null;
  }

  private parseHundreds(word: string): number | null {
    const hundredsMap: { [key: string]: number } = {
      'cien': 100, 'ciento': 100,
      'doscientos': 200, 'trescientos': 300, 'cuatrocientos': 400,
      'quinientos': 500, 'seiscientos': 600, 'setecientos': 700,
      'ochocientos': 800, 'novecientos': 900,
    };
    return hundredsMap[word] || null;
  }

 // Añade estos métodos helper a tu clase NLPService:
private capitalizeFullName(fullName: string): string {
  return fullName
    .split(' ')
    .map(name => this.capitalizeName(name))
    .join(' ');
}

private capitalizeName(name: string): string {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

  // Extraer cantidades
  extractAmount(text: string): number | null {
    try {
      console.log('🔍 Buscando cantidad en:', text);

    // Método 1: Buscar números directos o con $ (ej. 500, $3000, 10 000)
    const numberMatch = text.match(/(\$?\d+(?:\s+\d+)*)/);
    if (numberMatch) {
      const cleanedNumber = numberMatch[1].replace(/\s+/g, '').replace(/\$/g, '');
      const baseAmount = parseInt(cleanedNumber, 10);

      // Verificar si hay multiplicadores después (ej. "$3000 mil" -> 3000000, "500 mil" -> 500000)
      const lowerText = text.toLowerCase();
      const afterNumber = lowerText.split(numberMatch[0])[1]?.trim() || '';

      if (afterNumber.startsWith('mil')) {
        console.log('💰 Cantidad encontrada (número + mil):', baseAmount * 1000);
        return baseAmount * 1000;
      } else if (afterNumber.startsWith('millon')) {
        console.log('💰 Cantidad encontrada (número + millón):', baseAmount * 1000000);
        return baseAmount * 1000000;
      }

      console.log('💰 Cantidad encontrada (simple):', baseAmount);
      return baseAmount;
    }

      // Método 2: Buscar frases numéricas complejas (ej. "quinientos mil")
      const complexAmount = this.parseComplexAmount(text);
      if (complexAmount) {
        console.log('💰 Cantidad encontrada (compleja):', complexAmount);
        return complexAmount;
      }

      // Método 3: Buscar palabras numéricas básicas (fallback)
      const numberWords: { [key: string]: number } = {
        'mil': 1000,
        'diez mil': 10000,
        'cien mil': 100000,
        'un millón': 1000000,
        'millón': 1000000,
      };

      const lowerText = text.toLowerCase();
      for (const [word, value] of Object.entries(numberWords)) {
        if (lowerText.includes(word)) {
          console.log('💰 Palabra numérica encontrada:', word, '=', value);
          return value;
        }
      }

      console.log('❌ No se encontró cantidad');
      return null;
    } catch (error) {
      console.warn('Error extrayendo cantidad:', error);
      return null;
    }
  }

// Añade estos métodos helper a tu clase NLPService:

private parseNumberWord(word: string): number | null {
  const numberMap: { [key: string]: number } = {
    // Unidades
    'un': 1, 'uno': 1, 'una': 1,
    'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
    'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,

    // Decenas
    'diez': 10, 'once': 11, 'doce': 12, 'trece': 13,
    'catorce': 14, 'quince': 15, 'dieciseis': 16, 'dieciséis': 16,
    'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
    'veinte': 20, 'veintiun': 21, 'veintiuno': 21, 'veintiuna': 21,
    'veintidos': 22, 'veintitres': 23, 'veinticuatro': 24,
    'veinticinco': 25, 'veintiseis': 26, 'veintisiete': 27,
    'veintiocho': 28, 'veintinueve': 29,
    'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
    'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,

    // Centenas
    'cien': 100, 'ciento': 100,
    'doscientos': 200, 'doscientas': 200,
    'trescientos': 300, 'trescientas': 300,
    'cuatrocientos': 400, 'cuatrocientas': 400,
    'quinientos': 500, 'quinientas': 500,
    'seiscientos': 600, 'seiscientas': 600,
    'setecientos': 700, 'setecientas': 700,
    'ochocientos': 800, 'ochocientas': 800,
    'novecientos': 900, 'novecientas': 900,

    // Miles y millones
    'mil': 1000,
    'millon': 1000000, 'millón': 1000000,
  };

  return numberMap[word.toLowerCase()] || null;
}

private parseFullTextNumber(text: string): number | null {
  const lowerText = text.toLowerCase();
  
  // Patrones comunes
  const patterns = [
    // "cien mil"
    { pattern: /cien mil/i, value: 100000 },
    // "doscientos mil"
    { pattern: /doscientos mil/i, value: 200000 },
    // "quinientos mil"
    { pattern: /quinientos mil/i, value: 500000 },
    // "un millón"
    { pattern: /un mill[oó]n/i, value: 1000000 },
    // "dos millones"
    { pattern: /dos mill[oó]nes/i, value: 2000000 },
    // "cinco millones"
    { pattern: /cinco mill[oó]nes/i, value: 5000000 },
    // "diez millones"
    { pattern: /diez mill[oó]nes/i, value: 10000000 },
  ];
  
  for (const { pattern, value } of patterns) {
    if (pattern.test(lowerText)) {
      return value;
    }
  }
  
  return null;
}

  // Extraer descripción
  extractDescription(text: string): string | null {
    const patterns = [
      /por\s+(.+?)(?:\s+pesos|$)/i,
      /para\s+(.+?)(?:\s+pesos|$)/i,
      /de\s+(.+?)(?:\s+pesos|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  // Detectar intención
 detectIntent(text: string): ParsedCommand['intent'] {
   const lowerText = text.toLowerCase();
   console.log('🔍 Detectando intención para:', lowerText);

    // Patrón 1: Pagos a mí (me paga, etc.)
    if (/(me paga|me pagó|me abona|me abonó|me salda|me saldó|me dio|me dio el dinero)\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_payment (me paga)');
      return 'add_payment';
    }

    // Patrón 2: Pagos generales (paga, etc.)
    if (/(paga|pagó|abona|abonó|le abono|abono a|salda|saldó|dio|dio el dinero|entregó|entregó el dinero)\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_payment (paga)');
      return 'add_payment';
    }

    // Patrón 3: Deudas (me debe, etc.)
    if (/(me debe|debe|yo debo|le debo|debo|qued[oó] debiendo|fio|prestó|dio fiado|prestó dinero)\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_debt (debe)');
      return 'add_debt';
    }

    // Patrón 3b: Deudas con "le debo a [persona]"
    if (/le debo a\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_debt (le debo a)');
      return 'add_debt';
    }

    // Patrón 3b: Deudas con "yo le debo a [persona]"
    if (/yo le debo a\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_debt (yo le debo a)');
      return 'add_debt';
    }

   // Patrón 4: Consultas cuánto debe
   if (/cu[aá]nto (?:me )?debe|cu[aá]nto le debo|qué debe|que debe/.test(lowerText)) {
     console.log('✅ Intención: query_debt');
     return 'query_debt';
   }

    // Patrón 5: "saldo de Camilo", "consulta de"
    if (/saldo (?:de|del)|consulta (?:de|del)|estado de cuenta/.test(lowerText)) {
      console.log('✅ Intención: query_debt (saldo)');
      return 'query_debt';
    }

    // Patrón 6: Consultas generales "a quién le debo", "personas que me deben"
    if (/(?:a qu[eé]|qu[eé]) personas? (?:les debo|me deben)|(?:personas?|gente) (?:que les debo|que me deben)/.test(lowerText)) {
      console.log('✅ Intención: query_debt (general)');
      return 'query_debt';
    }

   // Patrón 6: Resumen
   if (/resumen|total de deudas|balance|cuánto tengo|cuanto tengo|cuánto debo|cuanto debo/.test(lowerText)) {
     console.log('✅ Intención: show_summary');
     return 'show_summary';
   }

   // Patrón 7: Cliente nuevo
   if (/cliente nuevo|nuevo cliente|registrar cliente|agregar cliente/.test(lowerText)) {
     console.log('✅ Intención: create_client');
     return 'create_client';
   }

   // Patrón 8: Palabras clave con contexto (fallback)
   const keywordContext = {
     add_debt: ['deuda', 'prestamo', 'fiado', 'préstamo'],
     add_payment: ['pago', 'abono', 'cancelación', 'pagar'],
     query_debt: ['cuánto', 'cuanto', 'qué debe', 'que debe', 'consulta'],
     show_summary: ['total', 'balance', 'resumen'],
   };

   for (const [intent, keywords] of Object.entries(keywordContext)) {
     for (const keyword of keywords) {
       if (lowerText.includes(keyword)) {
         console.log(`✅ Intención: ${intent} (palabra: ${keyword})`);
         return intent as ParsedCommand['intent'];
       }
     }
   }

   console.log('❌ Intención no reconocida');
   return 'unknown';
 }

  // Procesar comando completo
  parseCommand(text: string): ParsedCommand {
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const language = this.detectLanguage(text);
    const intent = this.detectIntent(text);
    let person = this.extractPerson(text);
    const amount = this.extractAmount(text);
    const description = this.extractDescription(text);

    // Para consultas generales de deudas, forzar person = null
    if (intent === 'query_debt' && text.toLowerCase().includes('personas')) {
      person = null;
    }

    // Calcular confianza más precisa
    let confidence = 0.3; // base
    if (person) confidence += 0.3; // persona es clave
    if (amount) confidence += 0.25; // monto importante
    if (intent !== 'unknown') confidence += 0.2; // intención reconocida
    if (language === 'es') confidence += 0.1; // idioma esperado
    if (description) confidence += 0.1; // descripción adicional

    const result = {
      intent,
      entities: {
        person: person || undefined,
        amount: amount || undefined,
        description: description || undefined,
        date: new Date(),
      },
      confidence: Math.min(confidence, 1.0),
      rawText: text,
      language,
    };

    // Cachear resultado
    this.cache.set(cacheKey, result);

    return result;
  }

private isCommonWord(word: string): boolean {
  const commonWords = [
    // Artículos y preposiciones
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'de', 'a', 'en', 'por', 'para', 'con', 'sin', 'sobre',
    'bajo', 'entre', 'hacia', 'desde', 'hasta',
    
    // Palabras relacionadas con deudas
    'pesos', 'dólares', 'dinero', 'pago', 'deuda', 'cliente',
    'material', 'trabajo', 'servicio', 'producto', 'factura',
    'recibo', 'cuenta', 'saldo', 'total', 'resumen', 'mil',
    'ciento', 'cientos', 'miles', 'mucho', 'poco',
    
    // Verbos comunes
    'debe', 'pagó', 'pagar', 'consultar', 'tiene', 'tengo',
    'tienes', 'hay', 'está', 'es', 'son', 'era', 'fueron',
    'hace', 'hizo', 'dijo', 'vamos', 'puede', 'quiero',
    
    // Pronombres
    'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la',
    
    // Conjunciones
    'y', 'o', 'pero', 'porque', 'si', 'que', 'cuando',

    // Palabras de consulta
    'qué', 'que', 'quién', 'quien', 'cuánto', 'cuanto', 'personas', 'gente',
  ];
  
  const lowerWord = word.toLowerCase();
  return commonWords.includes(lowerWord);
}

  generateResponse(parsed: ParsedCommand, data?: any): string {
    const { intent, entities } = parsed;

    switch (intent) {
      case 'add_debt':
        if (entities.person && entities.amount) {
          // Determinar si es deuda mía o del otro
          const isOwing = parsed.rawText.toLowerCase().includes('le debo') ||
                         parsed.rawText.toLowerCase().includes('debo a') ||
                         parsed.rawText.toLowerCase().includes('yo le debo');

          if (isOwing) {
            return `Listo, anoté que le debes ${formatCurrency(entities.amount)} a ${entities.person}${entities.description ? ` por ${entities.description}` : ''}.`;
          } else {
            return `Perfecto, queda registrado que ${entities.person} te debe ${formatCurrency(entities.amount)}${entities.description ? ` por ${entities.description}` : ''}.`;
          }
        }
        return '¿Quién te debe cuánto?';
        
      case 'add_payment':
        if (entities.person && entities.amount) {
          // Determinar si es pago recibido o realizado
          const isMyPayment = parsed.rawText.toLowerCase().includes('le abono') ||
                             parsed.rawText.toLowerCase().includes('abono a');

          if (isMyPayment) {
            return `Excelente, registrado el pago de ${formatCurrency(entities.amount)} a ${entities.person}.`;
          } else {
            return `¡Qué bien! ${entities.person} te pagó ${formatCurrency(entities.amount)}.`;
          }
        }
        return '¿Quién te pagó cuánto?';
        
      case 'query_debt':
        if (entities.person) {
          if (data?.amount) {
            return `${entities.person} te debe ${formatCurrency(data.amount)}${data.description ? ` por ${data.description}` : ''}.`;
          }
          return `${entities.person} no tiene deudas pendientes.`;
        }
        // Si no hay persona, verificar si es consulta general
        if (parsed.rawText.toLowerCase().includes('les debo') || parsed.rawText.toLowerCase().includes('debo a')) {
          if (data && Array.isArray(data)) {
            if (data.length === 0) {
              return 'No tienes deudas pendientes.';
            }
            const list = data.map(d => `${d.person}: ${formatCurrency(d.amount)}`).join(', ');
            return `Le debes a: ${list}.`;
          }
          return 'No tengo información de tus deudas.';
        } else if (parsed.rawText.toLowerCase().includes('me deben')) {
          if (data && Array.isArray(data)) {
            if (data.length === 0) {
              return 'Nadie te debe dinero en este momento.';
            }
            const list = data.map(d => `${d.person}: ${formatCurrency(d.amount)}`).join(', ');
            return `Te deben estas personas: ${list}.`;
          }
          return 'No tengo información de tus deudas.';
        }
        return '¿De quién quieres saber cuánto te debe?';
        
      case 'show_summary':
        if (data) {
          const net = data.totalOwed - data.totalOwing;
          const netText = net >= 0 ? 'a tu favor' : 'en tu contra';
          return `📊 Aquí tienes tu resumen: Te deben ${data.totalOwed} pesos en total. Tú debes ${data.totalOwing} pesos. Tu balance neto es de ${Math.abs(net)} pesos ${netText}.`;
        }
        if (data?.personal) {
          const { totalOwed, totalOwing, netBalance } = data.personal;
          return `Tienes ${formatCurrency(totalOwed)} en deudas a tu favor y ${formatCurrency(totalOwing)} que debes. ${netBalance >= 0 ? `Estás ${formatCurrency(Math.abs(netBalance))} a favor.` : `Debes ${formatCurrency(Math.abs(netBalance))}.`}`;
        }
        return 'Aquí tienes el resumen de tus finanzas.';
        
      case 'create_client':
        if (entities.person) {
          return `¡Listo! He agregado a ${entities.person} como cliente.`;
        }
        return '¿Cómo se llama el cliente que quieres agregar?';
        
      default:
        return 'No entendí eso. Prueba diciendo algo como "María me debe 2000 pesos" o "¿cuánto me debe Juan?".';
    }
  }
}

export const nlpService = new NLPService();