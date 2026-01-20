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
    rawText?: string;
  };
}

export interface VoiceSettings {
  voiceURI: string;
  voiceName: string;
  rate: number;    // velocidad: 0.1 a 10
  pitch: number;   // tono: 0 a 2
  volume: number;  // volumen: 0 a 1
  language: string;
  genderPreference?: 'male' | 'female' | 'neutral';
  voicePersonality?: string; // Nueva: personalidad de voz
}

export interface VoiceInfo {
  uri: string;
  name: string;
  language: string;
  localService: boolean;
  default: boolean;
  isSpanish: boolean;
  isNeural: boolean;
  isGoogle: boolean;
  isMicrosoft: boolean;
  gender: 'male' | 'female' | 'neutral';
  rating: number;
  description: string;
  personality?: string; // Nueva: personalidad asociada
  isVirtual?: boolean; // Nueva: si es una voz virtual
  baseVoiceURI?: string; // Nueva: voz base para voces virtuales
}

// Nueva interfaz para variedad de voces
export interface VoicePersonality {
  id: string;
  name: string;
  icon: string;
  description: string;
  settings: {
    rate: number;
    pitch: number;
    volume: number;
  };
  style: 'formal' | 'friendly' | 'energetic' | 'calm' | 'professional';
}

class EnhancedVoiceService {
  private recognition: any = null;
  private isSupported: boolean;
  private synth = window.speechSynthesis;
  private currentSettings: VoiceSettings;
  private voicesLoaded: boolean = false;
  
  // Nueva: Sistema de personalidades de voz
  private voicePersonalities: VoicePersonality[] = [
    {
      id: 'asistente-formal',
      name: 'Asistente Formal',
      icon: '👔',
      description: 'Voz clara y profesional para negocios',
      settings: { rate: 1.0, pitch: 1.0, volume: 1.0 },
      style: 'formal'
    },
    {
      id: 'amigable',
      name: 'Asistente Amigable',
      icon: '😊',
      description: 'Voz cálida y cercana',
      settings: { rate: 1.1, pitch: 1.1, volume: 1.0 },
      style: 'friendly'
    },
    {
      id: 'energico',
      name: 'Asistente Energético',
      icon: '⚡',
      description: 'Voz rápida y dinámica',
      settings: { rate: 1.3, pitch: 1.2, volume: 1.0 },
      style: 'energetic'
    },
    {
      id: 'calmado',
      name: 'Asistente Calmado',
      icon: '😌',
      description: 'Voz pausada y relajante',
      settings: { rate: 0.8, pitch: 0.9, volume: 0.9 },
      style: 'calm'
    },
    {
      id: 'profesional',
      name: 'Asistente Profesional',
      icon: '💼',
      description: 'Voz seria y confiable',
      settings: { rate: 1.0, pitch: 0.9, volume: 1.0 },
      style: 'professional'
    }
  ];

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.currentSettings = this.loadVoiceSettings();
    
    // Inicializar sistema de voz
    this.initializeVoiceSystem();
  }

  // ============ INICIALIZACIÓN ============
  
  private initializeVoiceSystem(): void {
    // Cargar voces disponibles
    this.loadVoices();
    
    // Configurar eventos para cuando se carguen más voces
    this.synth.onvoiceschanged = () => {
      console.log('🎤 Voces actualizadas:', this.synth.getVoices().length);
      this.voicesLoaded = true;
      
      // Si no hay voz seleccionada, elegir la mejor por defecto
      if (!this.currentSettings.voiceURI || this.currentSettings.voiceURI === '') {
        this.setDefaultVoice();
      }
    };
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
      console.log('🎤 Voces cargadas al iniciar:', voices.length);
    }
  }

  private setDefaultVoice(): void {
    const spanishVoices = this.getAllVoicesWithInfo().filter(v => v.isSpanish);
    if (spanishVoices.length > 0) {
      // Ordenar por rating (mejores primero)
      const sortedVoices = spanishVoices.sort((a, b) => b.rating - a.rating);
      const bestVoice = sortedVoices[0];
      
      this.currentSettings.voiceURI = bestVoice.uri;
      this.currentSettings.voiceName = bestVoice.name;
      this.currentSettings.language = bestVoice.language;
      this.saveVoiceSettings();
      console.log('✅ Voz por defecto configurada:', bestVoice.name);
    }
  }

  // ============ GESTIÓN DE CONFIGURACIÓN ============
  
  private loadVoiceSettings(): VoiceSettings {
    const defaultSettings: VoiceSettings = {
      voiceURI: '',
      voiceName: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'es-ES',
      genderPreference: 'female',
      voicePersonality: 'asistente-formal'
    };

    try {
      const saved = localStorage.getItem('voiceSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar que los valores estén en rangos aceptables
        return {
          ...defaultSettings,
          ...parsed,
          rate: Math.max(0.5, Math.min(2.0, parsed.rate || 1.0)),
          pitch: Math.max(0.5, Math.min(2.0, parsed.pitch || 1.0)),
          volume: Math.max(0.1, Math.min(1.0, parsed.volume || 1.0))
        };
      }
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar las configuraciones de voz', error);
    }

    return defaultSettings;
  }

  private saveVoiceSettings(): void {
    try {
      localStorage.setItem('voiceSettings', JSON.stringify(this.currentSettings));
    } catch (error) {
      console.warn('⚠️ No se pudieron guardar las configuraciones de voz', error);
    }
  }

  // ============ NUEVO: SISTEMA DE VARIEDAD DE VOCES ============
  
  /**
   * Obtiene todas las voces disponibles, incluyendo voces virtuales creadas
   * a partir de ajustes de personalidad
   */
  public getAllVoicesWithInfo(includeVirtual: boolean = true): VoiceInfo[] {
    const realVoices = this.getAvailableVoices();
    const realVoicesInfo = realVoices.map(voice => this.createVoiceInfo(voice));
    
    if (!includeVirtual) {
      return realVoicesInfo.sort(this.sortVoices);
    }
    
    // Crear voces virtuales basadas en personalidades
    const virtualVoices = this.createVirtualVoices(realVoicesInfo);
    
    return [...virtualVoices, ...realVoicesInfo].sort(this.sortVoices);
  }
  
  private createVoiceInfo(voice: SpeechSynthesisVoice): VoiceInfo {
    const rating = this.rateVoice(voice);
    const gender = this.detectVoiceGender(voice.name);
    const description = this.getVoiceDescription(voice);
    
    return {
      uri: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
      localService: voice.localService,
      default: voice.default,
      isSpanish: voice.lang.startsWith('es'),
      isNeural: voice.name.toLowerCase().includes('neural'),
      isGoogle: voice.name.toLowerCase().includes('google'),
      isMicrosoft: voice.name.toLowerCase().includes('microsoft'),
      gender,
      rating,
      description
    };
  }
  
  /**
   * Crea voces virtuales aplicando diferentes personalidades a voces reales
   */
  private createVirtualVoices(realVoices: VoiceInfo[]): VoiceInfo[] {
    const virtualVoices: VoiceInfo[] = [];
    
    // Para cada voz real, crear variantes con diferentes personalidades
    realVoices.forEach(realVoice => {
      this.voicePersonalities.forEach(personality => {
        // Solo crear variantes para voces en español
        if (realVoice.isSpanish) {
          const virtualVoice: VoiceInfo = {
            uri: `virtual:${realVoice.uri}:${personality.id}`,
            name: `${realVoice.name} - ${personality.name}`,
            language: realVoice.language,
            localService: realVoice.localService,
            default: false,
            isSpanish: true,
            isNeural: realVoice.isNeural,
            isGoogle: realVoice.isGoogle,
            isMicrosoft: realVoice.isMicrosoft,
            gender: realVoice.gender,
            rating: realVoice.rating + 1, // Las virtuales tienen rating +1
            description: `${personality.description} (variante de ${realVoice.name})`,
            personality: personality.id,
            isVirtual: true,
            baseVoiceURI: realVoice.uri
          };
          virtualVoices.push(virtualVoice);
        }
      });
    });
    
    return virtualVoices;
  }
  
  private sortVoices(a: VoiceInfo, b: VoiceInfo): number {
    // Ordenar: primero español, luego voces reales, luego rating
    if (a.isSpanish && !b.isSpanish) return -1;
    if (!a.isSpanish && b.isSpanish) return 1;
    if (!a.isVirtual && b.isVirtual) return -1;
    if (a.isVirtual && !b.isVirtual) return 1;
    return b.rating - a.rating;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  private rateVoice(voice: SpeechSynthesisVoice): number {
    const name = voice.name.toLowerCase();
    let rating = 3; // Puntuación base

    // Puntos por características
    if (name.includes('neural')) rating += 2;
    if (name.includes('google')) rating += 1;
    if (name.includes('natural')) rating += 1;
    if (voice.localService) rating += 1;
    if (voice.default) rating += 1;
    if (voice.lang.startsWith('es')) rating += 2;
    
    // Limitar a 1-5
    return Math.max(1, Math.min(5, rating));
  }

  private detectVoiceGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();
    if (name.includes('male') || name.includes('hombre') || name.includes('masculin') || name.includes('man')) {
      return 'male';
    }
    if (name.includes('female') || name.includes('mujer') || name.includes('femenin') || name.includes('woman')) {
      return 'female';
    }
    return 'neutral';
  }

  private getVoiceDescription(voice: SpeechSynthesisVoice): string {
    const name = voice.name.toLowerCase();
    
    if (name.includes('google')) {
      if (name.includes('neural')) return 'Voz Google Neural (alta calidad)';
      return 'Voz Google (buena calidad)';
    }
    
    if (name.includes('microsoft')) {
      if (name.includes('neural')) return 'Voz Microsoft Neural (muy natural)';
      return 'Voz Microsoft (estándar)';
    }
    
    if (name.includes('natural')) return 'Voz natural';
    if (name.includes('neural')) return 'Voz neural (IA)';
    if (voice.localService) return 'Voz del sistema';
    if (voice.default) return 'Voz predeterminada';
    
    return 'Voz estándar';
  }

  // ============ NUEVO: MÉTODOS PARA PERSONALIDADES ============
  
  public getAllPersonalities(): VoicePersonality[] {
    return this.voicePersonalities;
  }
  
  public getPersonality(personalityId: string): VoicePersonality | undefined {
    return this.voicePersonalities.find(p => p.id === personalityId);
  }
  
  public setVoicePersonality(personalityId: string): boolean {
    const personality = this.getPersonality(personalityId);
    if (!personality) return false;
    
    // Actualizar ajustes con la personalidad
    this.updateVoiceSettings({
      voicePersonality: personalityId,
      rate: personality.settings.rate,
      pitch: personality.settings.pitch,
      volume: personality.settings.volume
    });
    
    return true;
  }
  
  public getCurrentPersonality(): VoicePersonality | undefined {
    if (!this.currentSettings.voicePersonality) return undefined;
    return this.getPersonality(this.currentSettings.voicePersonality);
  }

  public getSpanishVoices(): VoiceInfo[] {
    return this.getAllVoicesWithInfo().filter(v => v.isSpanish);
  }

  public getVoicesByGender(gender: 'male' | 'female'): VoiceInfo[] {
    return this.getAllVoicesWithInfo().filter(v => v.gender === gender);
  }
  
  // Nueva: Obtener voces por personalidad
  public getVoicesByPersonality(personalityId: string): VoiceInfo[] {
    return this.getAllVoicesWithInfo().filter(v => v.personality === personalityId);
  }

  // ============ CONFIGURACIÓN DE VOZ ============
  
  public getVoiceSettings(): VoiceSettings {
    return { ...this.currentSettings };
  }

  public updateVoiceSettings(settings: Partial<VoiceSettings>): void {
    const oldSettings = { ...this.currentSettings };
    this.currentSettings = { ...this.currentSettings, ...settings };
    
    // Validar y ajustar valores
    this.currentSettings.rate = Math.max(0.5, Math.min(2.0, this.currentSettings.rate));
    this.currentSettings.pitch = Math.max(0.5, Math.min(2.0, this.currentSettings.pitch));
    this.currentSettings.volume = Math.max(0.1, Math.min(1.0, this.currentSettings.volume));
    
    // Guardar solo si hay cambios
    if (JSON.stringify(oldSettings) !== JSON.stringify(this.currentSettings)) {
      this.saveVoiceSettings();
      console.log('✅ Configuración de voz actualizada:', this.currentSettings);
    }
  }

  public setVoice(voiceURI: string): boolean {
    const voices = this.getAllVoicesWithInfo();
    const selectedVoice = voices.find(v => v.uri === voiceURI);
    
    if (!selectedVoice) return false;
    
    // Si es una voz virtual, obtener la voz base
    if (selectedVoice.isVirtual && selectedVoice.baseVoiceURI) {
      const baseVoice = this.getAvailableVoices().find(v => v.voiceURI === selectedVoice.baseVoiceURI);
      if (baseVoice) {
        this.updateVoiceSettings({
          voiceURI: baseVoice.voiceURI,
          voiceName: baseVoice.name,
          language: baseVoice.lang,
          voicePersonality: selectedVoice.personality,
          rate: this.getPersonality(selectedVoice.personality!)?.settings.rate || 1.0,
          pitch: this.getPersonality(selectedVoice.personality!)?.settings.pitch || 1.0,
          volume: this.getPersonality(selectedVoice.personality!)?.settings.volume || 1.0
        });
      }
    } else {
      // Es una voz real
      const realVoice = this.getAvailableVoices().find(v => v.voiceURI === voiceURI);
      if (realVoice) {
        this.updateVoiceSettings({
          voiceURI: realVoice.voiceURI,
          voiceName: realVoice.name,
          language: realVoice.lang
        });
      }
    }
    
    return true;
  }

  public setVoiceByName(voiceName: string): boolean {
    const voices = this.getAllVoicesWithInfo();
    const selectedVoice = voices.find(v => v.name === voiceName);
    
    if (selectedVoice) {
      return this.setVoice(selectedVoice.uri);
    }
    
    return false;
  }

  // ============ SÍNTESIS DE VOZ MEJORADA ============
  
  speak(text: string, options?: Partial<VoiceSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject('La síntesis de voz no está disponible en tu navegador');
        return;
      }

      // Cancelar cualquier síntesis en curso
      if (this.synth.speaking) {
        this.synth.cancel();
      }

      // Pequeña pausa para evitar solapamientos
      setTimeout(() => {
        try {
          // Combinar configuración
          const settings = { ...this.currentSettings, ...options };
          
          // Crear utterance
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Buscar y configurar voz
          this.configureVoice(utterance, settings);
          
          // Aplicar ajustes
          utterance.rate = settings.rate;
          utterance.pitch = settings.pitch;
          utterance.volume = settings.volume;
          
          // Configurar eventos
          utterance.onend = () => {
            console.log('🎤 Voz reproducida:', text.substring(0, 50) + '...');
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('❌ Error en síntesis:', event);
            reject(new Error(`Error de voz: ${event.error}`));
          };
          
          utterance.onstart = () => {
            console.log('▶️ Iniciando síntesis de voz');
          };
          
          // Reproducir
          this.synth.speak(utterance);
          
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }

  private configureVoice(utterance: SpeechSynthesisUtterance, settings: VoiceSettings): void {
    const voices = this.getAvailableVoices();
    
    // Intentar usar la voz configurada
    if (settings.voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        return;
      }
    }
    
    // Intentar por nombre
    if (settings.voiceName) {
      const selectedVoice = voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        return;
      }
    }
    
    // Buscar la mejor voz en español
    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    if (spanishVoices.length > 0) {
      // Preferir voces del sistema
      const systemVoice = spanishVoices.find(v => v.localService) || spanishVoices[0];
      utterance.voice = systemVoice;
      utterance.lang = systemVoice.lang;
      return;
    }
    
    // Usar configuración de lenguaje
    utterance.lang = settings.language;
  }

  public previewVoice(voiceInfo: VoiceInfo): Promise<void> {
    const previewText = "Hola, soy tu asistente de voz. Esta es una muestra de cómo sueno. ¿Te gusta mi voz?";
    
    // Si es una voz virtual, usar los ajustes de su personalidad
    if (voiceInfo.isVirtual && voiceInfo.personality) {
      const personality = this.getPersonality(voiceInfo.personality);
      if (personality && voiceInfo.baseVoiceURI) {
        return this.speak(previewText, {
          voiceURI: voiceInfo.baseVoiceURI,
          voiceName: voiceInfo.name,
          rate: personality.settings.rate,
          pitch: personality.settings.pitch,
          volume: personality.settings.volume
        });
      }
    }
    
    // Para voces reales
    return this.speak(previewText, {
      voiceURI: voiceInfo.uri,
      voiceName: voiceInfo.name,
      rate: 1.1, // Un poco más lento para la muestra
      pitch: 1.0
    });
  }

  // ============ RECONOCIMIENTO DE VOZ ============
  
  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject('El reconocimiento de voz no está disponible en tu navegador');
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.lang = 'es-ES';
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

      this.recognition.onstart = () => {
        console.log('🎤 Reconocimiento de voz iniciado');
      };

      this.recognition.onend = () => {
        console.log('🎤 Reconocimiento de voz finalizado');
      };

      this.recognition.start();
    });
  }

  private correctTranscript(transcript: string): string {
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

      // Nombres comunes
      'camilo': 'camilo',
      'daniel': 'daniel',
      'miguel': 'miguel',
      'maría': 'maría',
      'juan': 'juan',
      'carlos': 'carlos',
      'ana': 'ana',
      'luis': 'luis',
      'pedro': 'pedro',

      // Frases comunes
      'medebe': 'me debe',
      'ledebo': 'le debo',
      'yo le debo': 'yo le debo',
      'abono a': 'abono a',
      'le abono': 'le abono',
      'mil pesos': 'mil pesos',
      'mil': 'mil',
      'pesos': 'pesos',
      'le debo a': 'le debo a',
      'yo le debo a': 'yo le debo a',

      // Números
      'quinientos': '500',
      'seiscientos': '600',
      'setecientos': '700',
      'ochocientos': '800',
      'novecientos': '900',
      'quinientos mil': '500 mil',
      'seiscientos mil': '600 mil',
      'setecientos mil': '700 mil',
      'ochocientos mil': '800 mil',
      'novecientos mil': '900 mil',
      'un millón': '1000000',
      'dos millones': '2000000',
      'tres millones': '3000000',
    };

    let corrected = transcript.toLowerCase();

    // Aplicar correcciones
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }

    // Capitalizar solo la primera letra
    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();

    console.log('🎤 Transcripción:', transcript, '→ Corregida:', corrected);
    return corrected;
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  // ============ COMANDOS DE VOZ ESPECIALES ============
  
  private processVoiceCommands(text: string): VoiceResponse | null {
    const lowerText = text.toLowerCase();
    
    // Comandos para gestionar voz
    if (lowerText.includes('cambia la voz') || lowerText.includes('cambiar voz')) {
      const voices = this.getSpanishVoices();
      const count = voices.length;
      const virtualCount = voices.filter(v => v.isVirtual).length;
      
      return {
        success: true,
        response: `Tengo ${count} voces disponibles (${virtualCount} variantes personalizadas). ¿Quieres que pruebe algunas o prefieres elegir desde la configuración?`,
        data: { 
          action: 'change_voice', 
          count,
          virtualCount,
          personalities: this.voicePersonalities.length 
        }
      };
    }
    
    if (lowerText.includes('voces disponibles') || lowerText.includes('qué voces tengo')) {
      const voices = this.getSpanishVoices();
      const realVoices = voices.filter(v => !v.isVirtual);
      const virtualVoices = voices.filter(v => v.isVirtual);
      
      if (voices.length === 0) {
        return {
          success: false,
          response: 'No encontré voces en español disponibles. Puedes agregar voces desde la configuración de tu sistema.'
        };
      }
      
      const personalitiesList = this.voicePersonalities
        .map(p => `${p.icon} ${p.name}`)
        .join(', ');
      
      return {
        success: true,
        response: `Tengo ${realVoices.length} voces base y ${virtualVoices.length} variantes personalizadas. Estilos disponibles: ${personalitiesList}. Para cambiarla, di "configuración de voz".`,
        data: { 
          realCount: realVoices.length,
          virtualCount: virtualVoices.length,
          personalities: this.voicePersonalities.map(p => p.name)
        }
      };
    }
    
    if (lowerText.includes('configuración de voz') || lowerText.includes('ajustes de voz')) {
      return {
        success: true,
        response: 'Redirigiendo a la configuración de voz. Allí podrás seleccionar entre todas las voces disponibles y ajustar velocidad, tono y volumen.',
        data: { action: 'open_voice_settings' }
      };
    }
    
    if (lowerText.includes('más rápido') || lowerText.includes('habla más rápido')) {
      const newRate = Math.min(this.currentSettings.rate + 0.2, 2.0);
      this.updateVoiceSettings({ rate: newRate });
      return {
        success: true,
        response: `Voz configurada a velocidad ${newRate.toFixed(1)}. ¿Así está mejor?`,
        data: { newRate }
      };
    }
    
    if (lowerText.includes('más lento') || lowerText.includes('habla más lento')) {
      const newRate = Math.max(this.currentSettings.rate - 0.2, 0.5);
      this.updateVoiceSettings({ rate: newRate });
      return {
        success: true,
        response: `Voz configurada a velocidad ${newRate.toFixed(1)}. ¿Así está mejor?`,
        data: { newRate }
      };
    }
    
    if (lowerText.includes('voz femenina') || lowerText.includes('voz de mujer')) {
      const femaleVoices = this.getVoicesByGender('female');
      if (femaleVoices.length > 0) {
        this.setVoice(femaleVoices[0].uri);
        return {
          success: true,
          response: `Voz cambiada a ${femaleVoices[0].name}. ¿Te gusta cómo sueno?`,
          data: { voice: femaleVoices[0] }
        };
      }
    }
    
    if (lowerText.includes('voz masculina') || lowerText.includes('voz de hombre')) {
      const maleVoices = this.getVoicesByGender('male');
      if (maleVoices.length > 0) {
        this.setVoice(maleVoices[0].uri);
        return {
          success: true,
          response: `Voz cambiada a ${maleVoices[0].name}. ¿Te gusta cómo sueno?`,
          data: { voice: maleVoices[0] }
        };
      }
    }
    
    // Nuevos comandos para personalidades
    if (lowerText.includes('voz formal') || lowerText.includes('estilo formal')) {
      if (this.setVoicePersonality('asistente-formal')) {
        return {
          success: true,
          response: 'Estilo cambiado a Asistente Formal. ¿Te gusta este tono profesional?',
          data: { personality: 'asistente-formal' }
        };
      }
    }
    
    if (lowerText.includes('voz amigable') || lowerText.includes('estilo amigable')) {
      if (this.setVoicePersonality('amigable')) {
        return {
          success: true,
          response: 'Estilo cambiado a Asistente Amigable. ¿Te gusta este tono cálido?',
          data: { personality: 'amigable' }
        };
      }
    }
    
    if (lowerText.includes('voz energética') || lowerText.includes('estilo energético')) {
      if (this.setVoicePersonality('energico')) {
        return {
          success: true,
          response: 'Estilo cambiado a Asistente Energético. ¿Te gusta este tono dinámico?',
          data: { personality: 'energico' }
        };
      }
    }
    
    if (lowerText.includes('voz calmada') || lowerText.includes('estilo calmado')) {
      if (this.setVoicePersonality('calmado')) {
        return {
          success: true,
          response: 'Estilo cambiado a Asistente Calmado. ¿Te gusta este tono relajante?',
          data: { personality: 'calmado' }
        };
      }
    }
    
    return null;
  }

  // ============ PROCESAMIENTO DE COMANDOS NLP ============
  
  async processNaturalCommand(text: string): Promise<VoiceResponse> {
    console.log('📝 Procesando comando:', text);

    // Verificar si es un comando de voz
    const voiceCommand = this.processVoiceCommands(text);
    if (voiceCommand) {
      return voiceCommand;
    }

    try {
      // 1. Parsear el comando con NLP
      const parsed = nlpService.parseCommand(text);
      console.log('🔍 Comando parseado:', parsed);
      console.log('🔍 Intent:', parsed.intent, 'Person:', parsed.entities.person, 'Amount:', parsed.entities.amount);
      
      // 2. Verificar si necesita confirmación (cliente no existe)
      if ((parsed.intent === 'add_debt' || parsed.intent === 'add_payment') && parsed.entities.person && parsed.entities.amount) {
        console.log('🔍 Verificando confirmación para:', parsed.entities.person, 'monto:', parsed.entities.amount);
        const clientExists = this.checkClientExists(parsed.entities.person);
        console.log('🔍 Cliente existe:', clientExists);

        if (!clientExists) {
          console.log('⚠️ Cliente no existe, solicitando confirmación');
          console.log('⚠️ parsed.rawText:', parsed.rawText);
          const isPayment = parsed.intent === 'add_payment';
          const actionText = isPayment ? 'registre el pago' : 'registre que te debe';

          const confirmationDataToSave = {
            action: parsed.intent,
            person: parsed.entities.person,
            amount: parsed.entities.amount,
            description: parsed.entities.description,
            rawText: parsed.rawText,
          };

          console.log('⚠️ confirmationData que se guardará:', confirmationDataToSave);

          return {
            success: false,
            response: `No conozco a ${parsed.entities.person} todavía. ¿Quieres que lo agregue como cliente y ${actionText} ${formatCurrency(parsed.entities.amount)}${parsed.entities.description ? ` por ${parsed.entities.description}` : ''}?`,
            parsed,
            needsConfirmation: true,
            confirmationData: confirmationDataToSave
          };
        } else {
          console.log('✅ Cliente existe, procesando deuda normalmente');
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
  
  // ============ MANEJADORES DE ACCIONES (sin cambios) ============
  
  private checkClientExists(personName: string): boolean {
    if (!personName) return false;
    const clients = storageService.getClients();
    const normalizedPersonName = personName.toLowerCase().trim();

    console.log('🔍 Verificando si existe cliente:', normalizedPersonName);

    let exists = clients.some(client =>
      client.name.toLowerCase().trim() === normalizedPersonName
    );

    if (!exists) {
      exists = clients.some(client => {
        const clientName = client.name.toLowerCase().trim();
        return clientName.includes(normalizedPersonName) ||
               normalizedPersonName.includes(clientName);
      });
    }

    console.log('🔍 Resultado checkClientExists:', exists);
    return exists;
  }
  
  private async handleAddDebt(parsed: ParsedCommand): Promise<boolean> {
    const { person, amount, description } = parsed.entities;

    if (!person || !amount) {
      throw new Error('Falta información: persona o monto');
    }

    const rawText = parsed.rawText.toLowerCase();
    const isOwing = rawText.includes('yo debo') ||
                   rawText.includes('le debo') ||
                   rawText.includes('debo a');

    console.log('💰 Determinando tipo de deuda:', isOwing ? 'owing (TÚ debes)' : 'owed (te deben)');

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

    const isMyPayment = parsed.rawText.toLowerCase().includes('le abono') ||
                        parsed.rawText.toLowerCase().includes('abono a') ||
                        parsed.rawText.toLowerCase().includes('le pagué') ||
                        parsed.rawText.toLowerCase().includes('pagué a');

    const clients = storageService.getClients();
    const client = clients.find(c =>
      c.name.toLowerCase().includes(person.toLowerCase())
    );

    if (!client) {
      throw new Error(`${person} no está registrado como cliente`);
    }

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
          storageService.findOrCreateClient(this.capitalizeName(person));

          const debtRawText = confirmationData.rawText || '';
          const normalizedText = debtRawText.toLowerCase();
          const shouldBeOwing = normalizedText.includes('yo debo') ||
                               normalizedText.includes('le debo') ||
                               normalizedText.includes('debo a');

          try {
            storageService.addDebt({
              type: shouldBeOwing ? 'owing' : 'owed',
              person: this.capitalizeName(person),
              amount: amount,
              description: description || 'Deuda registrada por voz',
              date: new Date(),
              status: 'pending',
              paidAmount: 0,
            });
            console.log('✅ Deuda creada con tipo:', shouldBeOwing ? 'owing' : 'owed');
          } catch (error: any) {
            console.error('❌ Error creando deuda:', error);
            throw error;
          }
          
          const responseText = debtRawText.toLowerCase();
          const isOwingResponse = responseText.includes('yo debo') ||
                                 responseText.includes('le debo') ||
                                 responseText.includes('debo a');

          const responseMessage = isOwingResponse
            ? `✅ Cliente creado y deuda registrada: le debes ${formatCurrency(amount)} a ${person}${description ? ` por "${description}"` : ''}.`
            : `✅ Cliente creado y deuda registrada: ${person} te debe ${formatCurrency(amount)}${description ? ` por "${description}"` : ''}.`;

          return {
            success: true,
            response: responseMessage,
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
  
  async processText(text: string): Promise<VoiceResponse> {
    return this.processNaturalCommand(text);
  }
  
  getStats() {
    const voices = this.getAllVoicesWithInfo();
    const realVoices = voices.filter(v => !v.isVirtual);
    const virtualVoices = voices.filter(v => v.isVirtual);
    const spanishVoices = voices.filter(v => v.isSpanish);
    
    return {
      isVoiceSupported: this.isSupported,
      voicesAvailable: voices.length,
      realVoicesAvailable: realVoices.length,
      virtualVoicesAvailable: virtualVoices.length,
      spanishVoicesAvailable: spanishVoices.length,
      personalitiesAvailable: this.voicePersonalities.length,
      currentVoice: this.currentSettings.voiceName || 'Predeterminada',
      currentPersonality: this.currentSettings.voicePersonality || 'Ninguna',
      currentSettings: this.currentSettings,
      debtsCount: storageService.getDebts().length,
      clientsCount: storageService.getClients().length,
    };
  }

  // Métodos adicionales para UI
  public isVoiceSystemReady(): boolean {
    return this.voicesLoaded && this.getAvailableVoices().length > 0;
  }

  public getCurrentVoiceInfo(): VoiceInfo | null {
    const voices = this.getAllVoicesWithInfo();
    return voices.find(v => v.uri === this.currentSettings.voiceURI) || null;
  }

  public resetToDefaultVoice(): void {
    this.currentSettings = this.loadVoiceSettings();
    if (!this.currentSettings.voiceURI) {
      this.setDefaultVoice();
    }
  }
  
  // Nueva: Obtener solo voces reales (sin virtuales)
  public getRealVoices(): VoiceInfo[] {
    return this.getAllVoicesWithInfo(false);
  }
  
  // Nueva: Obtener solo voces virtuales
  public getVirtualVoices(): VoiceInfo[] {
    return this.getAllVoicesWithInfo().filter(v => v.isVirtual);
  }
  
  // Nueva: Contar voces por tipo
  public countVoicesByType() {
    const voices = this.getAllVoicesWithInfo();
    return {
      total: voices.length,
      real: voices.filter(v => !v.isVirtual).length,
      virtual: voices.filter(v => v.isVirtual).length,
      spanish: voices.filter(v => v.isSpanish).length,
      male: voices.filter(v => v.gender === 'male').length,
      female: voices.filter(v => v.gender === 'female').length
    };
  }
}

export const enhancedVoiceService = new EnhancedVoiceService();