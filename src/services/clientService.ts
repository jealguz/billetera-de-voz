import { Client, ClientSummary, Debt } from '../types';

const CLIENTS_KEY = 'wallet-voice-business-clients';
const BUSINESS_DEBTS_KEY = 'wallet-voice-business-debts';

// ✅ NUEVO: Diccionario de palabras descriptivas comunes
const DESCRIPTOR_WORDS = {
  business: [
    'supermercado', 'tienda', 'almacén', 'negocio', 'comercio', 'restaurante',
    'cafetería', 'papelería', 'farmacia', 'licorera', 'panadería', 'carnicería',
    'ferretería', 'zapatería', 'ropa', 'mercado', 'minimercado', 'droguería'
  ],
  relationship: [
    'vecino', 'vecina', 'amigo', 'amiga', 'primo', 'prima', 'hermano', 'hermana',
    'tío', 'tía', 'sobrino', 'sobrina', 'compañero', 'compañera', 'colega'
  ],
  occupation: [
    'panadero', 'panadera', 'carpintero', 'carpintera', 'doctor', 'doctora',
    'médico', 'enfermero', 'enfermera', 'profesor', 'profesora', 'maestro', 'maestra'
  ],
  location: [
    'esquina', 'barrio', 'calle', 'carrera', 'avenida', 'centro', 'mercado'
  ]
};

export const clientService = {
  // ===== NUEVO: NORMALIZACIÓN DE NOMBRES =====
  
  normalizeNameForSearch(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Eliminar acentos
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  },

  // Detectar si un nombre tiene descriptor informal
  parseNameComponents(fullName: string): { 
    baseName: string; 
    descriptor?: string;
    type?: 'business' | 'relationship' | 'occupation' | 'location' | 'formal';
  } {
    const lowerName = fullName.toLowerCase();
    const words = lowerName.split(' ').filter(w => w.length > 0);
    
    // Si solo tiene una palabra, asumir que es nombre formal
    if (words.length === 1) {
      return { baseName: this.capitalizeName(words[0]), type: 'formal' };
    }
    
    // Verificar si la última palabra es un descriptor
    const lastWord = words[words.length - 1];
    const firstName = words[0];
    
    // Buscar en diccionarios
    for (const [type, wordList] of Object.entries(DESCRIPTOR_WORDS)) {
      if (wordList.includes(lastWord)) {
        // Es un nombre informal con descriptor
        return {
          baseName: this.capitalizeName(firstName),
          descriptor: lastWord,
          type: type as any
        };
      }
    }
    
    // Si no es descriptor, asumir que es apellido (nombre formal)
    return { 
      baseName: this.capitalizeName(fullName), 
      type: 'formal' 
    };
  },

  // Crear identificador único para el cliente
  createClientIdentifier(fullName: string): string {
    const parsed = this.parseNameComponents(fullName);
    
    if (parsed.descriptor) {
      // Para nombres informales: "jose_supermercado"
      return `${this.normalizeNameForSearch(parsed.baseName)}_${parsed.descriptor}`;
    } else {
      // Para nombres formales: "jose_castro"
      return this.normalizeNameForSearch(fullName).replace(/\s+/g, '_');
    }
  },

  // Comparar nombres para ver si son el mismo cliente
  areNamesSimilar(name1: string, name2: string): boolean {
    const parsed1 = this.parseNameComponents(name1);
    const parsed2 = this.parseNameComponents(name2);
    
    // Si ambos tienen el mismo nombre base pero diferentes descriptores
    // Ej: "Jose" vs "Jose supermercado"
    const norm1 = this.normalizeNameForSearch(parsed1.baseName);
    const norm2 = this.normalizeNameForSearch(parsed2.baseName);
    
    // Si tienen diferente nombre base, son personas diferentes
    if (norm1 !== norm2) return false;
    
    // Si tienen el mismo nombre base pero ambos son formales
    // Ej: "Jose Castro" vs "Jose Pérez" - DIFERENTES (diferentes apellidos)
    if (parsed1.type === 'formal' && parsed2.type === 'formal') {
      // Para nombres formales, necesitan ser idénticos
      return this.normalizeNameForSearch(name1) === this.normalizeNameForSearch(name2);
    }
    
    // Si uno es formal y otro informal con descriptor
    // Ej: "Jose Castro" vs "Jose supermercado" - DIFERENTES
    if ((parsed1.type === 'formal' && parsed2.descriptor) || 
        (parsed2.type === 'formal' && parsed1.descriptor)) {
      return false; // Son personas diferentes
    }
    
    // Si ambos son informales pero con diferente descriptor
    // Ej: "Jose supermercado" vs "Jose vecino" - DIFERENTES
    if (parsed1.descriptor && parsed2.descriptor && parsed1.descriptor !== parsed2.descriptor) {
      return false; // Son personas diferentes
    }
    
    // Si llegamos aquí, son la misma persona
    return true;
  },

  capitalizeName(name: string): string {
    if (!name) return name;
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  },

  // ===== CLIENTES (MODIFICADO) =====
  getClients(): Client[] {
    try {
      const clients = localStorage.getItem(CLIENTS_KEY);
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('Error al leer clientes:', error);
      return [];
    }
  },

  saveClients(clients: Client[]): void {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  // ✅ MEJORADO: Encontrar o crear cliente con manejo de nombres informales
  findOrCreateClient(fullName: string, phone?: string): Client {
    const clients = this.getClients();
    
    // 1. Normalizar el nombre de búsqueda
    const searchName = fullName.trim();
    
    // 2. Buscar cliente existente (comparación inteligente)
    const existingClient = clients.find(c => {
      // Verificar si son nombres similares
      return this.areNamesSimilar(c.name, searchName);
    });
    
    if (existingClient) {
      console.log('✅ Cliente existente encontrado:', existingClient.name, 'para:', searchName);
      return existingClient;
    }
    
    // 3. Crear nuevo cliente con información del tipo de nombre
    const parsedName = this.parseNameComponents(searchName);
    const clientId = crypto.randomUUID();
    
    const newClient: Client = {
      id: clientId,
      name: searchName,
      // ✅ NUEVO: Guardar componentes del nombre
      nameComponents: {
        baseName: parsedName.baseName,
        descriptor: parsedName.descriptor,
        type: parsedName.type || 'formal',
        identifier: this.createClientIdentifier(searchName)
      },
      phone,
      totalDebt: 0,
      totalPaid: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    clients.push(newClient);
    this.saveClients(clients);
    
    console.log('✅ Nuevo cliente creado:', newClient.name, 'Tipo:', parsedName.type);
    return newClient;
  },

  updateClient(clientId: string, updates: Partial<Client>): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === clientId);
    
    if (index !== -1) {
      clients[index] = {
        ...clients[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.saveClients(clients);
    }
  },

  // ✅ NUEVO: Buscar cliente por nombre (búsqueda flexible)
  findClientByName(fullName: string): Client | null {
    const clients = this.getClients();
    const searchName = fullName.trim();
    
    // 1. Primero buscar coincidencia exacta
    const exactMatch = clients.find(c => 
      this.normalizeNameForSearch(c.name) === this.normalizeNameForSearch(searchName)
    );
    if (exactMatch) return exactMatch;
    
    // 2. Buscar por nombre base (ej: "Jose" en "Jose supermercado")
    const parsedSearch = this.parseNameComponents(searchName);
    const baseNameMatch = clients.find(c => {
      const parsedClient = this.parseNameComponents(c.name);
      return this.normalizeNameForSearch(parsedClient.baseName) === 
             this.normalizeNameForSearch(parsedSearch.baseName);
    });
    
    if (baseNameMatch) {
      console.log('⚠️ Advertencia: Encontrado cliente con nombre base similar:', 
        baseNameMatch.name, 'para:', searchName);
      return baseNameMatch;
    }
    
    return null;
  },

  // ✅ NUEVO: Verificar si un cliente existe
  clientExists(fullName: string): boolean {
    return this.findClientByName(fullName) !== null;
  },

  // ✅ NUEVO: Obtener todos los clientes con un nombre base específico
  getClientsByBaseName(baseName: string): Client[] {
    const clients = this.getClients();
    const normalizedBase = this.normalizeNameForSearch(baseName);
    
    return clients.filter(c => {
      const parsed = this.parseNameComponents(c.name);
      return this.normalizeNameForSearch(parsed.baseName) === normalizedBase;
    });
  },

  // ===== DEUDAS DE CLIENTES =====
  getBusinessDebts(): Debt[] {
    try {
      const debts = localStorage.getItem(BUSINESS_DEBTS_KEY);
      return debts ? JSON.parse(debts) : [];
    } catch (error) {
      console.error('Error al leer deudas de negocio:', error);
      return [];
    }
  },

  saveBusinessDebts(debts: Debt[]): void {
    localStorage.setItem(BUSINESS_DEBTS_KEY, JSON.stringify(debts));
  },

  // ✅ MEJORADO: Registrar deuda con manejo de nombres
  addClientDebt(fullName: string, amount: number, description?: string): { client: Client; debt: Debt } {
    // 1. Encontrar o crear cliente (con manejo de nombres)
    const client = this.findOrCreateClient(fullName);
    
    // 2. Verificar si hay clientes con nombre similar
    const similarClients = this.getClientsByBaseName(fullName);
    if (similarClients.length > 1) {
      console.log('⚠️ Advertencia: Hay múltiples clientes con nombre similar:', 
        similarClients.map(c => c.name).join(', '));
    }
    
    // 3. Crear deuda
    const debts = this.getBusinessDebts();
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      type: 'owed',
      person: client.name, // Guardar el nombre exacto como se registró
      clientId: client.id, // ✅ NUEVO: Referencia al cliente
      amount,
      description: description || 'Deuda de cliente',
      date: new Date(),
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    debts.push(newDebt);
    this.saveBusinessDebts(debts);
    
    // 4. Actualizar cliente
    this.updateClient(client.id, {
      totalDebt: client.totalDebt + amount,
      lastTransaction: new Date(),
    });
    
    return { client, debt: newDebt };
  },

  // ✅ MEJORADO: Registrar pago con manejo de nombres
  addClientPayment(fullName: string, amount: number, notes?: string): boolean {
    // Buscar cliente (búsqueda flexible)
    const client = this.findClientByName(fullName);
    
    if (!client) {
      console.error('Cliente no encontrado:', fullName);
      
      // ✅ NUEVO: Mostrar sugerencias si hay nombres similares
      const similar = this.getClientsByBaseName(fullName);
      if (similar.length > 0) {
        console.log('¿Quizás te refieres a:', similar.map(c => c.name).join(', '));
      }
      
      return false;
    }
    
    // Resto del código igual que antes...
    const debts = this.getBusinessDebts();
    const clientDebts = debts.filter(d => 
      d.clientId === client.id && // ✅ NUEVO: Usar clientId en lugar de nombre
      d.status !== 'paid'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (clientDebts.length === 0) {
      console.error('El cliente no tiene deudas pendientes');
      return false;
    }
    
    // Aplicar pago a la deuda más antigua
    let remainingPayment = amount;
    
    for (const debt of clientDebts) {
      if (remainingPayment <= 0) break;
      
      const remainingDebt = debt.amount - (debt.paidAmount || 0);
      const paymentAmount = Math.min(remainingPayment, remainingDebt);
      
      // Actualizar deuda
      const debtIndex = debts.findIndex(d => d.id === debt.id);
      if (debtIndex !== -1) {
        const newPaidAmount = (debts[debtIndex].paidAmount || 0) + paymentAmount;
        debts[debtIndex] = {
          ...debts[debtIndex],
          paidAmount: newPaidAmount,
          status: newPaidAmount >= debts[debtIndex].amount ? 'paid' : 'partial',
          updatedAt: new Date(),
        };
        
        // Registrar pago
        if (!debts[debtIndex].payments) {
          debts[debtIndex].payments = [];
        }
        debts[debtIndex].payments!.push({
          id: crypto.randomUUID(),
          debtId: debt.id,
          amount: paymentAmount,
          date: new Date(),
          note: notes || `Pago de ${client.name}`,
        });
        
        remainingPayment -= paymentAmount;
      }
    }
    
    this.saveBusinessDebts(debts);
    
    // Actualizar cliente
    this.updateClient(client.id, {
      totalDebt: Math.max(0, client.totalDebt - amount),
      totalPaid: client.totalPaid + amount,
      lastTransaction: new Date(),
    });
    
    return true;
  },

  // ===== CONSULTAS (MODIFICADAS PARA USAR clientId) =====
  getClientSummary(fullName: string): ClientSummary | null {
    const client = this.findClientByName(fullName);
    
    if (!client) return null;
    
    const debts = this.getBusinessDebts();
    const clientDebts = debts.filter(d => d.clientId === client.id);
    
    const pendingDebts = clientDebts.filter(d => d.status !== 'paid').length;
    const paidDebts = clientDebts.filter(d => d.status === 'paid').length;
    
    const lastPayment = clientDebts
      .flatMap(d => d.payments || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const lastDebt = clientDebts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const totalDebt = clientDebts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const totalPaid = clientDebts
      .filter(d => d.status === 'paid')
      .reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    return {
      clientId: client.id,
      clientName: client.name,
      totalDebt,
      totalPaid,
      pendingDebts,
      paidDebts,
      lastPayment: lastPayment?.date,
      lastDebt: lastDebt?.date,
    };
  },

  getBusinessSummary() {
    const clients = this.getClients();
    const debts = this.getBusinessDebts();
    
    const totalOwed = debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const clientsWithDebt = clients.filter(c => c.totalDebt > 0).length;
    
    // Top 5 deudores
    const topDebtors = clients
      .filter(c => c.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5)
      .map(client => ({
        clientId: client.id,
        clientName: client.name,
        totalDebt: client.totalDebt,
        totalPaid: client.totalPaid,
        pendingDebts: debts.filter(d => 
          d.clientId === client.id && d.status !== 'paid'
        ).length,
        paidDebts: debts.filter(d => 
          d.clientId === client.id && d.status === 'paid'
        ).length,
      }));
    
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => 
        c.lastTransaction && 
        new Date(c.lastTransaction).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      ).length,
      clientsWithDebt,
      totalOwed,
      topDebtors,
    };
  },

  // ===== BÚSQUEDA MEJORADA =====
  searchClients(query: string): Client[] {
    const clients = this.getClients();
    const lowerQuery = query.toLowerCase();
    
    return clients.filter(client => {
      // Buscar en nombre
      if (client.name.toLowerCase().includes(lowerQuery)) return true;
      
      // Buscar en nombre base
      if (client.nameComponents?.baseName?.toLowerCase().includes(lowerQuery)) return true;
      
      // Buscar en descriptor
      if (client.nameComponents?.descriptor?.toLowerCase().includes(lowerQuery)) return true;
      
      // Buscar en teléfono
      if (client.phone?.toLowerCase().includes(lowerQuery)) return true;
      
      return false;
    });
  },

  getClientDebts(clientId: string): Debt[] {
    return this.getBusinessDebts().filter(d => d.clientId === clientId);
  },
};