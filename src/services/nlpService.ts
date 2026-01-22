// nlpService.ts - Versión sin dependencias de Node.js
import { franc } from 'franc';
import { formatCurrency } from '../utils/formatters';

// ✅ ACTUALIZADO: Tipo Intent con todos los casos
export type Intent =
  | 'add_debt'
  | 'add_payment'
  | 'query_debt'
  | 'show_summary'
  | 'create_client'
  | 'query_payment_history'    // ✅ NUEVO
  | 'query_last_payment'       // ✅ NUEVO
  | 'query_overdue_debts'      // ✅ NUEVO
  | 'unknown';

export interface ParsedCommand {
  intent: Intent;  // ✅ Usa el tipo actualizado
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
  extractPerson(text: string): string | null {
    try {
      console.log('👤 Buscando persona en:', text);
      const lowerText = text.toLowerCase();

      // ============ PATRONES DE DEUDAS (ALTA PRIORIDAD) ============

      // 1. "Le debo a Ana García 6000 pesos"
      const leDeboPattern = /le debo a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const leDeboMatch = text.match(leDeboPattern);
      if (leDeboMatch && leDeboMatch[1]) {
        const fullName = leDeboMatch[1].trim();
        console.log('👤 Extraído de "le debo a":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 2. "Yo le debo a Ana García"
      const yoLeDeboPattern = /yo le debo a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const yoLeDeboMatch = text.match(yoLeDeboPattern);
      if (yoLeDeboMatch && yoLeDeboMatch[1]) {
        const fullName = yoLeDeboMatch[1].trim();
        console.log('👤 Extraído de "yo le debo a":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 3. "Debo a Ana García"
      const deboPattern = /debo a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const deboMatch = text.match(deboPattern);
      if (deboMatch && deboMatch[1]) {
        const fullName = deboMatch[1].trim();
        console.log('👤 Extraído de "debo a":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 4. "Me debe Ana García"
      const meDebePattern = /me debe\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const meDebeMatch = text.match(meDebePattern);
      if (meDebeMatch && meDebeMatch[1]) {
        const fullName = meDebeMatch[1].trim();
        console.log('👤 Extraído de "me debe":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 5. "Ana García me debe" (al inicio)
      const inicioMeDebePattern = /^([a-záéíóúñ]+\s+[a-záéíóúñ]+)\s+me debe/i;
      const inicioMeDebeMatch = text.match(inicioMeDebePattern);
      if (inicioMeDebeMatch && inicioMeDebeMatch[1]) {
        const fullName = inicioMeDebeMatch[1].trim();
        console.log('👤 Extraído de inicio "nombre me debe":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 6. "Ana García le debo" (al inicio inverso)
      const leDeboInicioPattern = /^([a-záéíóúñ]+\s+[a-záéíóúñ]+)\s+le debo/i;
      const leDeboInicioMatch = text.match(leDeboInicioPattern);
      if (leDeboInicioMatch && leDeboInicioMatch[1]) {
        const fullName = leDeboInicioMatch[1].trim();
        console.log('👤 Extraído de inicio "nombre le debo":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // ============ PATRONES DE CONSULTAS (¿QUIÉN? ¿CUÁNTO?) ============

      // 7. "¿Cuánto me debe Ana García?" (consultas)
      const cuantoMeDebePattern = /(?:cuánto|cuanto)\s+(?:me\s+)?debe\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const cuantoMeDebeMatch = text.match(cuantoMeDebePattern);
      if (cuantoMeDebeMatch && cuantoMeDebeMatch[1]) {
        const fullName = cuantoMeDebeMatch[1].trim();
        console.log('👤 Extraído de "¿cuánto me debe?":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 8. "¿Cuánto le debo a Ana García?" 
      const cuantoLeDeboPattern = /(?:cuánto|cuanto)\s+(?:le\s+)?debo\s+a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const cuantoLeDeboMatch = text.match(cuantoLeDeboPattern);
      if (cuantoLeDeboMatch && cuantoLeDeboMatch[1]) {
        const fullName = cuantoLeDeboMatch[1].trim();
        console.log('👤 Extraído de "¿cuánto le debo?":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 9. "¿Quién me debe? - Ana García" (para consultas generales)
      if (lowerText.includes('quién me debe') || lowerText.includes('quien me debe')) {
        // Buscar nombre después de la pregunta
        const quienMatch = text.match(/(?:quién|quien)\s+me debe\s+(?:es\s+)?([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i);
        if (quienMatch && quienMatch[1]) {
          const fullName = quienMatch[1].trim();
          console.log('👤 Extraído de "¿quién me debe?":', fullName);
          return this.capitalizeFullName(fullName);
        }
      }

      // 10. "¿Desde cuándo me debe Ana García?"
      const desdeCuandoPattern = /desde\s+(?:cuándo|cuando)\s+(?:me\s+)?debe\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const desdeCuandoMatch = text.match(desdeCuandoPattern);
      if (desdeCuandoMatch && desdeCuandoMatch[1]) {
        const fullName = desdeCuandoMatch[1].trim();
        console.log('👤 Extraído de "¿desde cuándo me debe?":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 11. "¿Desde cuándo le debo a Ana García?"
      const desdeCuandoLeDeboPattern = /desde\s+(?:cuándo|cuando)\s+(?:le\s+)?debo\s+a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const desdeCuandoLeDeboMatch = text.match(desdeCuandoLeDeboPattern);
      if (desdeCuandoLeDeboMatch && desdeCuandoLeDeboMatch[1]) {
        const fullName = desdeCuandoLeDeboMatch[1].trim();
        console.log('👤 Extraído de "¿desde cuándo le debo?":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // 12. "¿Hace cuánto me debe Ana García?"
      const haceCuantoPattern = /hace\s+(?:cuánto|cuanto)\s+(?:me\s+)?debe\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i;
      const haceCuantoMatch = text.match(haceCuantoPattern);
      if (haceCuantoMatch && haceCuantoMatch[1]) {
        const fullName = haceCuantoMatch[1].trim();
        console.log('👤 Extraído de "¿hace cuánto me debe?":', fullName);
        return this.capitalizeFullName(fullName);
      }

      // ============ PATRONES DE PAGOS ============

      // 13. Patrones de pagos recibidos
      const pagoPatterns = [
        // "Ana García me pagó 6000 pesos"
        /([a-záéíóúñ]+\s+[a-záéíóúñ]+)\s+(?:me pagó|pagó|me abonó|abonó)/i,
        // "Me pagó Ana García 6000 pesos"
        /(?:me pagó|pagó|me abonó|abonó)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
        // "Le abono a Ana García 6000 pesos"
        /le abono a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
        // "Abono a Ana García 6000 pesos"
        /abono a\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
        // "¿Cuándo me pagó Ana García?"
        /(?:cuándo|cuando)\s+(?:me\s+)?pag[oó]\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
        // "Último pago de Ana García"
        /(?:último|ultimo)\s+pago\s+(?:de|del)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
        // "Historial de pagos de Ana García"
        /historial\s+(?:de\s+)?pagos\s+(?:de|del)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)/i,
      ];

      for (const pattern of pagoPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fullName = match[1].trim();
          console.log('👤 Extraído de patrón de pago:', fullName, 'patrón:', pattern);
          return this.capitalizeFullName(fullName);
        }
      }

      // ============ PATRONES DE CLIENTES NUEVOS ============

      // 14. Patrones para creación de clientes
      const clientPatterns = [
        // "Cliente nuevo Ana García"
        /(?:cliente nuevo|nuevo cliente|registrar cliente|agregar cliente|cliente)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s+|$)/i,
        // "Cliente: Ana García" (con dos puntos)
        /(?:cliente|cliente nuevo|nuevo cliente):?\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s+|$)/i,
        // "Agregar a Ana García como cliente"
        /(?:agregar a|registrar a)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s+como cliente|$)/i,
      ];

      for (const pattern of clientPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fullName = match[1].trim();
          console.log('👤 Patrón de cliente encontrado:', fullName);
          return this.capitalizeFullName(fullName);
        }
      }

      // ============ PATRONES GENERALES (tu código existente) ============

      const namePatterns = [
        // Patrón: "Al señor José Amaya le debo 12000" (tratamientos primero)
        /(?:al|a el|a la)\s+(?:señor|señora|señorita|joven|jovencita|muchacho|muchacha|don|doña|doctor|doctora|ingeniero|ingeniera|licenciado|licenciada|profesor|profesora|arquitecto|arquitecta|abogado|abogada|maestro|maestra)\s+([a-záéíóúñ]+\s+[a-záéíóúñ]+)(?:\s+|$)/i,
        // Patrón: "A José Hernández le debo 20000"
        /^A\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
        // Patrón: "Camilo Arango me debe $3000"
        /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
        // Patrón: "de Camilo Arango $3000"
        /de\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(?:\s+|$)/i,
      ];

      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fullName = match[1].trim();
          console.log('👤 Patrón general encontrado:', fullName);
          const nameParts = fullName.split(' ');
          if (nameParts.length >= 2 &&
            !this.isCommonWord(nameParts[0]) &&
            !this.isCommonWord(nameParts[1])) {
            return this.capitalizeFullName(fullName);
          }
        }
      }

      // ============ FALLBACKS ============

      // 15. Extraer nombre después de palabras clave de intención
      if (lowerText.includes('cliente nuevo') ||
        lowerText.includes('nuevo cliente') ||
        lowerText.includes('registrar cliente')) {

        const cleanedText = text
          .toLowerCase()
          .replace(/(cliente nuevo|nuevo cliente|registrar cliente|agregar cliente|cliente)\s*/gi, '')
          .trim();

        const words = cleanedText.split(' ');
        if (words.length >= 2) {
          const potentialName = words.slice(0, 2).join(' ');
          console.log('👤 Nombre extraído después de palabra clave:', potentialName);
          return this.capitalizeFullName(potentialName);
        }
      }

      // 16. Último recurso: buscar dos palabras consecutivas que no sean comunes
      const words = lowerText.split(/\s+/).filter(w => w.length > 2);
      for (let i = 0; i < words.length - 1; i++) {
        const word1 = words[i];
        const word2 = words[i + 1];

        if (!this.isCommonWord(word1) && !this.isCommonWord(word2)) {
          const potentialName = `${word1} ${word2}`;
          console.log('👤 Nombre por palabras no comunes:', potentialName);
          return this.capitalizeFullName(potentialName);
        }
      }

      console.log('👤 No se encontró persona en el texto:', text);
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

  // Métodos helper para nombres
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

      // Método 1: Buscar números directos o con $ (ej. 500, $3000, 10 000, 160,000, 500 mil)
      const numberMatch = text.match(/(\$?\d+(?:[,\s]\d+)*(?:\s+(?:mil|millones?|millón))?)/i);
      if (numberMatch) {
        const cleanedNumber = numberMatch[1].replace(/[\s,]/g, '').replace(/\$/g, '');
        const baseAmount = parseInt(cleanedNumber, 10);

        // Verificar si hay multiplicadores en el match mismo o después
        const lowerText = text.toLowerCase();
        const matchText = numberMatch[0].toLowerCase();

        if (matchText.includes('mil') && !matchText.includes('millon')) {
          console.log('💰 Cantidad encontrada (número + mil):', baseAmount * 1000);
          return baseAmount * 1000;
        } else if (matchText.includes('millon')) {
          console.log('💰 Cantidad encontrada (número + millón):', baseAmount * 1000000);
          return baseAmount * 1000000;
        }

        // Verificar multiplicadores separados (legacy)
        const afterNumber = lowerText.split(numberMatch[0])[1]?.trim() || '';
        if (afterNumber.startsWith('mil')) {
          console.log('💰 Cantidad encontrada (número + mil separado):', baseAmount * 1000);
          return baseAmount * 1000;
        } else if (afterNumber.startsWith('millon')) {
          console.log('💰 Cantidad encontrada (número + millón separado):', baseAmount * 1000000);
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

  // Métodos helper para números
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

  // Detectar intención (ACTUALIZADO con nuevos intents)
  detectIntent(text: string): Intent {
    const lowerText = text.toLowerCase();
    console.log('🔍 Detectando intención para:', lowerText);

    // ✅ PRIMERO: Nuevos patrones para pagos históricos
    // Patrón: "historial de pagos de Juan", "pagos de María"
    if (/(historial de pagos|pagos de|todos los pagos de|cuánto me ha pagado|total pagado por)\s+.+/i.test(lowerText)) {
      console.log('✅ Intención: query_payment_history');
      return 'query_payment_history';
    }

    // Patrón: "último pago de Carlos", "cuándo pagó Ana", "desde cuándo no paga"
    if (/(último pago|última vez que pagó|cuándo pagó|cuándo fue el último pago|desde cuándo no paga|hace cuánto no paga|cuánto tiempo sin pagar)\s+.+/i.test(lowerText)) {
      console.log('✅ Intención: query_last_payment');
      return 'query_last_payment';
    }

    // Patrón: "deudas vencidas", "quién no ha pagado", "quiénes deben hace tiempo"
    if (/(deudas vencidas|quién no ha pagado|quiénes deben hace tiempo|quiénes no pagan)/i.test(lowerText)) {
      console.log('✅ Intención: query_overdue_debts');
      return 'query_overdue_debts';
    }

    // 🔹 Tu lógica ORIGINAL (sin cambios):
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

    // Patrón 3a: Deudas específicas - "yo le debo a [persona]"
    if (/yo le debo a\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_debt (yo le debo a)');
      return 'add_debt';
    }

    // Patrón 3b: Deudas específicas - "le debo a [persona]"
    const leDeboPattern = /le debo a\s+[a-záéíóúñ]+\s+[a-záéíóúñ]+\s+\$?\d+/;
    console.log('🔍 Patrón "le debo a":', leDeboPattern.test(lowerText));
    if (leDeboPattern.test(lowerText)) {
      console.log('✅ Intención: add_debt (le debo a)');
      return 'add_debt';
    }

    // Patrón 3: Deudas generales (me debe, etc.) - sin "le debo" ni "yo le debo"
    if (/(me debe|debe|qued[oó] debiendo|fio|prestó|dio fiado|prestó dinero)\s+\$?\d+/.test(lowerText)) {
      console.log('✅ Intención: add_debt (debe general)');
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

    // Patrón 7: Resumen
    if (/resumen|total de deudas|balance|cuánto tengo|cuanto tengo|cuánto debo|cuanto debo/.test(lowerText)) {
      console.log('✅ Intención: show_summary');
      return 'show_summary';
    }

    // Patrón 8: Cliente nuevo
    if (/cliente nuevo|nuevo cliente|registrar cliente|agregar cliente/.test(lowerText)) {
      console.log('✅ Intención: create_client');
      return 'create_client';
    }

    // Patrón 9: Palabras clave con contexto (fallback)
    const keywordContext = {
      add_debt: ['deuda', 'prestamo', 'fiado', 'préstamo'],
      add_payment: ['pago', 'abono', 'cancelación', 'pagar'],
      query_debt: ['cuánto', 'cuanto', 'qué debe', 'que debe', 'consulta'],
      show_summary: ['total', 'balance', 'resumen'],
    };

    // Agrega estos patrones a tu detectIntent:

    // Para consultas de tiempo
    if (/(?:desde cuándo|desde cuando|hace cuánto|hace cuanto)\s+(?:me debe|le debo)/i.test(lowerText)) {
      console.log('✅ Intención: query_debt (consulta de tiempo)');
      return 'query_debt';
    }

    // Para consultas de historial específico
    if (/(?:último pago|historial de pagos|pagos de)\s+.+/i.test(lowerText)) {
      console.log('✅ Intención: query_last_payment o query_payment_history');

      // Distinguir entre último pago e historial completo
      if (lowerText.includes('último pago') || lowerText.includes('ultimo pago')) {
        return 'query_last_payment';
      } else {
        return 'query_payment_history';
      }
    }

    for (const [intent, keywords] of Object.entries(keywordContext)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          console.log(`✅ Intención: ${intent} (palabra: ${keyword})`);
          return intent as Intent;
        }
      }
    }

    console.log('❌ Intención no reconocida');
    return 'unknown';
  }

  // Aplicar correcciones básicas de números y monedas
  private applyBasicCorrections(text: string): string {
    const corrections: { [key: string]: string } = {
      // Números escritos
      'quinientos mil': '500 mil',
      'seiscientos mil': '600 mil',
      'setecientos mil': '700 mil',
      'ochocientos mil': '800 mil',
      'novecientos mil': '900 mil',
      'un millón': '1000000',
      'dos millones': '2000000',
      'tres millones': '3000000',

      // Monedas
      'dólares': 'pesos',
      'dolares': 'pesos',
      'dollar': 'pesos',
      'dólar': 'pesos',
      'euros': 'pesos',
      'usd': 'pesos',

      // Dialectos
      'luca': 'mil pesos',
      'paloma': 'mil pesos',
      'palo': 'mil pesos',
      'varos': 'pesos',
      'varito': 'mil pesos',
    };

    let corrected = text.toLowerCase();

    // Aplicar correcciones
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }

    return corrected;
  }

  // Procesar comando completo
  parseCommand(text: string): ParsedCommand {
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Aplicar correcciones básicas antes de procesar
    let processedText = this.applyBasicCorrections(text);
    console.log('🔍 Texto procesado:', processedText);

    const language = this.detectLanguage(processedText);
    const intent = this.detectIntent(processedText);
    let person = this.extractPerson(processedText);
    const amount = this.extractAmount(processedText);
    const description = this.extractDescription(processedText);

    console.log('🔍 NLP Resultado:', { intent, person, amount, description, language });

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

    const result: ParsedCommand = {
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
          const rawText = parsed.rawText.toLowerCase();
          const isOwing = rawText.includes('le debo') ||
            rawText.includes('debo a') ||
            rawText.includes('yo le debo');

          const date = new Date();
          const formattedDate = date.toLocaleDateString('es-ES');

          if (isOwing) {
            return `✅ Registrado el ${formattedDate}: Le debes ${formatCurrency(entities.amount)} a ${entities.person}${entities.description ? ` por "${entities.description}"` : ''}.`;
          } else {
            return `✅ Registrado el ${formattedDate}: ${entities.person} te debe ${formatCurrency(entities.amount)}${entities.description ? ` por "${entities.description}"` : ''}.`;
          }
        }
        return '¿Quién te debe cuánto?';

      case 'add_payment':
        if (entities.person && entities.amount) {
          const isMyPayment = parsed.rawText.toLowerCase().includes('le abono') ||
            parsed.rawText.toLowerCase().includes('abono a');

          const date = new Date();
          const formattedDate = date.toLocaleDateString('es-ES');

          if (isMyPayment) {
            return `✅ Registrado el ${formattedDate}: Pago de ${formatCurrency(entities.amount)} a ${entities.person}.`;
          } else {
            return `✅ Registrado el ${formattedDate}: ${entities.person} te pagó ${formatCurrency(entities.amount)}.`;
          }
        }
        return '¿Quién te pagó cuánto?';

      case 'query_debt':
        if (entities.person) {
          if (data?.amount) {
            // Verificar si es consulta de tiempo
            if (data?.hasTimeQuery && data.formattedOldestDate) {
              return `${entities.person} te debe ${formatCurrency(data.amount)} desde el ${data.formattedOldestDate} (hace ${data.daysSinceOldestDebt} días).`;
            }

            // Consulta normal
            return `${entities.person} te debe ${formatCurrency(data.amount)}${data.description ? ` por "${data.description}"` : ''}.`;
          }
          return `${entities.person} no tiene deudas pendientes.`;
        }
        // Consultas generales
        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            return 'No tienes deudas pendientes.';
          }
          const list = data.map(d => `${d.person}: ${formatCurrency(d.amount)}`).join(', ');
          return `📋 Tienes ${data.length} deuda${data.length > 1 ? 's' : ''}: ${list}.`;
        }
        return '¿De quién quieres saber cuánto te debe?';

      case 'show_summary':
        if (data) {
          const net = data.totalOwed - data.totalOwing;
          const netText = net >= 0 ? 'a tu favor' : 'en tu contra';
          return `📊 Resumen: Te deben ${formatCurrency(data.totalOwed)}. Tú debes ${formatCurrency(data.totalOwing)}. Balance: ${formatCurrency(Math.abs(net))} ${netText}.`;
        }
        return 'Aquí tienes el resumen de tus finanzas.';

      case 'create_client':
        if (entities.person) {
          const date = new Date().toLocaleDateString('es-ES');
          return `✅ Cliente agregado el ${date}: ${entities.person}.`;
        }
        return '¿Cómo se llama el cliente?';

      // ✅ RESPUESTAS MEJORADAS PARA PAGOS HISTÓRICOS
      case 'query_payment_history':
        if (entities.person) {
          if (data?.hasPayments) {
            // Verificar datos necesarios
            if (!data.totalPayments || data.totalPayments === 0) {
              return `${entities.person} no tiene pagos registrados.`;
            }

            if (data.totalPayments === 1) {
              const payment = data.recentPayments?.[0] || data.lastPayment;
              if (payment) {
                const date = payment.formattedDate || payment.date || 'fecha desconocida';
                const amount = formatCurrency(payment.amount || 0);
                return `📅 ${entities.person} te pagó ${amount} el ${date}.`;
              }
            }

            // Para múltiples pagos
            const lastPayment = data.lastPayment || {};
            const lastAmount = lastPayment.amount || 0;
            const lastDate = lastPayment.formattedDate || lastPayment.date || 'fecha desconocida';
            const daysSince = data.daysSinceLastPayment || 'varios';

            return `📅 Historial de ${entities.person}: ${data.totalPayments} pago${data.totalPayments > 1 ? 's' : ''} por ${formatCurrency(data.totalAmount || 0)}. Último pago: ${formatCurrency(lastAmount)} el ${lastDate} (hace ${daysSince} días).`;
          }
          return `${entities.person} no tiene pagos registrados.`;
        }
        return '¿De quién quieres ver el historial de pagos?';

      case 'query_last_payment':
        if (entities.person) {
          if (data?.hasPayments) {
            const payment = data.lastPayment || {};
            const timeDesc = payment.timeDescription || 'hace algún tiempo';
            const date = payment.formattedDate || payment.date || 'fecha desconocida';
            const amount = formatCurrency(payment.amount || 0);
            const desc = payment.description ? ` - ${payment.description}` : '';

            return `📅 El último pago de ${entities.person} fue ${timeDesc} (${date}): ${amount}${desc}.`;
          }
          return `${entities.person} no tiene pagos registrados.`;
        }
        return '¿De quién quieres saber el último pago?';

      case 'query_overdue_debts':
        if (data?.count && data.count > 0) {
          const totalAmount = data.totalAmount || 0;

          // Verificar que formattedDebts existe y es un array
          if (!data.formattedDebts || !Array.isArray(data.formattedDebts)) {
            return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}.`;
          }

          if (data.count === 1) {
            const debt = data.formattedDebts[0];
            const person = debt?.person || 'Alguien';
            const amount = formatCurrency(debt?.amount || 0);
            const date = debt?.formattedDate || 'alguna fecha';
            const daysOverdue = debt?.daysOverdue || 'varios';

            return `⚠️ ${person} debe ${amount} desde ${date} (${daysOverdue} días de retraso).`;
          }

          // Ordenar de forma segura
          try {
            // Filtrar solo deudas válidas - CORRECCIÓN: especificar tipo 'any'
            const validDebts = data.formattedDebts.filter((debt: any) =>
              debt && typeof debt === 'object'
            );

            if (validDebts.length === 0) {
              return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}.`;
            }

            // Ordenar por días de retraso (de mayor a menor) - también especificar tipo
            const sortedDebts = [...validDebts].sort((a: any, b: any) => {
              const daysA = a?.daysOverdue || 0;
              const daysB = b?.daysOverdue || 0;
              return daysB - daysA;
            });

            const topDebt = sortedDebts[0];
            const person = topDebt?.person || 'Alguien';
            const daysOverdue = topDebt?.daysOverdue || 'varios';

            return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}. La más antigua es ${person} con ${daysOverdue} días de retraso.`;
          } catch (error) {
            console.error('Error ordenando deudas:', error);
            return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}.`;
          }
        }
        return '🎉 ¡Todos están al día! No hay deudas vencidas.';

      default:
        return 'No entendí eso. Prueba con: "María me debe 2000 pesos" o "¿cuándo me pagó Juan?".';
    }
  }
}


export const nlpService = new NLPService();