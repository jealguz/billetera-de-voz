import { nlpService, ParsedCommand } from './nlpService';
import { storageService } from './apiStorageService';
import { formatCurrency } from '../utils/formatters';
import api from './apiClient';

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
  rate: number;
  pitch: number;
  volume: number;
  language: string;
  genderPreference?: 'male' | 'female' | 'neutral';
  voicePersonality?: string;
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
  personality?: string;
  isVirtual?: boolean;
  baseVoiceURI?: string;
  engine?: 'native' | 'premium';
  provider?: string;
}

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
  private activeAudio: HTMLAudioElement | null = null;
  private speechCancelled: boolean = false;

  // Voces premium (red neuronal) sin necesidad de clave API. Se reproducen con un
  // elemento <audio>, así que no requieren CORS. Si fallan, se usa la voz del sistema.
  private premiumVoices: VoiceInfo[] = [
    {
      uri: 'premium:edge:es-ES-ElviraNeural',
      name: 'Elvira Neural · España',
      language: 'es-ES',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'female',
      rating: 5,
      description: 'Voz neuronal Microsoft (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-ES-AlvaroNeural',
      name: 'Álvaro Neural · España',
      language: 'es-ES',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'male',
      rating: 5,
      description: 'Voz neuronal masculina (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-MX-DaliaNeural',
      name: 'Dalia Neural · México',
      language: 'es-MX',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'female',
      rating: 5,
      description: 'Voz neuronal femenina (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-MX-JorgeNeural',
      name: 'Jorge Neural · México',
      language: 'es-MX',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'male',
      rating: 5,
      description: 'Voz neuronal masculina (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-US-PalomaNeural',
      name: 'Paloma Neural · EE. UU.',
      language: 'es-US',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'female',
      rating: 5,
      description: 'Voz neuronal femenina (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-CO-SalomeNeural',
      name: 'Salomé Neural · Colombia',
      language: 'es-CO',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'female',
      rating: 5,
      description: 'Voz neuronal colombiana (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-CO-GonzaloNeural',
      name: 'Gonzalo Neural · Colombia',
      language: 'es-CO',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'male',
      rating: 5,
      description: 'Voz neuronal colombiana (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:edge:es-AR-ElenaNeural',
      name: 'Elena Neural · Argentina',
      language: 'es-AR',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: true,
      isGoogle: false,
      isMicrosoft: true,
      gender: 'female',
      rating: 5,
      description: 'Voz neuronal femenina (muy natural)',
      engine: 'premium',
      provider: 'Edge'
    },
    {
      uri: 'premium:google:es',
      name: 'Google Español',
      language: 'es',
      localService: false,
      default: false,
      isSpanish: true,
      isNeural: false,
      isGoogle: true,
      isMicrosoft: false,
      gender: 'female',
      rating: 4,
      description: 'Voz Google online (clara y natural)',
      engine: 'premium',
      provider: 'Google'
    }
  ];

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
    this.initializeVoiceSystem();
  }

  // ============ INICIALIZACIÓN ============

  private initializeVoiceSystem(): void {
    this.loadVoices();
    this.synth.onvoiceschanged = () => {
      console.log('🎤 Voces actualizadas:', this.synth.getVoices().length);
      this.voicesLoaded = true;
      if (!this.currentSettings.voiceURI || this.currentSettings.voiceURI === '') {
        this.setDefaultVoice();
      }
    };
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  private setDefaultVoice(): void {
    const spanishVoices = this.getAllVoicesWithInfo().filter(v => v.isSpanish);
    if (spanishVoices.length > 0) {
      const sortedVoices = spanishVoices.sort((a, b) => b.rating - a.rating);
      const bestVoice = sortedVoices[0];
      this.currentSettings.voiceURI = bestVoice.uri;
      this.currentSettings.voiceName = bestVoice.name;
      this.currentSettings.language = bestVoice.language;
      this.saveVoiceSettings();
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

  // ============ SISTEMA DE VARIEDAD DE VOCES ============

  public getAllVoicesWithInfo(includeVirtual: boolean = true): VoiceInfo[] {
    const realVoices = this.getAvailableVoices();
    const realVoicesInfo = realVoices.map(voice => this.createVoiceInfo(voice));
    const premiumInfo = this.premiumVoices.map(voice => ({ ...voice }));

    if (!includeVirtual) {
      return [...premiumInfo, ...realVoicesInfo].sort(this.sortVoices);
    }

    const virtualVoices = this.createVirtualVoices(realVoicesInfo);
    return [...premiumInfo, ...virtualVoices, ...realVoicesInfo].sort(this.sortVoices);
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

  private createVirtualVoices(realVoices: VoiceInfo[]): VoiceInfo[] {
    const virtualVoices: VoiceInfo[] = [];

    realVoices.forEach(realVoice => {
      this.voicePersonalities.forEach(personality => {
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
            rating: realVoice.rating + 1,
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
    let rating = 3;
    if (name.includes('neural')) rating += 2;
    if (name.includes('google')) rating += 1;
    if (name.includes('natural')) rating += 1;
    if (name.includes('premium')) rating += 1;
    if (voice.default) rating += 1;
    if (voice.lang.startsWith('es')) rating += 2;
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

  // ============ MÉTODOS PARA PERSONALIDADES ============

  public getAllPersonalities(): VoicePersonality[] {
    return this.voicePersonalities;
  }

  public getPersonality(personalityId: string): VoicePersonality | undefined {
    return this.voicePersonalities.find(p => p.id === personalityId);
  }

  public setVoicePersonality(personalityId: string): boolean {
    const personality = this.getPersonality(personalityId);
    if (!personality) return false;

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
    this.currentSettings.rate = Math.max(0.5, Math.min(2.0, this.currentSettings.rate));
    this.currentSettings.pitch = Math.max(0.5, Math.min(2.0, this.currentSettings.pitch));
    this.currentSettings.volume = Math.max(0.1, Math.min(1.0, this.currentSettings.volume));

    if (JSON.stringify(oldSettings) !== JSON.stringify(this.currentSettings)) {
      this.saveVoiceSettings();
    }
  }

  public setVoice(voiceURI: string): boolean {
    const voices = this.getAllVoicesWithInfo();
    const selectedVoice = voices.find(v => v.uri === voiceURI);

    if (!selectedVoice) return false;

    if (selectedVoice.engine === 'premium') {
      this.updateVoiceSettings({
        voiceURI: selectedVoice.uri,
        voiceName: selectedVoice.name,
        language: selectedVoice.language
      });
      return true;
    }

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

  public resolveVoiceInfo(voiceURI: string | undefined): VoiceInfo | null {
    if (!voiceURI) return null;
    return this.getAllVoicesWithInfo().find(v => v.uri === voiceURI) || null;
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
    if (!('speechSynthesis' in window)) {
      return Promise.reject('La síntesis de voz no está disponible en tu navegador');
    }

    const settings = { ...this.currentSettings, ...options };

    // Limpiar el texto para voz
    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      return Promise.resolve();
    }

    // Detener cualquier reproducción previa (native o premium)
    this.cancelSpeech();
    // Nueva llamada: comenzar de cero
    this.speechCancelled = false;

    const voiceInfo = this.resolveVoiceInfo(settings.voiceURI);

    // Motor premium (voces neuronales online) con fallback al sistema
    if (voiceInfo && voiceInfo.engine === 'premium') {
      return this.speakWithPremium(cleanText, voiceInfo, settings).catch((error) => {
        console.warn('🎙️ Voz premium no disponible, usando voz del sistema:', error?.message || error);
        return this.speakNative(cleanText, settings);
      });
    }

    return this.speakNative(cleanText, settings);
  }

  private speakNative(text: string, settings: VoiceSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.synth.speaking) {
        this.synth.cancel();
      }

      setTimeout(() => {
        try {
          // Dividir en frases evita el corte de texto largo en Chrome
          const chunks = this.splitTextIntoChunks(text, 140);
          this.speakChunksNative(chunks, settings, resolve, reject);
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }

  private speakChunksNative(chunks: string[], settings: VoiceSettings, resolve: () => void, reject: (error: any) => void): void {
    if (chunks.length === 0) {
      resolve();
      return;
    }

    const [first, ...rest] = chunks;
    const utterance = new SpeechSynthesisUtterance(first);
    this.configureVoice(utterance, settings);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onend = () => {
      this.speakChunksNative(rest, settings, resolve, reject);
    };

    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') {
        resolve();
      } else {
        reject(new Error(`Error de voz: ${event.error}`));
      }
    };

    this.synth.speak(utterance);
  }

  // ============ MOTOR PREMIUM (VOCES NEURONALES) ============

  private async speakWithPremium(text: string, voice: VoiceInfo, settings: VoiceSettings): Promise<void> {
    const maxChars = voice.uri === 'premium:google:es' ? 150 : 300;
    const chunks = this.splitTextIntoChunks(text, maxChars);
    if (chunks.length === 0) return;

    // La reproducción por <audio> cambia el tono al modificar playbackRate;
    // se limita a un rango natural para no sonar robótica.
    const rate = Math.min(1.2, Math.max(0.8, settings.rate || 1.0));
    const volume = Math.max(0, Math.min(1, settings.volume || 1.0));

    const sequence: { url: string; rate: number; volume: number }[] = [];
    for (const chunk of chunks) {
      const url = this.buildPremiumUrl(voice.uri, chunk);
      if (url) sequence.push({ url, rate, volume });
    }

    if (sequence.length === 0) {
      throw new Error('Voz premium no válida');
    }

    await this.playAudioSequence(sequence);
  }

  private buildPremiumUrl(voiceId: string, text: string): string | null {
    const q = encodeURIComponent(text);

    if (voiceId.startsWith('premium:edge:')) {
      const edgeVoice = voiceId.replace('premium:edge:', '');
      return `https://tts.cyzon.us/tts?voice=${encodeURIComponent(edgeVoice)}&text=${q}`;
    }

    if (voiceId === 'premium:google:es') {
      return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${q}`;
    }

    return null;
  }

  private playAudioSequence(sequence: { url: string; rate: number; volume: number }[]): Promise<void> {
    return new Promise((resolve, reject) => {
      let index = 0;

      const playNext = () => {
        if (this.speechCancelled) {
          this.activeAudio = null;
          resolve();
          return;
        }

        if (index >= sequence.length) {
          this.activeAudio = null;
          resolve();
          return;
        }

        const item = sequence[index];
        index += 1;

        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = item.url;
        audio.defaultPlaybackRate = item.rate;
        audio.playbackRate = item.rate;
        audio.volume = item.volume;
        this.activeAudio = audio;

        let settled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          audio.onended = null;
          audio.onerror = null;
          audio.onstalled = null;
          if (this.speechCancelled) {
            this.activeAudio = null;
            resolve();
          } else if (error) {
            this.activeAudio = null;
            reject(error);
          } else {
            playNext();
          }
        };

        timer = setTimeout(() => finish(new Error('Tiempo de espera agotado al reproducir la voz')), 20000);

        audio.onended = () => finish();
        audio.onerror = () => finish(new Error('No se pudo reproducir la voz premium'));
        audio.onstalled = () => { /* seguir esperando datos */ };

        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => finish(new Error('No se pudo iniciar la reproducción de voz')));
        }
      };

      playNext();
    });
  }

  private splitTextIntoChunks(text: string, maxChars: number): string[] {
    const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).trim().length > maxChars) {
        if (current.trim()) chunks.push(current.trim());
        let remaining = sentence;
        while (remaining.length > maxChars) {
          chunks.push(remaining.slice(0, maxChars).trim());
          remaining = remaining.slice(maxChars);
        }
        current = remaining;
      } else {
        current += sentence;
      }
    }

    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  public cancelSpeech(): void {
    this.speechCancelled = true;
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    if (this.activeAudio) {
      const audio = this.activeAudio;
      audio.onended = null;
      audio.onerror = null;
      audio.onstalled = null;
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // ignorar
      }
      this.activeAudio = null;
    }
  }

// 🔴 AGREGAR ESTA NUEVA FUNCIÓN PARA LIMPIAR TEXTO
private cleanTextForSpeech(text: string): string {
  if (!text) return '';
  
  let cleanText = text
    // 1. Eliminar caracteres de formato Markdown
    .replace(/\*\*/g, '')      // **negrita**
    .replace(/\*/g, ' ')       // *cursiva* o • viñetas
    .replace(/_/g, ' ')        // _cursiva_
    .replace(/~/g, ' ')        // ~~tachado~~
    .replace(/#/g, ' ')        // # encabezados
    
    // 2. Eliminar emojis comunes que podrían leerse mal
    .replace(/[🎉🎊✅❌⚠️⚡💡]/g, ' ')
    .replace(/[💰💳💵💸]/g, ' dinero ')
    .replace(/[📊📈📉]/g, ' gráfico ')
    .replace(/[⚖️⚖]/g, ' equilibrio ')
    .replace(/[📝📋]/g, ' lista ')
    .replace(/[👤👥]/g, ' persona ')
    .replace(/[🏢🏪]/g, ' negocio ')
    
    // 3. Reemplazar símbolos problemáticos
    .replace(/•/g, ', ')       // viñetas por comas
    .replace(/→/g, ' a ')      // flecha por "a"
    .replace(/:/g, ': ')       // asegurar espacio después de dos puntos
    
    // 4. Limpiar múltiples espacios y saltos de línea
    .replace(/\n{2,}/g, '. ')  // múltiples saltos por puntos
    .replace(/\n/g, '. ')      // saltos simples por puntos
    .replace(/\s{2,}/g, ' ')   // múltiples espacios por uno
    .trim();
  
  // 5. Asegurar que termine con punto
  if (cleanText && !cleanText.endsWith('.') && !cleanText.endsWith('!') && !cleanText.endsWith('?')) {
    cleanText += '.';
  }
  
  return cleanText;
}

  private configureVoice(utterance: SpeechSynthesisUtterance, settings: VoiceSettings): void {
    const voices = this.getAvailableVoices();

    if (settings.voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === settings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        return;
      }
    }

    if (settings.voiceName) {
      const selectedVoice = voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        return;
      }
    }

    const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
    if (spanishVoices.length > 0) {
      const systemVoice = spanishVoices.find(v => v.localService) || spanishVoices[0];
      utterance.voice = systemVoice;
      utterance.lang = systemVoice.lang;
      return;
    }

    utterance.lang = settings.language;
  }

  public previewVoice(voiceInfo: VoiceInfo): Promise<void> {
    const previewText = "Hola, soy tu asistente de voz. Esta es una muestra de cómo sueno. ¿Te gusta mi voz?";

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

    return this.speak(previewText, {
      voiceURI: voiceInfo.uri,
      voiceName: voiceInfo.name,
      rate: 1.1,
      pitch: 1.0
    });
  }

  // ============ RECONOCIMIENTO DE VOZ ============

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log('🎤 Intentando iniciar reconocimiento de voz...');
      console.log('🎤 ¿Es soportado?:', this.isSupported);
      
      if (!this.isSupported) {
        console.error('❌ Voz no soportada en este navegador');
        reject('El reconocimiento de voz no está disponible en tu navegador');
        return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('❌ SpeechRecognition no encontrado');
        reject('El reconocimiento de voz no está disponible en tu navegador');
        return;
      }
      
      this.recognition = new SpeechRecognition();

      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        console.log('🎤 Resultado recibido:', event);
        let transcript = event.results[0][0].transcript;
        console.log('🎤 Transcripción original:', transcript);
        transcript = this.correctTranscript(transcript);
        console.log('🎤 Transcripción corregida:', transcript);
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Error de reconocimiento:', event.error);
        reject(event.error);
      };

      this.recognition.onstart = () => {
        console.log('🎤 Reconocimiento iniciado');
      };

      this.recognition.onend = () => {
        console.log('🎤 Reconocimiento terminado');
      };

      try {
        this.recognition.start();
        console.log('🎤 Reconocimiento started');
      } catch (error) {
        console.error('❌ Error al iniciar reconocimiento:', error);
        reject(error);
      }
    });
  }

  private correctTranscript(transcript: string): string {
    const corrections: { [key: string]: string } = {
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
      'camilo': 'camilo',
      'daniel': 'daniel',
      'miguel': 'miguel',
      'maría': 'maría',
      'juan': 'juan',
      'carlos': 'carlos',
      'ana': 'ana',
      'luis': 'luis',
      'pedro': 'pedro',
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

    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }

    corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();
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

    const voiceCommand = this.processVoiceCommands(text);
    if (voiceCommand) {
      return voiceCommand;
    }

    try {
      const parsed = nlpService.parseCommand(text);
      console.log('🔍 Comando parseado:', parsed);
      console.log('🔍 Intent:', parsed.intent, 'Person:', parsed.entities.person, 'Amount:', parsed.entities.amount);

      if ((parsed.intent === 'add_debt' || parsed.intent === 'add_payment') && parsed.entities.person && parsed.entities.amount) {
        console.log('🔍 Verificando confirmación para:', parsed.entities.person, 'monto:', parsed.entities.amount);

        // Para pagos, verificar también si el cliente tiene deudas pendientes
        const isPayment = parsed.intent === 'add_payment';
        
        // CAMBIADO: Ahora es async/await
        const clientExists = await this.checkClientExists(parsed.entities.person, isPayment);
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

      let data: any = null;
      let success = false;

      switch (parsed.intent) {
        case 'add_debt':
          success = await this.handleAddDebt(parsed);
          if (success) {
            data = await storageService.getSummary();
          }
          break;

        case 'add_payment':
          success = await this.handleAddPayment(parsed);
          if (success && parsed.entities.person) {
            data = await storageService.getClientSummary(parsed.entities.person);
          }
          break;

        case 'query_debt':
          data = await this.handleQueryDebt(parsed);
          success = true;
          break;

case 'show_summary':
  try {
    // Obtener datos directamente de las deudas
    const allDebts = await storageService.getDebts();
    
    console.log('🔍 DEBUG: Total deudas obtenidas:', allDebts.length);
    
    // Mostrar todas las deudas para debug
    allDebts.forEach((debt, i) => {
      console.log(`${i+1}. ${debt.person} - Tipo: ${debt.type}, Estado: ${debt.status}, Monto: ${debt.amount}, Pagado: ${debt.paidAmount || 0}`);
    });
    
    // Separar deudas que tú debes (owing) y que te deben (owed)
    const owing = allDebts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .map(d => ({
        person: d.person,
        amount: Math.max(0, d.amount - (d.paidAmount || 0)),
        description: d.description || '',
        date: d.date
      }));
    
    const owed = allDebts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .map(d => ({
        person: d.person,
        amount: Math.max(0, d.amount - (d.paidAmount || 0)),
        description: d.description || '',
        date: d.date
      }));
    
    console.log('🔍 DEBUG: Owing (tú debes):', owing.length, 'deudas');
    console.log('🔍 DEBUG: Owed (te deben):', owed.length, 'deudas');
    
    const totalOwing = owing.reduce((sum, d) => sum + d.amount, 0);
    const totalOwed = owed.reduce((sum, d) => sum + d.amount, 0);
    const net = totalOwed - totalOwing;
    
    // Obtener resúmenes adicionales
    const [personal, business] = await Promise.all([
      storageService.getSummary(),
      storageService.getBusinessSummary()
    ]);
    
    // Estructura que espera generateResponse
    data = {
      owing,
      owed,
      totalOwing,
      totalOwed,
      net,
      owingCount: owing.length,
      owedCount: owed.length,
      totalCount: owing.length + owed.length,
      // También incluir los datos originales por compatibilidad
      personal: personal,
      business: business
    };
    
    console.log('📊 Datos preparados para show_summary:', {
      totalOwing: formatCurrency(totalOwing),
      totalOwed: formatCurrency(totalOwed),
      net: formatCurrency(net),
      owingCount: owing.length,
      owedCount: owed.length,
      owingFirst: owing[0]?.person || 'ninguno',
      owedFirst: owed[0]?.person || 'ninguno'
    });
    
    success = true;
    
  } catch (error) {
    console.error('❌ Error obteniendo resumen:', error);
    throw new Error('No pude obtener el resumen de deudas');
  }
  break; 


        case 'query_payment_history':
          data = await this.handlePaymentHistoryQuery(parsed);
          success = true;
          break;

        case 'query_last_payment':
          data = await this.handleLastPaymentQuery(parsed);
          success = true;
          break;

        case 'query_overdue_debts':
          data = await this.handleOverdueDebtsQuery(parsed);
          success = true;
          break;

        case 'create_client':
          success = await this.handleCreateClient(parsed);
          break;

        case 'delete_client':
          success = await this.handleDeleteClient(parsed);
          break;



        default:
          return await this.fallbackToBasicSystem(text); // CAMBIADO: Ahora es async
      }

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

  private async checkClientExists(name: string, checkDebts: boolean = false): Promise<boolean> {
    try {
      return await storageService.checkClientExists(name, checkDebts);
    } catch (error) {
      console.error('Error checking client exists:', error);
      return false;
    }
  }

  private async getClientByName(name: string, checkDebts: boolean = false): Promise<any> {
    try {
      return await storageService.getClientByName(name, checkDebts);
    } catch (error) {
      console.error('Error getting client by name:', error);
      return null;
    }
  }

  private async handleAddDebt(parsed: ParsedCommand): Promise<boolean> {
    const { person, amount, description } = parsed.entities;

    if (!person || !amount) {
      throw new Error('Falta información: persona o monto');
    }

    const rawText = parsed.rawText.toLowerCase();
    console.log('🔍 handleAddDebt - Persona:', person, 'Monto:', amount, 'Descripción:', description);
    console.log('🔍 handleAddDebt - Raw text:', rawText);

    // Detectar si es "yo le debo" (deuda que yo tengo)
    const isOwing = rawText.includes('yo debo') ||
      rawText.includes('le debo') ||
      rawText.includes('debo a');
    
    const debtAmount = isOwing ? -Math.abs(amount) : Math.abs(amount);

    try {
      // Buscar o crear cliente
      console.log('🔍 handleAddDebt - Buscando cliente:', person);
      let client = await this.getClientByName(person);
      console.log('🔍 handleAddDebt - Cliente encontrado:', client);
      
      if (!client) {
        console.log('🔍 handleAddDebt - Creando nuevo cliente:', this.capitalizeName(person));
        // Crear cliente
        client = await api.createClient(this.capitalizeName(person));
        console.log('🔍 handleAddDebt - Cliente creado:', client);
      }

      // Crear deuda (negativa si es "yo le debo")
      console.log('🔍 handleAddDebt - Creando deuda para cliente ID:', client.id, 'Monto:', debtAmount, 'Tipo:', isOwing ? 'owing' : 'owed');
      await api.createDebt(
        client.id,
        debtAmount,
        description || (isOwing ? 'Deuda que debo' : 'Deuda registrada por voz')
      );
      console.log('🔍 handleAddDebt - Deuda creada exitosamente');

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

    try {
      // OPTIMIZADO: No buscar cliente de nuevo, usar los datos ya obtenidos
      // Buscar cliente en las deudas ya cargadas
      const debts = await api.getDebts();
      console.log('🔍 handleAddPayment - deudas:', JSON.stringify(debts, null, 2));
      
      // Buscar cliente por nombre en las deudas
      const normalizedPerson = person.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
// Buscar deudas de este cliente
      const clientDebts = debts.filter((d: any) => {
        const debtClientName = (d.clientName || '').toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return debtClientName.includes(normalizedPerson) && !d.isPaid;
      });
      
      console.log('🔍 handleAddPayment - deudas del cliente:', clientDebts);

      if (clientDebts.length === 0) {
        throw new Error(`${person} no tiene deudas pendientes`);
      }

      // Pagar la primera deuda pendiente (o la más antigua)
      const debt = clientDebts[0];
      console.log('🔍 handleAddPayment - pagando deuda:', debt.id, 'monto:', amount);
      await api.payDebt(debt.id, amount, 'Pago registrado por voz');
      console.log('✅ Pago registrado exitosamente');

      return true;
    } catch (error: any) {
      console.error('Error agregando pago:', error);
      throw error;
    }
  }

  private async handleQueryDebt(parsed: ParsedCommand): Promise<any> {
  const { person } = parsed.entities;
  const rawText = parsed.rawText.toLowerCase();

  console.log('🔍 handleQueryDebt - Texto:', rawText);
  console.log('🔍 handleQueryDebt - Persona:', person);

  // Verificar si es consulta de tiempo (desde cuándo, hace cuánto)
  const isTimeQuery = rawText.includes('desde cuándo') || 
                     rawText.includes('desde cuando') ||
                     rawText.includes('hace cuánto') ||
                     rawText.includes('hace cuanto');

  console.log('🔍 handleQueryDebt - ¿Es consulta de tiempo?:', isTimeQuery);

  if (!person && (rawText.includes('les debo') || rawText.includes('debo a'))) {
    const debts = await storageService.getDebts();
    const owingDebts = debts.filter(d => d.type === 'owing' && d.status === 'pending');

    return owingDebts.map(d => ({
      person: d.person,
      amount: d.amount - (d.paidAmount || 0),
      description: d.description,
      date: d.date, // Agregar fecha
      formattedDate: new Date(d.date).toLocaleDateString('es-ES')
    }));
  }

  if (!person) {
    throw new Error('¿De quién quieres consultar la deuda?');
  }

  const clients = await storageService.getClients();
  const client = clients.find(c =>
    c.name.toLowerCase().includes(person.toLowerCase())
  );

  if (!client) {
    throw new Error(`${person} no está registrado como cliente`);
  }

  const debts = await storageService.getDebts();
  const clientDebts = debts.filter(d =>
    d.type === 'owed' &&
    d.person.toLowerCase() === client.name.toLowerCase()
  );

  if (clientDebts.length === 0) {
    return {
      amount: 0,
      message: 'No hay deudas registradas',
      clientName: client.name,
      hasTimeQuery: isTimeQuery,
      oldestDebtDate: null,
      timeMessage: `${person} no tiene deudas registradas.`
    };
  }

  const pendingDebts = clientDebts.filter(d => d.status !== 'paid');
  const totalPending = pendingDebts.reduce((sum, d) =>
    sum + (d.amount - (d.paidAmount || 0)), 0
  );

  // Encontrar la deuda más antigua para consultas de tiempo
  let oldestDebt = null;
  let oldestDate = null;
  let formattedOldestDate = null;
  let daysSinceOldestDebt = null;
  
  if (pendingDebts.length > 0) {
    // Ordenar por fecha (más antigua primero)
    const sortedByDate = [...pendingDebts].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
    
    oldestDebt = sortedByDate[0];
    oldestDate = oldestDebt.date;
    formattedOldestDate = new Date(oldestDate).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Calcular días desde la deuda más antigua
    const today = new Date();
    const debtDate = new Date(oldestDate);
    const diffTime = Math.abs(today.getTime() - debtDate.getTime());
    daysSinceOldestDebt = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    clientName: client.name,
    amount: totalPending,
    pendingCount: pendingDebts.length,
    totalCount: clientDebts.length,
    // Información para consultas de tiempo
    hasTimeQuery: isTimeQuery,
    oldestDebtDate: oldestDate,
    formattedOldestDate: formattedOldestDate,
    daysSinceOldestDebt: daysSinceOldestDebt,
    oldestDebtDescription: oldestDebt?.description || 'Sin descripción',
    // Para mostrar todas las deudas con fechas
    allDebts: pendingDebts.map(debt => ({
      amount: debt.amount - (debt.paidAmount || 0),
      date: debt.date,
      formattedDate: new Date(debt.date).toLocaleDateString('es-ES'),
      description: debt.description || 'Sin descripción',
      daysSince: Math.ceil((new Date().getTime() - new Date(debt.date).getTime()) / (1000 * 60 * 60 * 24))
    }))
  };
}

  private async handleCreateClient(parsed: ParsedCommand): Promise<boolean> {
    const { person } = parsed.entities;

    if (!person) {
      throw new Error('¿Qué nombre tiene el nuevo cliente?');
    }

    try {
      // CAMBIADO: Ahora es async/await
      await storageService.findOrCreateClient(this.capitalizeName(person));
      return true;
    } catch (error: any) {
      console.error('Error creando cliente:', error);
      throw error;
    }
  }

  private async handleDeleteClient(parsed: ParsedCommand): Promise<boolean> {
    const { person } = parsed.entities;

    if (!person) {
      throw new Error('¿Qué cliente quieres eliminar?');
    }

    try {
      const client = await storageService.getClientByName(person);
      
      if (!client) {
        throw new Error(`${person} no está registrado como cliente`);
      }

      await api.deleteClient(client.id);
      console.log('✅ Cliente eliminado:', person);
      
      // Guardar el nombre para el mensaje de respuesta
      this._lastDeletedClient = person;
      return true;
    } catch (error: any) {
      console.error('Error eliminando cliente:', error);
      throw error;
    }
  }
  
  private _lastDeletedClient: string = '';

  // ============ MANEJO DE CONFIRMACIONES (CORREGIDO CON ASYNC/AWAIT) ============

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
          // CAMBIADO: Ahora es async/await
          await storageService.findOrCreateClient(this.capitalizeName(person));

          const debtRawText = confirmationData.rawText || '';
          const normalizedText = debtRawText.toLowerCase();
          const shouldBeOwing = normalizedText.includes('yo debo') ||
            normalizedText.includes('le debo') ||
            normalizedText.includes('debo a');

          try {
            // Si es "yo le debo", guardamos el monto como negativo
            const debtAmount = shouldBeOwing ? -Math.abs(amount) : Math.abs(amount);
            
            await storageService.addDebt({
              type: shouldBeOwing ? 'owing' : 'owed',
              person: this.capitalizeName(person),
              amount: debtAmount,
              description: description || (shouldBeOwing ? 'Deuda que debo' : 'Deuda registrada por voz'),
              date: new Date(),
              status: 'pending',
              paidAmount: 0,
            });
            console.log('✅ Deuda creada con tipo:', shouldBeOwing ? 'owing (YO DEBO)' : 'owed (ME DEBEN)', 'monto:', debtAmount);
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

          // CAMBIADO: Ahora es async/await
          const clientSummary = await storageService.getClientSummary(person);

          return {
            success: true,
            response: responseMessage,
            data: clientSummary,
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

  // ============ SISTEMA DE FALLBACK BÁSICO (CORREGIDO CON ASYNC/AWAIT) ============

  private async fallbackToBasicSystem(text: string): Promise<VoiceResponse> {
    console.log('🔄 Usando sistema básico de regex');

    const patterns = [
      {
        pattern: /(.+?)\s+(?:me debe|debe|qued[oó] debiendo)\s+(\d+)\s+pesos?(?:\s+por\s+(.+))?/i,
        handler: async (match: RegExpMatchArray) => {
          const [, person, amount, description] = match;
          return `Registrado: ${person} debe ${amount} pesos${description ? ` por ${description}` : ''}`;
        }
      },
      {
        pattern: /(.+?)\s+(?:pag[oó]|abon[oó])\s+(\d+)\s+pesos/i,
        handler: async (match: RegExpMatchArray) => {
          const [, person, amount] = match;
          return `Pago registrado: ${person} pagó ${amount} pesos`;
        }
      },
      {
        pattern: /cu[aá]nto debe (.+)/i,
        handler: async (match: RegExpMatchArray) => {
          const [, person] = match;
          return `Consulta: ${person} - función en desarrollo`;
        }
      },
      {
        pattern: /resumen de deudas/i,
        handler: async () => {
          // CAMBIADO: Ahora es async/await
          const summary = await storageService.getSummary();
          return `Resumen: Te deben ${summary.totalOwed} pesos. Tú debes ${summary.totalOwing} pesos.`;
        }
      }
    ];

    for (const { pattern, handler } of patterns) {
      const match = text.match(pattern);
      if (match) {
        const response = await handler(match);
        return {
          success: true,
          response,
        };
      }
    }

    return {
      success: false,
      response: 'No entendí el comando. Intenta con: "José debe 2000 pesos por materiales"',
    };
  }

  // ============ MANEJADORES PARA CONSULTAS DE PAGOS ============

// ============ MANEJADORES PARA CONSULTAS DE PAGOS (MEJORADOS) ============

private async handlePaymentHistoryQuery(parsed: ParsedCommand): Promise<any> {
  const { person } = parsed.entities;
  
  if (!person) {
    throw new Error('¿De quién quieres consultar el historial de pagos?');
  }

  try {
    // Obtener historial completo
    const paymentHistory = await storageService.getPaymentHistory(person);
    
    if (!paymentHistory || paymentHistory.length === 0) {
      return {
        person,
        message: `${person} no tiene pagos registrados`,
        totalPayments: 0,
        totalAmount: 0,
        hasPayments: false,
        payments: []
      };
    }

    // Formatear fechas para mostrar
    const formattedPayments = paymentHistory.map(payment => {
      const date = payment.date instanceof Date ? payment.date : new Date(payment.date);
      return {
        ...payment,
        formattedDate: date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        shortDate: date.toLocaleDateString('es-ES'),
        amount: payment.amount || 0
      };
    });

    // Calcular totales
    const totalAmount = formattedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    return {
      person,
      totalPayments: paymentHistory.length,
      totalAmount,
      lastPayment: formattedPayments[0],
      averagePayment: totalAmount / paymentHistory.length,
      recentPayments: formattedPayments.slice(0, 5),
      allPayments: formattedPayments,
      daysSinceLastPayment: await storageService.getDaysSinceLastPayment(person),
      hasPayments: true,
      // Agregar mensaje específico para cada pago
      paymentDetails: formattedPayments.map(p => 
        `${p.formattedDate}: ${formatCurrency(p.amount)}${p.description ? ` - ${p.description}` : ''}`
      )
    };
  } catch (error) {
    console.error('Error en handlePaymentHistoryQuery:', error);
    throw new Error(`Error al obtener el historial de pagos de ${person}`);
  }
}

private async handleLastPaymentQuery(parsed: ParsedCommand): Promise<any> {
  const { person } = parsed.entities;
  
  if (!person) {
    throw new Error('¿De quién quieres saber el último pago?');
  }

  try {
    const lastPayment = await storageService.getLastPayment(person);
    
    if (!lastPayment) {
      return {
        person,
        message: `${person} no tiene pagos registrados`,
        hasPayments: false,
        formattedLastPayment: null
      };
    }

    // Formatear la fecha de manera más descriptiva
    const lastDate = lastPayment.date instanceof Date ? lastPayment.date : new Date(lastPayment.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeDescription = '';
    if (diffDays === 0) timeDescription = 'hoy mismo';
    else if (diffDays === 1) timeDescription = 'ayer';
    else if (diffDays < 7) timeDescription = `hace ${diffDays} días`;
    else if (diffDays < 30) timeDescription = `hace ${Math.floor(diffDays / 7)} semanas`;
    else if (diffDays < 365) timeDescription = `hace ${Math.floor(diffDays / 30)} meses`;
    else timeDescription = `hace ${Math.floor(diffDays / 365)} años`;
    
    const formattedDate = lastDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      person,
      lastPayment: {
        amount: lastPayment.amount || 0,
        date: lastDate,
        formattedDate,
        description: lastPayment.note || lastPayment.debtDescription || 'Sin descripción',
        daysAgo: diffDays,
        timeDescription
      },
      hasPayments: true
    };
  } catch (error) {
    console.error('Error en handleLastPaymentQuery:', error);
    throw new Error(`Error al obtener el último pago de ${person}`);
  }
}

private async handleOverdueDebtsQuery(parsed: ParsedCommand): Promise<any> {
  try {
    const overdueDebts = await storageService.getOverdueDebts(30);
    
    if (!overdueDebts || overdueDebts.length === 0) {
      return {
        message: 'No hay deudas vencidas (más de 30 días sin pago)',
        count: 0,
        totalAmount: 0,
        debts: [],
        formattedDebts: []
      };
    }

    const formattedDebts = overdueDebts.map(debt => {
      const debtDate = debt.date instanceof Date ? debt.date : new Date(debt.date);
      const formattedDate = debtDate.toLocaleDateString('es-ES');
      
      return {
        person: debt.person,
        amount: debt.amount - (debt.paidAmount || 0),
        daysOverdue: debt.daysOverdue || 0,
        lastUpdate: debt.updatedAt ? new Date(debt.updatedAt).toLocaleDateString('es-ES') : formattedDate,
        formattedDate,
        description: debt.description || 'Sin descripción'
      };
    });

    const totalOverdue = formattedDebts.reduce((sum, debt) => sum + debt.amount, 0);

    return {
      message: `Hay ${overdueDebts.length} deuda${overdueDebts.length > 1 ? 's' : ''} vencida${overdueDebts.length > 1 ? 's' : ''}`,
      count: overdueDebts.length,
      totalAmount: totalOverdue,
      debts: overdueDebts,
      formattedDebts,
      // Agregar detalles para cada deuda
      debtDetails: formattedDebts.map(d => 
        `${d.person}: ${formatCurrency(d.amount)} desde ${d.formattedDate} (${d.daysOverdue} días de retraso)${d.description ? ` - ${d.description}` : ''}`
      )
    };
  } catch (error) {
    console.error('Error en handleOverdueDebtsQuery:', error);
    throw new Error('Error al obtener las deudas vencidas');
  }
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

  async getStats() {
    // CAMBIADO: Ahora es async/await
    const [debts, clients] = await Promise.all([
      storageService.getDebts(),
      storageService.getClients()
    ]);

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
      debtsCount: debts.length,
      clientsCount: clients.length,
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

  public getRealVoices(): VoiceInfo[] {
    return this.getAllVoicesWithInfo(false);
  }

  public getVirtualVoices(): VoiceInfo[] {
    return this.getAllVoicesWithInfo().filter(v => v.isVirtual);
  }

  public countVoicesByType() {
    const voices = this.getAllVoicesWithInfo();
    return {
      total: voices.length,
      real: voices.filter(v => !v.isVirtual).length,
      virtual: voices.filter(v => v.isVirtual).length,
      premium: voices.filter(v => v.engine === 'premium').length,
      spanish: voices.filter(v => v.isSpanish).length,
      male: voices.filter(v => v.gender === 'male').length,
      female: voices.filter(v => v.gender === 'female').length
    };
  }

  
}

export const enhancedVoiceService = new EnhancedVoiceService();