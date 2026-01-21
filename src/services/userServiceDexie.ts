import { db } from './databaseService';
import CryptoJS from 'crypto-js';

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  password: string; // hashed
  voiceData?: string;
  voicePreference?: string;
  createdAt: Date;
  lastLogin?: Date;
}

// Interfaz para Dexie
interface DexieUser extends Omit<User, 'id'> {
  id: string;
}

export const userService = {
  // ============ MÉTODOS BÁSICOS ============
  
  async getUsers(): Promise<User[]> {
    try {
      const dexieUsers = await db.users.toArray();
      return dexieUsers.map(user => ({
        ...user,
        createdAt: user.createdAt || new Date(),
        lastLogin: user.lastLogin
      }));
    } catch (error) {
      console.error('Error al leer usuarios:', error);
      return [];
    }
  },

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error al leer usuario actual:', error);
      return null;
    }
  },

  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },

  getCurrentUserId(): string {
    const user = this.getCurrentUser();
    return user?.id || 'default-user';
  },

  // ============ REGISTRO Y LOGIN ============
  
  async registerUser(userData: Omit<User, 'id' | 'password' | 'createdAt' | 'lastLogin'> & { password: string }): Promise<User> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await db.users.where('email').equals(userData.email).first();
      if (existingUser) {
        throw new Error('El correo electrónico ya está registrado');
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        ...userData,
        password: this.hashPassword(userData.password),
        createdAt: new Date(),
      };

      // Guardar en Dexie
      const dexieUser: DexieUser = {
        ...newUser,
        id: newUser.id
      };
      await db.users.add(dexieUser);

      // Guardar en localStorage para sesión
      this.setCurrentUser(newUser);

      return newUser;
    } catch (error) {
      console.error('Error registrando usuario:', error);
      throw error;
    }
  },

  async loginUser(email: string, password: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      const hashedPassword = this.hashPassword(password);
      const user = users.find(u => u.email === email && u.password === hashedPassword);

      if (user) {
        // Actualizar último login
        await db.users.update(user.id, { lastLogin: new Date() });
        
        // Guardar en localStorage para sesión
        this.setCurrentUser(user);
      }

      return user || null;
    } catch (error) {
      console.error('Error en login:', error);
      return null;
    }
  },

  async loginByVoice(voiceData: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
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
        // Actualizar último login
        await db.users.update(bestMatch.id, { lastLogin: new Date() });
        
        // Guardar en localStorage para sesión
        this.setCurrentUser(bestMatch);
      }

      return bestMatch;
    } catch (error) {
      console.error('Error en login por voz:', error);
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('currentUser');
  },

  // ============ ACTUALIZACIÓN DE USUARIO ============
  
  async updateUser(updates: Partial<User>): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      try {
        await db.users.update(currentUser.id, {
          ...updates,
          ...(updates.password ? { password: this.hashPassword(updates.password) } : {})
        });
        
        // Actualizar en localStorage también
        const updatedUser = { ...currentUser, ...updates };
        this.setCurrentUser(updatedUser);
      } catch (error) {
        console.error('Error actualizando usuario:', error);
      }
    }
  },

  // ============ MIGRACIÓN DESDE LOCALSTORAGE ============
  
  async migrateFromLocalStorage(): Promise<{ usersMigrated: number }> {
    try {
      const oldUsers = localStorage.getItem('wallet-voice-users');
      if (!oldUsers) {
        return { usersMigrated: 0 };
      }

      const users = JSON.parse(oldUsers);
      let migratedCount = 0;

      for (const oldUser of users) {
        try {
          // Verificar si ya existe
          const existing = await db.users.where('email').equals(oldUser.email).first();
          if (!existing) {
            const newUser: DexieUser = {
              ...oldUser,
              createdAt: oldUser.createdAt || new Date(),
              lastLogin: oldUser.lastLogin
            };
            await db.users.add(newUser);
            migratedCount++;
          }
        } catch (error) {
          console.error('Error migrando usuario:', oldUser.email, error);
        }
      }

      // Limpiar localStorage antiguo después de migrar
      if (migratedCount > 0) {
        localStorage.removeItem('wallet-voice-users');
      }

      console.log(`✅ Migrados ${migratedCount} usuarios a Dexie`);
      return { usersMigrated: migratedCount };
    } catch (error) {
      console.error('Error en migración de usuarios:', error);
      return { usersMigrated: 0 };
    }
  },

  // ============ UTILIDADES ============
  
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  },

  normalizeVoiceData(voiceData: string): string {
    return voiceData
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\s]/g, '');
  },

  calculateVoiceMatchScore(input: string, stored: string): number {
    if (input === stored) return 1;

    const inputWords = input.split(' ');
    const storedWords = stored.split(' ');

    const matchedWords = storedWords.filter(word =>
      inputWords.some(inputWord => inputWord.includes(word) || word.includes(inputWord))
    );

    return matchedWords.length / storedWords.length;
  },

  // Verificar si hay usuario logueado
  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  },

  // Obtener nombre para mostrar
  getDisplayName(): string {
    const user = this.getCurrentUser();
    if (!user) return 'Invitado';
    
    if (user.name && user.lastName) {
      return `${user.name} ${user.lastName}`;
    } else if (user.name) {
      return user.name;
    } else {
      return user.email.split('@')[0];
    }
  }
};