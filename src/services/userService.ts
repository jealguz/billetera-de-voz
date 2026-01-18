import CryptoJS from 'crypto-js';

interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  password: string; // hashed
  voiceData?: string;
  voicePreference?: string;
}

const USERS_KEY = 'wallet-voice-users';
const CURRENT_USER_KEY = 'wallet-voice-current-user';

export const userService = {
  getUsers(): User[] {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error al leer usuarios:', error);
      return [];
    }
  },

  saveUsers(users: User[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error al guardar usuarios:', error);
    }
  },

  getCurrentUser(): User | null {
    try {
      const userId = localStorage.getItem(CURRENT_USER_KEY);
      if (!userId) return null;
      const users = this.getUsers();
      return users.find(u => u.id === userId) || null;
    } catch (error) {
      console.error('Error al leer usuario actual:', error);
      return null;
    }
  },

  setCurrentUser(userId: string): void {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  },

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  },

  registerUser(userData: Omit<User, 'id' | 'password'> & { password: string }): User {
    const users = this.getUsers();

    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      ...userData,
      password: this.hashPassword(userData.password),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(newUser.id);

    return newUser;
  },

  loginUser(email: string, password: string): User | null {
    const users = this.getUsers();
    const hashedPassword = this.hashPassword(password);
    const user = users.find(u => u.email === email && u.password === hashedPassword);

    if (user) {
      this.setCurrentUser(user.id);
    }

    return user || null;
  },

  loginByVoice(voiceData: string): User | null {
    const users = this.getUsers();
    const normalizedVoice = this.normalizeVoiceData(voiceData);
    console.log('🔍 Buscando usuario por voz:', normalizedVoice);

    let bestMatch: User | null = null;
    let bestScore = 0;

    for (const user of users) {
      if (!user.voiceData) continue;

      const storedVoice = this.normalizeVoiceData(user.voiceData);
      console.log('Comparando con:', storedVoice);

      // Exact match gets highest score
      if (storedVoice === normalizedVoice) {
        bestMatch = user;
        bestScore = 1;
        break; // Exact match, no need to check others
      }

      // Partial match scoring
      const score = this.calculateVoiceMatchScore(normalizedVoice, storedVoice);
      if (score > bestScore && score > 0.7) { // Threshold for acceptable match
        bestMatch = user;
        bestScore = score;
      }
    }

    console.log('✅ Usuario encontrado:', bestMatch?.name, 'con score:', bestScore);

    if (bestMatch) {
      this.setCurrentUser(bestMatch.id);
    }

    return bestMatch;
  },

  normalizeVoiceData(voiceData: string): string {
    return voiceData
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z\s]/g, ''); // Remove non-letter characters
  },

  calculateVoiceMatchScore(input: string, stored: string): number {
    if (input === stored) return 1;

    const inputWords = input.split(' ');
    const storedWords = stored.split(' ');

    // Check if all words from stored are present in input (allowing extra words)
    const matchedWords = storedWords.filter(word =>
      inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
    );

    return matchedWords.length / storedWords.length;
  },

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUser(updates: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const users = this.getUsers();
      const updatedUsers = users.map(u =>
        u.id === currentUser.id ? { ...u, ...updates } : u
      );
      this.saveUsers(updatedUsers);
    }
  },

  migrateVoiceData(): void {
    // Actualizar voiceData de usuarios existentes con correcciones
    const users = this.getUsers();
    const updatedUsers = users.map(user => {
      if (user.voiceData) {
        // Aplicar correcciones similares al transcript
        let corrected = user.voiceData.toLowerCase().trim();
        const corrections: { [key: string]: string } = {
          'jason': 'yeison',
          'jeison': 'yeison',
          'guzman': 'guzmán',
          'gusman': 'guzmán',
        };
        for (const [wrong, correct] of Object.entries(corrections)) {
          corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
        }
        // Normalizar espacios
        corrected = corrected.replace(/\s+/g, ' ');
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1).toLowerCase();
        return { ...user, voiceData: corrected };
      }
      return user;
    });
    this.saveUsers(updatedUsers);
  },
};