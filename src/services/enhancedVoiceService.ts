import { nlpService, ParsedCommand } from './nlpService';
import { storageService } from './storageService';
import { userService } from './userService';
import { formatCurrency } from '../utils/formatters';

export interface VoiceResponse {
  success: boolean;
  response: string;
  data?: any;
  parsed?: ParsedCommand;
  needsConfirmation?: boolean;
  confirmationData?: {
    action: 'create_client' | 'add_debt' | 'add_payment';
    person: string;
    amount?: number;
    description?: string;
  };
}

class EnhancedVoiceService {
  // Variable para el reconocimiento de voz nativo del navegador
  private recognition: any = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // ============ RECONOCIMIENTO DE VOZ BÁSICO ============
  
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject('El reconocimiento de voz no está disponible en tu navegador');
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.lang = 'es-ES'; // Español estándar, mejor soporte
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let transcript = event.results[0][0].transcript;
        transcript = this.correctTranscript(transcript);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        reject(event.error);
      };

      this.recognition.start();
    });
  }

  private correctTranscript(transcript: string): string {
    // Diccionario de correcciones para nombres comunes mal reconocidos
    const corrections: { [key: string]: string } = {
      // Nombres específicos mencionados
      'jason': 'yeison',
      'jason guzmán': 'yeison guzmán',
      'jason gusman': 'yeison guzmán',
      'jeison': 'yeison',
      'jeison guzmán': 'yeison guzmán',
      'jeison gusman': 'yeison guzmán',
      'yeison': 'yeison',
      'yeison guzmán': 'yeison guzmán',
      'guzman': 'guzmán',
      'gusman': 'guzmán',
      'jenny': 'jenny',
      'jeimi': 'jeimi',
      'gisela': 'gisela',

      // Nombres comunes que podrían confundirse
      'camilo': 'camilo',
      'daniel': 'daniel',
      'miguel': 'miguel',
      'maría': 'maría',
      'juan': 'juan',
      'carlos': 'carlos',
      'ana': 'ana',
      'luis': 'luis',
      'pedro': 'pedro',

      // Frases comunes mal reconocidas (alta prioridad)
      'medebe': 'me debe',
      'ledebe': 'le debe',
      'ledebo': 'le debo',
      'yo le debo': 'yo le debo',
      'abono a': 'abono a',
      'le abono': 'le abono',
      'pago a': 'pago a',
      'le pago': 'le pago',
      'le pague': 'le pagué',
      'ya le pague': 'ya le pagué',
      'ya pague': 'ya pagué',
      'mil pesos': 'mil pesos',
      'mil': 'mil',
      'pesos': 'pesos',
      'le debo a': 'le debo a',
      'yo le debo a': 'yo le debo a',
      'me debe a mi': 'me debe a mí',
      'me debe ami': 'me debe a mí',

      // Correcciones de monedas y cantidades
      'dolares': 'pesos',
      'dollar': 'pesos',
      'dólar': 'pesos',
      'euros': 'pesos',
      'moneda': 'pesos',
      'plata': 'pesos',
      'dinero': 'pesos',
      'guarani': 'pesos',
      'real': 'pesos',
      'sol': 'pesos',

      // Variaciones de "pesos" (moneda local)
      'peso': 'pesos',
      'pesito': 'pesos',
      'pesitos': 'pesos',
      'billete': 'pesos',
      'billetes': 'pesos',
      'luca': 'mil pesos',
      'paloma': 'mil pesos',
      'palo': 'mil pesos',
      'varos': 'pesos',
      'varito': 'mil pesos',
      'ficha': 'mil pesos',
      'lucas': 'mil pesos',
      'palos': 'mil pesos',
      'morito': 'mil pesos',
      'moritos': 'mil pesos',

      // Correcciones específicas de transcripción
      'dólares americanos': 'pesos',
      'moneda americana': 'pesos',
      'divisas': 'pesos',

      // Números grandes mal reconocidos (expandido)
      'quinientos mil': '500 mil',
      'seiscientos mil': '600 mil',
      'setecientos mil': '700 mil',
      'ochocientos mil': '800 mil',
      'novecientos mil': '900 mil',
      'un millón': '1000000',
      'dos millones': '2000000',
      'tres millones': '3000000',
      'cuatro millones': '4000000',
      'cinco millones': '5000000',
      'diez mil': '10000',
      'veinte mil': '20000',
      'treinta mil': '30000',
      'cuarenta mil': '40000',
      'cincuenta mil': '50000',
      'sesenta mil': '60000',
      'setenta mil': '70000',
      'ochenta mil': '80000',
      'noventa mil': '90000',

      // Números escritos como palabras
      'cien': '100',
      'ciento': '100',
      'doscientos': '200',
      'trescientos': '300',
      'cuatrocientos': '400',
      'quinientos': '500',
      'seiscientos': '600',
      'setecientos': '700',
      'ochocientos': '800',
      'novecientos': '900',
      'cien mil': '100000',
      'ciento mil': '100000',

      // Variaciones dialectales comunes
      'usté': 'usted',
      'ustede': 'usted',
      'vos': 'tú',
      'boludo': 'amigo',  // evitar ofensivas, pero corregir contexto
      'che': 'oye',
      'mae': 'mamá',
      'papi': 'papá',
      'tío': 'señor',
      'tía': 'señora',

      // Frases completas comunes
      'no me debe nada': 'no me debe nada',
      'ya me pagó': 'ya me pagó',
      'ya pagué': 'ya pagué',
      'está al día': 'está al día',
      'estamos a mano': 'estamos a mano',
      'saldo cero': 'saldo cero',

      // Expresiones de tiempo
      'el mes pasado': 'el mes pasado',
      'la semana pasada': 'la semana pasada',
      'hace una semana': 'hace una semana',
      'hace un mes': 'hace un mes',
      'desde hace tiempo': 'desde hace tiempo',
    };

    let corrected = transcript.toLowerCase();

    // Aplicar correcciones palabra por palabra
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }

    // Capitalizar solo la primera letra de cada oración, no nombres para evitar tildes incorrectas
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();

    console.log('🎤 Transcripción corregida:', transcript, '→', corrected);
    return corrected;
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject('La síntesis de voz no está disponible');
        return;
      }

      // Verificar si hay voz personalizada para esta respuesta
      const customVoice = this.getCustomVoiceForText(text);
      if (customVoice) {
        // Reproducir audio personalizado
        this.playCustomVoice(customVoice).then(resolve).catch(() => {
          // Fallback a síntesis si audio falla
          this.fallbackSynthesis(text).then(resolve).catch(reject);
        });
        return;
      }

      // Usar síntesis estándar
      this.fallbackSynthesis(text).then(resolve).catch(reject);
    });
  }

  private getCustomVoiceForText(text: string): string | null {
    // Obtener preferencia de voz del usuario (femenina o masculina)
    const user = userService.getCurrentUser();
    const voicePreference = user?.voicePreference || 'female'; // default a female
    const voiceType = voicePreference.includes('female') || voicePreference.includes('mujer') || voicePreference.includes('femenina') ? 'female' : 'male';

    // Mapa de respuestas comunes a archivos de audio personalizados
    // Nota: Los archivos deberían estar en /public/voices/
    // Formato: voice_[tipo]_[frase].mp3
    const customResponses: { [key: string]: string } = {
      '¡Perfecto! He registrado que': `voice_${voiceType}_debt_start.mp3`,
      '¡Excelente! He registrado que le pagaste': `voice_${voiceType}_payment_start.mp3`,
      '¡Genial!': `voice_${voiceType}_success.mp3`,
      'No tienes deudas pendientes': `voice_${voiceType}_no_debts.mp3`,
      '¿Cuánto debe': `voice_${voiceType}_query_start.mp3`,
      'te debe': `voice_${voiceType}_owed.mp3`,
      'tú debes': `voice_${voiceType}_owing.mp3`,
      'pago registrado': `voice_${voiceType}_payment_done.mp3`,
      'cliente creado': `voice_${voiceType}_client_created.mp3`,
      'operación cancelada': `voice_${voiceType}_cancelled.mp3`,
      'hubo un error': `voice_${voiceType}_error.mp3`,
      'No entendí': `voice_${voiceType}_not_understood.mp3`,
      'Repite por favor': `voice_${voiceType}_repeat.mp3`,
      'Comando no reconocido': `voice_${voiceType}_unrecognized.mp3`,
    };

    // Buscar coincidencia parcial
    for (const [key, file] of Object.entries(customResponses)) {
      if (text.toLowerCase().includes(key.toLowerCase())) {
        return file;
      }
    }

    return null;
  }

  private playCustomVoice(audioFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`/voices/${audioFile}`);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio no encontrado'));
      audio.play().catch(reject);
    });
  }

  private fallbackSynthesis(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';

      // Configuración para voz natural y clara
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;

      // Seleccionar voz preferida
      const voices = speechSynthesis.getVoices();
      const user = userService.getCurrentUser();
      let selectedVoice = null;

      if (user?.voicePreference) {
        selectedVoice = voices.find(voice => voice.voiceURI === user.voicePreference);
      }

      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event);

      speechSynthesis.speak(utterance);
    });
  }

  // ============ PROCESAMIENTO DE COMANDOS NLP ============
  
  async processNaturalCommand(text: string): Promise<VoiceResponse> {
    console.log('📝 Procesando comando:', text);
    
    try {
      // 1. Parsear el comando con NLP
      const parsed = nlpService.parseCommand(text);
      console.log('🔍 Comando parseado:', parsed);
      
      // 2. Verificar si necesita confirmación (cliente no existe)
      if (parsed.intent === 'add_debt' && parsed.entities.person && parsed.entities.amount) {
        const clientExists = this.checkClientExists(parsed.entities.person);
        if (!clientExists) {
          return {
            success: false,
            response: `No conozco a ${parsed.entities.person} todavía. ¿Quieres que lo agregue como cliente y registre que te debe ${formatCurrency(parsed.entities.amount)}${parsed.entities.description ? ` por ${parsed.entities.description}` : ''}?`,
            parsed,
            needsConfirmation: true,
            confirmationData: {
              action: 'add_debt',
              person: parsed.entities.person,
              amount: parsed.entities.amount,
              description: parsed.entities.description,
            }
          };
        }
      }
      
      // 3. Ejecutar acción según intención
      let data: any = null;
      let success = false;
      
      switch (parsed.intent) {
        case 'add_debt':
          success = await this.handleAddDebt(parsed);
          if (success) {
            data = storageService.getSummary();
          }
          break;
          
        case 'add_payment':
          success = await this.handleAddPayment(parsed);
          if (success && parsed.entities.person) {
            data = storageService.getClientSummary(parsed.entities.person);
          }
          break;
          
        case 'query_debt':
          data = await this.handleQueryDebt(parsed);
          success = true;
          break;
          
        case 'show_summary':
          data = {
            personal: storageService.getSummary(),
            business: storageService.getBusinessSummary(),
          };
          success = true;
          break;
          
        case 'create_client':
          success = await this.handleCreateClient(parsed);
          break;
          
        default:
          // Fallback a regex básico
          return this.fallbackToBasicSystem(text);
      }
      
      // 4. Generar respuesta
      const response = nlpService.generateResponse(parsed, data);
      
      console.log('✅ Resultado:', { success, response });
      
      return {
        success,
        response,
        data,
        parsed,
      };
      
    } catch (error: any) {
      console.error('❌ Error procesando comando:', error);
      return {
        success: false,
        response: `Hubo un error: ${error.message}. Intenta de nuevo.`,
      };
    }
  }
  
  // ============ MANEJADORES DE ACCIONES ============
  
  private checkClientExists(personName: string): boolean {
    if (!personName) return false;
    const clients = storageService.getClients();
    return clients.some(client => 
      client.name.toLowerCase() === personName.toLowerCase()
    );
  }
  
  private async handleAddDebt(parsed: ParsedCommand): Promise<boolean> {
    const { person, amount, description } = parsed.entities;

    if (!person || !amount) {
      throw new Error('Falta información: persona o monto');
    }

    // Determinar tipo: owed si "me debe", owing si "yo debo" o "le debo"
    const isOwing = parsed.rawText.toLowerCase().includes('yo debo') ||
                   parsed.rawText.toLowerCase().includes('le debo') ||
                   parsed.rawText.toLowerCase().includes('debo a');

    try {
      storageService.addDebt({
        type: isOwing ? 'owing' : 'owed',
        person: this.capitalizeName(person),
        amount: amount,
        description: description || 'Deuda registrada por voz',
        date: new Date(),
        status: 'pending',
        paidAmount: 0,
      });
      
      return true;
    } catch (error: any) {
      console.error('Error agregando deuda:', error);
      throw error;
    }
  }
  
  private async handleAddPayment(parsed: ParsedCommand): Promise<boolean> {
    const { person, amount } = parsed.entities;

    if (!person || !amount) {
      throw new Error('Falta información: persona o monto');
    }

    // Determinar tipo de pago: si incluye frases de pago mío, es pago mío (owing), sino pago recibido (owed)
    const isMyPayment = parsed.rawText.toLowerCase().includes('le abono') ||
                        parsed.rawText.toLowerCase().includes('abono a') ||
                        parsed.rawText.toLowerCase().includes('le pagué') ||
                        parsed.rawText.toLowerCase().includes('pagué a');

    // Buscar cliente
    const clients = storageService.getClients();
    const client = clients.find(c =>
      c.name.toLowerCase().includes(person.toLowerCase())
    );

    if (!client) {
      throw new Error(`${person} no está registrado como cliente`);
    }

    // Buscar deudas pendientes: owed si pago recibido, owing si pago mío
    const debtType = isMyPayment ? 'owing' : 'owed';
    const clientDebts = storageService.getDebts().filter(d =>
      d.type === debtType &&
      d.person.toLowerCase() === client.name.toLowerCase() &&
      d.status !== 'paid'
    );

    if (clientDebts.length === 0) {
      const tipoTexto = isMyPayment ? 'deudas tuyas con' : 'deudas de';
      throw new Error(`${person} no tiene ${tipoTexto} pendientes`);
    }
    
    // Aplicar pago a la primera deuda
    const debt = clientDebts[0];
    
    try {
      storageService.addPayment(
        debt.id, 
        amount, 
        `Pago de ${person} registrado por voz`
      );
      return true;
    } catch (error) {
      console.error('Error registrando pago:', error);
      throw error;
    }
  }
  
  private async handleQueryDebt(parsed: ParsedCommand): Promise<any> {
    const { person } = parsed.entities;

    // Si no hay persona y es consulta general de owing
    if (!person && (parsed.rawText.toLowerCase().includes('les debo') || parsed.rawText.toLowerCase().includes('debo a'))) {
      const debts = storageService.getDebts();
      const owingDebts = debts.filter(d => d.type === 'owing' && d.status === 'pending');

      return owingDebts.map(d => ({
        person: d.person,
        amount: d.amount - (d.paidAmount || 0),
        description: d.description
      }));
    }

    if (!person) {
      throw new Error('¿De quién quieres consultar la deuda?');
    }
    
    const clients = storageService.getClients();
    const client = clients.find(c => 
      c.name.toLowerCase().includes(person.toLowerCase())
    );
    
    if (!client) {
      throw new Error(`${person} no está registrado como cliente`);
    }
    
    const clientDebts = storageService.getDebts().filter(d => 
      d.type === 'owed' && 
      d.person.toLowerCase() === client.name.toLowerCase()
    );
    
    if (clientDebts.length === 0) {
      return { 
        amount: 0, 
        message: 'No hay deudas registradas',
        clientName: client.name 
      };
    }
    
    const pendingDebts = clientDebts.filter(d => d.status !== 'paid');
    const totalPending = pendingDebts.reduce((sum, d) => 
      sum + (d.amount - (d.paidAmount || 0)), 0
    );
    
    return {
      clientName: client.name,
      amount: totalPending,
      pendingCount: pendingDebts.length,
      totalCount: clientDebts.length,
    };
  }
  
  private async handleCreateClient(parsed: ParsedCommand): Promise<boolean> {
    const { person } = parsed.entities;
    
    if (!person) {
      throw new Error('¿Qué nombre tiene el nuevo cliente?');
    }
    
    try {
      storageService.findOrCreateClient(this.capitalizeName(person));
      return true;
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }
  
  // ============ MANEJO DE CONFIRMACIONES ============
  
  async handleConfirmation(
    confirmationData: any, 
    confirm: boolean
  ): Promise<VoiceResponse> {
    if (!confirm) {
      return {
        success: false,
        response: 'Operación cancelada.',
      };
    }
    
    const { action, person, amount, description } = confirmationData;
    
    switch (action) {
      case 'add_debt':
        try {
          // Crear cliente primero
          storageService.findOrCreateClient(this.capitalizeName(person));
          
          // Luego agregar deuda
          await this.handleAddDebt({
            intent: 'add_debt',
            entities: { person, amount, description },
            confidence: 0.9,
            rawText: '',
            language: 'es',
          } as ParsedCommand);
          
          return {
            success: true,
            response: `✅ Cliente creado y deuda registrada: ${person} debe ${amount} pesos${description ? ` por "${description}"` : ''}.`,
            data: storageService.getClientSummary(person),
          };
        } catch (error: any) {
          return {
            success: false,
            response: `❌ Error: ${error.message}`,
          };
        }
        
      default:
        return {
          success: false,
          response: '❌ Acción no válida.',
        };
    }
  }
  
  // ============ SISTEMA DE FALLBACK BÁSICO ============
  
  private fallbackToBasicSystem(text: string): VoiceResponse {
    console.log('🔄 Usando sistema básico de regex');
    
    // Regex básicos para compatibilidad
    const patterns = [
      {
        pattern: /(.+?)\s+(?:me debe|debe|qued[oó] debiendo)\s+(\d+)\s+pesos?(?:\s+por\s+(.+))?/i,
        handler: (match: RegExpMatchArray) => {
          const [, person, amount, description] = match;
          return `Registrado: ${person} debe ${amount} pesos${description ? ` por ${description}` : ''}`;
        }
      },
      {
        pattern: /(.+?)\s+(?:pag[oó]|abon[oó])\s+(\d+)\s+pesos/i,
        handler: (match: RegExpMatchArray) => {
          const [, person, amount] = match;
          return `Pago registrado: ${person} pagó ${amount} pesos`;
        }
      },
      {
        pattern: /cu[aá]nto debe (.+)/i,
        handler: (match: RegExpMatchArray) => {
          const [, person] = match;
          return `Consulta: ${person} - función en desarrollo`;
        }
      },
      {
        pattern: /resumen de deudas/i,
        handler: () => {
          const summary = storageService.getSummary();
          return `Resumen: Te deben ${summary.totalOwed} pesos. Tú debes ${summary.totalOwing} pesos.`;
        }
      }
    ];
    
    for (const { pattern, handler } of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          success: true,
          response: handler(match),
        };
      }
    }
    
    return {
      success: false,
      response: 'No entendí el comando. Intenta con: "José debe 2000 pesos por materiales"',
    };
  }
  
  // ============ UTILIDADES ============
  
  private capitalizeName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Método para procesar texto directamente
  async processText(text: string): Promise<VoiceResponse> {
    return this.processNaturalCommand(text);
  }
  
  // Obtener estadísticas
  getStats() {
    return {
      isVoiceSupported: this.isSupported,
      debtsCount: storageService.getDebts().length,
      clientsCount: storageService.getClients().length,
    };
  }
}

export const enhancedVoiceService = new EnhancedVoiceService();