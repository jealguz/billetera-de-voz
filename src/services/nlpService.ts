// nlpService.ts - VERSIÓN SUPER-MEGA-MEJORADA con TODO EL IDIOMA
import { franc } from 'franc';
import { formatCurrency } from '../utils/formatters';

// ✅ ACTUALIZADO: Tipo Intent con todos los casos
export type Intent =
  | 'add_debt'
  | 'add_payment'
  | 'query_debt'
  | 'show_summary'
  | 'create_client'
  | 'delete_client'
  | 'query_payment_history'
  | 'query_last_payment'
  | 'query_overdue_debts'
  | 'query_i_owe'
  | 'query_owe_me'
  | 'query_all_debts'
  | 'query_client_list'
  | 'clear_debts'
  | 'business_stats'
  | 'unknown';

export interface ParsedCommand {
  intent: Intent;
  entities: {
    person?: string;
    amount?: number;
    description?: string;
    date?: Date;
    action?: 'debe' | 'pagó' | 'pagar' | 'consultar';
    // ✅ MEJORADO: Campos para manejo inteligente de nombres
    fullName?: string;
    informalIdentifier?: string;
    informalType?: string;
    keepFullIdentifier?: boolean;
    isBusiness?: boolean;
    isOccupation?: boolean;
    isLocation?: boolean;
    normalizedName?: string; // ✅ NUEVO: Nombre normalizado para evitar duplicados
    personKey?: string; // ✅ NUEVO: Clave única para identificar persona
  };
  confidence: number;
  rawText: string;
  language: string;
  normalizedText?: string; // ✅ NUEVO: Texto normalizado
}

class NLPService {
  private cache = new Map<string, ParsedCommand>();

  // ✅ EXTENSIVAMENTE MEJORADO: Diccionarios MEGA completos
  private informalNamePatterns = {
    business: [
      // Negocios de comida - EXTENDIDO
      'carnicería', 'carnicero', 'carniceria', 'panadería', 'panadero', 'panaderia',
      'verdulería', 'verdulero', 'verduleria', 'frutería', 'frutero', 'fruteria',
      'pescadería', 'pescadero', 'pescaderia', 'polleria', 'pollero', 'pollería',
      'charcutería', 'charcuteria', 'dulcería', 'dulceria', 'pastelería', 'pasteleria',
      'heladería', 'heladero', 'heladeria', 'restaurante', 'cafetería', 'cafeteria',
      'café', 'cafe', 'bar', 'cantina', 'taquería', 'taqueria', 'pizzería', 'pizzeria',
      'hamburguesería', 'hamburgueseria', 'comida rápida', 'comida rapida', 'buffet',
      'fuente de soda', 'soderia', 'sodería', 'asadero', 'parrilla', 'rotisería', 'rotiseria',

      // Supermercados y tiendas - EXTENDIDO
      'supermercado', 'super', 'tienda', 'almacén', 'almacen', 'negocio', 'comercio', 'bodega',
      'minimercado', 'minisuper', 'autoservicio', 'plaza de mercado', 'mercado', 'mercadito',
      'centro comercial', 'mall', 'galería', 'galeria', 'plaza', 'centro', 'local',

      // Especializadas - EXTENDIDO
      'farmacia', 'botica', 'droguería', 'drogueria', 'licorera', 'licor', 'vinatería', 'vinateria',
      'papelería', 'papeleria', 'librería', 'libreria', 'ferretería', 'ferreteria', 'ferretero',
      'taller mecánico', 'taller mecanico', 'taller', 'gomeria', 'llantera', 'autolavado',
      'lavandería', 'lavanderia', 'lavaseco', 'tintorería', 'tintoreria', 'peluquería', 'peluqueria',
      'barbería', 'barberia', 'estética', 'estetica', 'spa', 'gimnasio', 'fitness', 'joyería', 'joyeria',
      'relojería', 'relojeria', 'zapatería', 'zapateria', 'zapatero', 'modas', 'ropa', 'boutique',
      'sastrería', 'sastreria', 'mueblería', 'muebleria', 'decoración', 'decoracion', 'electrodoméstico',
      'electrodomestico', 'tecnología', 'tecnologia', 'florería', 'floreria', 'floristería', 'floristeria',
      'vivero', 'mascotas', 'veterinaria', 'gasolinera', 'estación', 'estacion', 'taller', 'concesionario',
      'agencia', 'celularía', 'celularia', 'computación', 'computacion',

      // Servicios profesionales - EXTENDIDO
      'consultorio', 'clínica', 'clinica', 'hospital', 'laboratorio', 'óptica', 'optica',
      'estudio', 'oficina', 'despacho', 'agencia', 'empresa', 'constructora', 'inmobiliaria',
      'seguros', 'bancaria', 'contable', 'jurídico', 'juridico', 'notaría', 'notaria',

      // Otros - EXTENDIDO
      'discoteca', 'antro', 'karaoke', 'billar', 'bolera', 'cine', 'teatro', 'hotel',
      'motel', 'hostal', 'posada', 'apartahotel', 'casino', 'lotería', 'loteria',
      'apuestas', 'cyber', 'internet', 'ciber', 'salón', 'salon', 'club', 'gimnasio'
    ],

    relationship: [
      // Familia directa - EXTENDIDO
      'papá', 'papa', 'mamá', 'mama', 'padre', 'madre', 'hijo', 'hija',
      'hermano', 'hermana', 'hermanito', 'hermanita', 'tío', 'tio', 'tía', 'tia',
      'primo', 'prima', 'primito', 'primita', 'abuelo', 'abuela', 'abuelito', 'abuelita',
      'nieto', 'nieta', 'sobrino', 'sobrina', 'bisabuelo', 'bisabuela',
      'cuñado', 'cuñada', 'suegro', 'suegra', 'yerno', 'nuera',
      'esposo', 'esposa', 'marido', 'mujer', 'novio', 'novia',
      'prometido', 'prometida', 'pareja', 'compañero', 'compañera',

      // Familia extendida y política - EXTENDIDO
      'compadre', 'comadre', 'padrino', 'madrina', 'ahijado', 'ahijada',
      'concuñado', 'concuñada', 'consuegro', 'consuegra', 'tio abuelo', 'tia abuela',

      // Amistades - EXTENDIDO CON REGIONALISMOS
      'amigo', 'amiga', 'amiguito', 'amiguita', 'mejor amigo', 'mejor amiga',
      'colega', 'compañero', 'compañera', 'vecino', 'vecina', 'conocido', 'conocida',
      'parcero', 'parcera', 'pana', 'bro', 'mano', 'hermano', 'compai', 'compa',
      'carnal', 'cuate', 'pata', 'llave', 'ñero', 'chamo', 'pibe', 'chabón', 'chabona',
      'man', 'herman', 'brother', 'socio', 'socia', 'compi', 'cuate', 'valedor',

      // Tratamientos respetuosos - EXTENDIDO
      'señor', 'señora', 'señorita', 'don', 'doña', 'joven', 'muchacho',
      'muchacha', 'caballero', 'dama', 'licenciado', 'licenciada',
      'doctor', 'doctora', 'ingeniero', 'ingeniera', 'arquitecto', 'arquitecta',
      'profesor', 'profesora', 'maestro', 'maestra'
    ],

    occupation: [
      // Oficios - EXTENDIDO
      'panadero', 'panadera', 'carnicero', 'carnicera', 'verdulero', 'verdulera',
      'frutero', 'frutera', 'pescadero', 'pescadera', 'cocinero', 'cocinera',
      'chef', 'mesero', 'mesera', 'bartender', 'garzón', 'garzon', 'moz', 'mozo',
      'ayudante', 'asistente', 'operario', 'obrero', 'trabajador', 'trabajadora',

      // Construcción - EXTENDIDO
      'albañil', 'maestro', 'obrero', 'peón', 'peon', 'carpintero', 'carpintera',
      'plomero', 'plomera', 'electricista', 'pintor', 'pintora', 'gasfiter', 'gasfitera',
      'techador', 'instalador', 'constructor', 'contratista', 'ingeniero civil',

      // Transporte - EXTENDIDO
      'taxista', 'conductor', 'conductora', 'chófer', 'chofer', 'motorista', 'repartidor',
      'delivery', 'mensajero', 'mensajera', 'camionero', 'camionera', 'moto', 'mototaxista',
      'uber', 'did', 'cabify', 'conductor de app', 'driver',

      // Profesionales - EXTENDIDO
      'doctor', 'doctora', 'médico', 'medico', 'enfermero', 'enfermera',
      'profesor', 'profesora', 'maestro', 'maestra', 'educador', 'educadora',
      'ingeniero', 'ingeniera', 'arquitecto', 'arquitecta', 'abogado', 'abogada',
      'contador', 'contadora', 'administrador', 'administradora', 'psicólogo', 'psicologo',
      'psicóloga', 'psicologa', 'dentista', 'odontólogo', 'odontologo', 'odontóloga', 'odontologa',

      // Comercio - EXTENDIDO
      'vendedor', 'vendedora', 'dependiente', 'dependienta', 'cajero', 'cajera',
      'gerente', 'supervisor', 'supervisora', 'asesor', 'asesora', 'ejecutivo', 'ejecutiva',

      // Técnicos - EXTENDIDO
      'mecánico', 'mecanico', 'mecánica', 'mecanica', 'técnico', 'tecnico', 'técnica', 'tecnica',
      'informático', 'informatico', 'informática', 'informatica', 'programador', 'programadora',
      'diseñador', 'disenador', 'diseñadora', 'disenadora', 'soporte', 'tecnólogo', 'tecnologo',

      // Servicios - EXTENDIDO
      'peluquero', 'peluquera', 'barbero', 'estilista', 'manicurista', 'pedicurista',
      'masajista', 'entrenador', 'entrenadora', 'vigilante', 'guarda', 'guardia',
      'policía', 'policia', 'bombero', 'bombera', 'militar', 'soldado', 'marino',
      'guardia', 'celador', 'celadora', 'portero', 'portera', 'conserje'
    ],

    location: [
      // Direcciones - EXTENDIDO
      'esquina', 'casa', 'local', 'puesto', 'kiosko', 'quiosco', 'kiosco',
      'edificio', 'torre', 'apartamento', 'oficina', 'consultorio', 'departamento',
      'sótano', 'sotano', 'primer piso', 'segundo piso', 'tercer piso', 'cuarto piso',
      'penthouse', 'ático', 'atico', 'estudio', 'loft',

      // Barrios y zonas - EXTENDIDO
      'barrio', 'urbanización', 'urbanizacion', 'conjunto', 'condominio', 'sector',
      'zona', 'área', 'area', 'lote', 'manzana', 'bloque', 'etapa', 'fase',
      'complejo', 'residencial', 'unidad', 'vecindario', 'colonia', 'fraccionamiento',

      // Vías - EXTENDIDO
      'calle', 'carrera', 'avenida', 'diagonal', 'transversal', 'circular',
      'circunvalar', 'autopista', 'carretera', 'vía', 'via', 'ruta', 'camino',
      'pasaje', 'bulevar', 'boulevard', 'paseo', 'sendero', 'vereda',

      // Puntos de referencia - EXTENDIDO
      'parque', 'plaza', 'centro', 'mercado', 'terminal', 'estación', 'estacion',
      'puente', 'rotonda', 'glorieta', 'semáforo', 'semaforo', 'paso', 'puente peatonal',
      'monumento', 'estatua', 'fuente', 'iglesia', 'templo', 'escuela', 'colegio',
      'universidad', 'hospital', 'clínica', 'clinica', 'centro comercial', 'mall',

      // Negocios como ubicación - EXTENDIDO
      'frente al', 'frente a la', 'frente del', 'frente de la',
      'al lado de', 'al lado del', 'al lado de la',
      'detrás de', 'detrás del', 'detrás de la',
      'cerca de', 'cerca del', 'cerca de la', 'enfrente del', 'enfrente de la',
      'al lado', 'al frente', 'atrás', 'cerca', 'lejos', 'entre'
    ]
  };

  // ✅ Apellidos comunes EXTENDIDOS
  private commonLastNames = [
    // Españoles comunes - EXTENDIDO
    'garcía', 'rodríguez', 'rodriguez', 'gonzález', 'gonzalez', 'fernández', 'fernandez',
    'lópez', 'lopez', 'martínez', 'martinez', 'sánchez', 'sanchez', 'pérez', 'perez',
    'gómez', 'gomez', 'martín', 'martin', 'jiménez', 'jimenez', 'ruiz', 'hernández', 'hernandez',
    'díaz', 'diaz', 'moreno', 'muñoz', 'muñoz', 'álvarez', 'alvarez', 'romero', 'alonso',
    'gutierrez', 'navarro', 'torres', 'domínguez', 'dominguez', 'vázquez', 'vazquez',
    'ramos', 'gil', 'ramírez', 'ramirez', 'serrano', 'blanco', 'molina', 'morales',
    'suárez', 'suarez', 'ortega', 'delgado', 'castro', 'ortiz', 'rubio', 'marín', 'marin',
    'sanz', 'nuñez', 'nunez', 'iglesias', 'medina', 'garrido', 'cortés', 'cortes',
    'castillo', 'santos', 'reyes', 'peña', 'peña', 'flores', 'cabrera', 'campos',
    'vega', 'fuentes', 'carrasco', 'prieto', 'moya', 'soto', 'cruz', 'calvo',
    'gallardo', 'león', 'leon', 'herrera', 'pascual', 'ferrer', 'vidal', 'montero',

    // Colombianos específicos - EXTENDIDO
    'amaya', 'ospina', 'uribe', 'santodomingo', 'santo domingo', 'ardila', 'gaviria',
    'londoño', 'londono', 'echavarría', 'echavarria', 'restrepo', 'betancur', 'turbay',
    'lleras', 'pastrana', 'samper', 'alzate', 'arias', 'bermúdez', 'bermudez',
    'cárdenas', 'cardenas', 'duarte', 'escobar', 'franco', 'gallego', 'herrera',
    'ibáñez', 'ibañez', 'jaimes', 'león', 'montoya', 'ñañez', 'narvaez', 'ocampo',
    'pardo', 'quintero', 'rojas', 'salazar', 'téllez', 'tellez', 'urrea', 'valencia',
    'zapata', 'aguilar', 'barrera', 'calderón', 'calderon', 'dávila', 'davila',
    'espinosa', 'fajardo', 'guerrero', 'hurtado', 'jurado', 'lara', 'mora',
    'narváez', 'narvaez', 'olaya', 'páez', 'paez', 'quintana', 'riascos',
    'sierra', 'trujillo', 'vargas', 'yepes', 'zuluaga', 'arango', 'bedoya',
    'cifuentes', 'echeverri', 'giraldo', 'henao', 'jaramillo', 'mejía', 'mejia',
    'osorio', 'palacio', 'quesada', 'rendón', 'rendon', 'sepúlveda', 'sepulveda',
    'umana', 'vallejo', 'acevedo', 'bueno', 'cáceres', 'caceres', 'daza', 'fonseca',
    'granados', 'molano', 'mosquera', 'ortiz', 'perea', 'rincón', 'rincon', 'solano',

    // Más apellidos latinoamericanos - EXTENDIDO
    'castro', 'chávez', 'chavez', 'estrada', 'granados', 'ibarra', 'mendoza',
    'orozco', 'pacheco', 'quiroz', 'tapia', 'valdez', 'zamora', 'acevedo',
    'bautista', 'caballero', 'cervantes', 'delacruz', 'feliciano', 'guzmán', 'guzman',
    'huerta', 'luna', 'maldonado', 'miranda', 'olivera', 'padilla', 'quintanilla',
    'rivas', 'santana', 'velásquez', 'velasquez', 'villanueva', 'zavala', 'alvarado',
    'bravo', 'caban', 'dejesus', 'estevez', 'figueroa', 'galindo', 'hidalgo',
    'jasso', 'kennedy', 'lima', 'madrigal', 'nieto', 'ojeda', 'palma', 'quezada',
    'rosado', 'segura', 'toro', 'urrutia', 'venegas', 'ybarra', 'zepeda'
  ];

  // ✅ Nombres MEGA completos
  private commonFirstNames = [
    // Nombres hispanos comunes (A-Z) - EXTENDIDO
    'adriana', 'adrian', 'adrián', 'alberto', 'alejandro', 'alfonso', 'alicia',
    'almir', 'alonso', 'amanda', 'amparo', 'ana', 'andrea', 'andrés', 'andres',
    'ángel', 'angel', 'ángela', 'angela', 'antonio', 'armando', 'arturo', 'aylén',
    'aylen', 'beatriz', 'benjamín', 'benjamin', 'bernardo', 'berta', 'blanca',
    'brayan', 'brenda', 'brigitte', 'camila', 'camilo', 'candelaria', 'carlos',
    'carmen', 'carolina', 'catalina', 'cecilia', 'cesar', 'césar', 'clara',
    'claudia', 'claudio', 'concepción', 'concepcion', 'consuelo', 'cristian',
    'cristina', 'cristóbal', 'cristobal', 'daniel', 'daniela', 'david', 'deiber',
    'diana', 'diego', 'dolores', 'domingo', 'dorotea', 'eduardo', 'elena',
    'elías', 'elias', 'elisa', 'elvira', 'emilia', 'emilio', 'enrique', 'ernesto',
    'esperanza', 'esteban', 'ester', 'eugenio', 'eva', 'fabian', 'fabián', 'fabian',
    'felipe', 'fernanda', 'fernando', 'fidel', 'francisca', 'francisco', 'gabriel',
    'gabriela', 'genaro', 'gerardo', 'gerónimo', 'geronimo', 'gilberto', 'gisela',
    'gloria', 'gonzalo', 'gregorio', 'guadalupe', 'guillermo', 'gustavo', 'hector',
    'hernán', 'hernan', 'hugo', 'humberto', 'ignacio', 'ines', 'inés', 'irene',
    'irma', 'isabel', 'isidro', 'israel', 'iván', 'ivan', 'jacinto', 'jacobo',
    'jaime', 'javier', 'jenny', 'jerónimo', 'jeronimo', 'jesús', 'jesus', 'jhon',
    'jhoan', 'jimena', 'joaquín', 'joaquin', 'johan', 'jonathan', 'jorge', 'josé',
    'jose', 'juan', 'juana', 'julian', 'julián', 'julio', 'karina', 'karol',
    'katherine', 'kevin', 'lady', 'laura', 'leandro', 'leidy', 'leonardo', 'leonel',
    'leticia', 'liliana', 'linda', 'lorena', 'lorenzo', 'lucas', 'lucia', 'luciana',
    'lucio', 'luis', 'luisa', 'luz', 'macarena', 'manuel', 'marcela', 'marcelo',
    'marcos', 'margarita', 'maría', 'maria', 'mariana', 'mariano', 'maricela',
    'marina', 'mario', 'marisol', 'maritza', 'marta', 'martín', 'martin', 'martina',
    'mateo', 'matías', 'matias', 'mauricio', 'maximiliano', 'melania', 'melissa',
    'mercedes', 'micaela', 'miguel', 'miriam', 'moisés', 'moises', 'monica', 'mónica',
    'natalia', 'néstor', 'nestor', 'nicolás', 'nicolas', 'noelia', 'noemí', 'noemi',
    'norma', 'octavio', 'ofelia', 'olga', 'omar', 'oscar', 'osvaldo', 'pablo',
    'paola', 'patricia', 'patricio', 'paula', 'paz', 'pedro', 'pilar', 'ramiro',
    'ramón', 'ramon', 'raquel', 'raul', 'raúl', 'rebeca', 'regina', 'renata',
    'renato', 'ricardo', 'roberto', 'rocio', 'rocío', 'rodolfo', 'rodrigo',
    'rogelio', 'román', 'roman', 'rosa', 'rosalía', 'rosalia', 'rosario', 'roxana',
    'rubén', 'ruben', 'ruth', 'samuel', 'sandra', 'santiago', 'sara', 'sarai',
    'sebastián', 'sebastian', 'sergio', 'silvana', 'silvia', 'simón', 'simon',
    'sofía', 'sofia', 'sol', 'sonia', 'stiven', 'susana', 'tamara', 'teodoro',
    'tereza', 'teresa', 'timoteo', 'tomás', 'tomas', 'tulio', 'ulises', 'ursula',
    'valentina', 'valeria', 'vanesa', 'verónica', 'veronica', 'victor', 'victoria',
    'vicente', 'violeta', 'virginia', 'walter', 'wilson', 'ximena', 'yeison',
    'yolanda', 'yurani', 'yulieth', 'yurley', 'zaida', 'zéferino', 'zeferino'
  ];

  // ✅ VARIACIONES LINGÜÍSTICAS POR REGIÓN
  private regionalVariations = {
    // Colombia
    colombia: {
      deuda: ['fiado', 'fiao', 'prestado', 'dejao', 'dejado', 'fiadito', 'prestamo', 'préstamo'],
      pago: ['pegué', 'metí', 'di', 'entregué', 'pagué', 'cancelé', 'saldé', 'aboné', 'solucioné'],
      dinero: ['plata', 'luca', 'lucas', 'varo', 'varos', 'billete', 'guita', 'real', 'pesos'],
      expresiones: ['a la fija', 'de una', 'de una vez', 'paila', 'chimba', 'parce']
    },
    // México
    mexico: {
      deuda: ['fiar', 'fiao', 'prestar', 'dejar', 'adeudar', 'deber', 'prestado'],
      pago: ['chiclear', 'liquido', 'pago', 'cancelo', 'suelto', 'solté', 'entregué'],
      dinero: ['varo', 'varos', 'lana', 'feria', 'billete', 'morralla', 'centavos', 'pesos'],
      expresiones: ['al tiro', 'de volada', 'ahorita', 'orale', 'qué onda']
    },
    // Argentina
    argentina: {
      deuda: ['fiado', 'prestado', 'dejar', 'adeudar', 'deber', 'prestamo', 'préstamo'],
      pago: ['pagué', 'aboné', 'cancelo', 'saldé', 'liquidé', 'entregué', 'deposite'],
      dinero: ['guita', 'plata', 'mango', 'mangos', 'billete', 'pesos', 'centavos'],
      expresiones: ['dale', 'che', 'boludo', 'posta', 're bien', 'joya']
    },
    // España
    españa: {
      deuda: ['fiado', 'dejado', 'prestado', 'adeudado', 'deber', 'préstamo'],
      pago: ['pagué', 'aboné', 'saldé', 'liquidé', 'cancelé', 'ingresé', 'entregué'],
      dinero: ['pasta', 'guita', 'parné', 'calé', 'dinero', 'euros', 'centimos'],
      expresiones: ['vale', 'tío', 'guay', 'mola', 'genial', 'perfecto']
    }
  };

  // ✅ PALABRAS CLAVE MEGA-EXTENSAS PARA DETECCIÓN DE INTENCIÓN
private intentKeywords = {
  add_debt: [
    // ============ YO DEBO (Le debo a...) ============
    'le debo', 'yo le debo', 'debo a', 'debo pagar', 'tengo que pagar',
    'me toca pagar', 'tengo una deuda', 'contraje una deuda',
    'me endeudé con', 'me fio', 'me fió', 'me prestó', 'me presto',
    'me dio fiado', 'me dio prestado', 'me hizo un préstamo',
    'me adelantó', 'me adelanto', 'me dio un adelanto', 'me dio plata',
    'me fió dinero', 'me fiaron', 'me prestaron',

    // ============ ME DEBEN (Me debe...) ============
    'me debe', 'me deben', 'me quedó debiendo', 'me quedo debiendo',
    'me fió', 'me presté', 'me preste', 'le presté a', 'le preste a',
    'le di fiado a', 'le di adelanto', 'le adelanté a', 'le adelante a',
    'le di plata a', 'le presté dinero', 'le preste dinero',
    'le di crédito', 'le di credito', 'le hice un préstamo',

    // ============ VARIACIONES REGIONALES ============
    // Colombia
    'me tiene un roto', 'me quedó mal', 'me debe una plata',
    'me fió en la tienda', 'me debe un fiado', 'me debe un prestamo',
    'me prestó plata', 'me debe lucas', 'me debe varo',

    // México
    'me debe lana', 'me fió en el negocio', 'me debe varos',
    'me prestó varo', 'me debe feria', 'me chicleó',

    // Argentina
    'me debe guita', 'me prestó mangos', 'me fiaron',
    'me debe plata', 'me dejó debiendo',

    // España
    'me debe pasta', 'me prestó dinero', 'me fiaron',
    'me debe parné', 'me dejó a deber',

    // ============ CONTEXTOS DE DEUDA ============
    'se me debe', 'hay que cobrar', 'tengo que cobrar',
    'pendiente de pago', 'por pagar', 'por cobrar',
    'saldo pendiente', 'cuenta pendiente', 'deuda pendiente',
    'fiado pendiente', 'préstamo pendiente', 'prestamo pendiente',
    'adeudo pendiente', 'debe pendiente', 'pendiente',
    'quedó pendiente', 'queda pendiente', 'está pendiente',

    // ============ SINÓNIMOS Y EXPRESIONES ============
    'me adeuda', 'tengo un adeudo con', 'tengo saldo con',
    'le debo plata a', 'le debo dinero a', 'le debo varo a',
    'le debo lucas a', 'le debo guita a', 'le debo pasta a',
    'tengo una cuenta pendiente con', 'tengo saldo pendiente con',
    'hay una deuda con', 'existe una deuda con', 'registré una deuda con',
    'anoté una deuda con', 'apunté una deuda con',

    // ============ FORMAS IMPLÍCITAS ============
    'compré fiado a', 'saqué fiado a', 'pedí fiado a',
    'tomé prestado de', 'saqué prestado de', 'pedí prestado a',
    'me dio a crédito', 'me dio crédito', 'me vendió a crédito',
    'me facturó', 'me pasó factura', 'me cobrará después',
    'pagará después', 'pagaré después', 'dejaré para después',

    // ============ NEGACIONES (para evitar falsos positivos) ============
    'no le debo', 'no me debe', 'ya pagué', 'ya cancelé',
    'liquidado', 'saldado', 'pagado completamente'
  ],

  add_payment: [
    // ============ PAGOS RECIBIDOS (Me pagó...) ============
    'me pagó', 'me pago', 'me abonó', 'me abono', 'me canceló', 'me cancelo',
    'me saldó', 'me saldo', 'me liquidó', 'me liquido', 'me dio el dinero',
    'me entregó', 'me entrego', 'me pagó la deuda', 'me pago la deuda',
    'me pagó el fiado', 'me pago el fiado', 'me pagó el préstamo', 'me pago el prestamo',
    'me pagó lo que debía', 'me pago lo que debia', 'me pagó la cuenta', 'me pago la cuenta',
    'me pagó el saldo', 'me pago el saldo', 'me dio plata', 'me pagó plata', 'me pago plata',

    // ============ PAGOS REALIZADOS (Le pagué...) ============
    'le pagué', 'le pague', 'le aboné', 'le abone', 'le cancelé', 'le cancele',
    'le saldé', 'le salde', 'le liquidé', 'le liquide', 'le di el dinero',
    'le entregué', 'le entregue', 'pagué la deuda', 'pague la deuda',
    'pagué el fiado', 'pague el fiado', 'pagué el préstamo', 'pague el prestamo',
    'pagué lo que debía', 'pague lo que debia', 'pagué la cuenta', 'pague la cuenta',
    'pagué el saldo', 'pague el saldo', 'abono a', 'le abono',

    // ============ VARIACIONES REGIONALES ============
    // Colombia
    'me pegó', 'me pego', 'me metió', 'me metio', 'me soltó', 'me solto',
    'me dio la plata', 'me pagó el roto', 'me pago el roto',
    'me canceló el fiado', 'me cancelo el fiado',

    // México
    'me chicleó', 'me chicleo', 'me soltó varo', 'me solto varo',
    'me pagó la lana', 'me pago la lana', 'me liquidó el adeudo',

    // Argentina
    'me pagó la guita', 'me pago la guita', 'me abonó los mangos',
    'me saldó la deuda', 'me liquido el préstamo',

    // España
    'me ingresó', 'me ingreso', 'me pagó la pasta', 'me pago la pasta',
    'me abonó el dinero', 'me liquido el prestamo',

    // ============ CONTEXTOS DE PAGO ============
    'realicé un pago', 'realice un pago', 'hice un pago',
    'efectué un pago', 'efectue un pago', 'realicé el pago', 'realice el pago',
    'hice el pago', 'efectué el pago', 'efectue el pago',
    'recibí pago', 'recibi pago', 'entregué pago', 'entregue pago',
    'hice abono', 'realicé abono', 'realice abono', 'efectué abono', 'efectue abono',
    'cancelé deuda', 'cancele deuda', 'saldé cuenta', 'salde cuenta',
    'liquidé deuda', 'liquide deuda', 'pagado', 'abonado', 'cancelado',
    'saldado', 'liquidado', 'entregado',

    // ============ FORMAS ESPECÍFICAS ============
    'pago realizado a', 'pago efectuado a', 'abono hecho a',
    'cancelación a', 'cancelacion a', 'liquidación a', 'liquidacion a',
    'saldé mi deuda con', 'salde mi deuda con', 'cancelé mi deuda con',
    'cancele mi deuda con', 'pagué todo lo que debía', 'pague todo lo que debia',
    'saldo completo a', 'liquidación total a', 'liquidacion total a',
    'pago parcial a', 'abono parcial a', 'anticipo a', 'señal a',

    // ============ SINÓNIMOS ============
    'me transfirió', 'me transfirio', 'me depositó', 'me deposito',
    'me hizo transferencia', 'me hizo un depósito', 'me hizo un deposito',
    'me mandó dinero', 'me mando dinero', 'me envió dinero', 'me envio dinero',
    'me pasó plata', 'me paso plata', 'me giró', 'me giro',

    // ============ EXPRESIONES COLOQUIALES ============
    'me soltó la plata', 'me solto la plata', 'me dio billete',
    'me pagó cash', 'me pago cash', 'me pagó en efectivo', 'me pago en efectivo',
    'me pagó al contado', 'me pago al contado', 'me pagó completo',
    'me pago completo', 'me pagó la totalidad', 'me pago la totalidad',

    // ============ NEGACIONES ============
    'no me pagó', 'no me pago', 'no pagué', 'no pague',
    'no he pagado', 'aún no pago', 'aun no pago', 'todavía no pagó',
    'no ha pagado', 'no canceló', 'no cancelo', 'no abonó', 'no abono'
  ],

  query_debt: [
    // ============ CONSULTAS ESPECÍFICAS ============
    'cuánto me debe', 'cuanto me debe', 'cuánto le debo', 'cuanto le debo',
    'qué me debe', 'que me debe', 'qué le debo', 'que le debo',
    'cuánto debo', 'cuanto debo', 'cuánto debe', 'cuanto debe',
    'monto pendiente', 'saldo actual', 'cuánto falta', 'cuanto falta',
    'cuánto queda', 'cuanto queda', 'cuánto tengo que pagar', 'cuanto tengo que pagar',
    'cuánto me tiene que pagar', 'cuanto me tiene que pagar',
    'estado de cuenta', 'estado de deuda', 'saldo con',

    // ============ CONSULTAS DE TIEMPO ============
    'desde cuándo me debe', 'desde cuando me debe',
    'desde cuándo le debo', 'desde cuando le debo',
    'hace cuánto me debe', 'hace cuanto me debe',
    'hace cuánto le debo', 'hace cuanto le debo',
    'cuánto tiempo me debe', 'cuanto tiempo me debe',
    'cuánto tiempo le debo', 'cuanto tiempo le debo',
    'fecha de la deuda', 'cuándo fue la deuda', 'cuando fue la deuda',
    'cuándo se hizo la deuda', 'cuando se hizo la deuda',
    'cuánto tiempo lleva debiendo', 'cuanto tiempo lleva debiendo',

    // ============ CONSULTAS GENERALES ============
    'consulta de deuda', 'ver deuda', 'revisar deuda', 'chequear deuda',
    'información de deuda', 'informacion de deuda', 'detalles de deuda',
    'historial de deuda', 'ver cuánto debo', 'ver cuanto debo',
    'saber cuánto debo', 'saber cuanto debo', 'conocer mi deuda',
    'mi deuda con', 'deuda que tengo con', 'lo que debo a',
    'lo que me debe', 'cuánto es lo que debo', 'cuanto es lo que debo',
    'cuánto es lo que me debe', 'cuanto es lo que me debe',

    // ============ VARIACIONES ============
    'cuánto adeudo', 'cuanto adeudo', 'cuánto tengo pendiente',
    'cuanto tengo pendiente', 'saldo pendiente con',
    'cuánto me adeuda', 'cuanto me adeuda', 'monto de la deuda',
    'valor de la deuda', 'importe pendiente', 'cantidad pendiente',

    // ============ PREGUNTAS DIRECTAS ============
    '¿cuánto me debe?', '¿cuanto me debe?', '¿cuánto le debo?',
    '¿cuanto le debo?', '¿cuánto debo?', '¿cuanto debo?',
    '¿cuánto debe?', '¿cuanto debe?', '¿qué me debe?', '¿que me debe?',
    '¿qué le debo?', '¿que le debo?', '¿hay deuda?', '¿tengo deuda?'
  ],

  show_summary: [
    // ============ RESUMEN GENERAL ============
    'resumen', 'balance', 'total de deudas', 'total de pagos',
    'cuánto debo en total', 'cuanto debo en total',
    'cuánto me deben en total', 'cuanto me deben en total',
    'estado general', 'situación financiera', 'situacion financiera',
    'resumen financiero', 'balance general', 'total general',
    'suma total', 'todas las deudas juntas', 'todo lo que debo',
    'todo lo que me deben', 'cuánto tengo pendiente', 'cuanto tengo pendiente',
    'cuánto hay pendiente', 'cuanto hay pendiente',
    'balance de cuentas', 'estado de cuentas', 'saldo total',
    'monto total', 'importe total', 'cálculo total', 'calculo total',
    'sumatoria', 'agregado', 'consolidado', 'panorama general',
    'vista general', 'visión general', 'vision general',
    'resumen completo', 'estado completo', 'todo junto',
    'suma de todo', 'todo sumado', 'total acumulado',
    
    // ============ NUEVAS CONSULTAS ESPECÍFICAS ============
    'resumen de mis deudas', 'balance total', 'ver balance',
    'total general de deudas', 'suma de todas las deudas',
    'todas mis deudas juntas', 'todo lo que debo y me deben',
    'estado financiero completo', 'panorama financiero',
    'saldo general', 'consolidado financiero'
  ],

  create_client: [
    'cliente nuevo', 'nuevo cliente', 'agregar cliente', 'registrar cliente',
    'añadir cliente', 'crear cliente', 'ingresar cliente',
    'guardar cliente', 'agregar contacto', 'nuevo contacto',
    'registrar persona', 'agregar persona', 'nueva persona',
    'añadir persona', 'crear persona', 'ingresar persona',
    'guardar persona', 'agregar nombre', 'nuevo nombre',
    'registrar nombre', 'cliente', 'contacto', 'persona nueva',
    'nuevo registro', 'alta de cliente', 'dar de alta',
    'incluir cliente', 'incorporar cliente', 'sumar cliente',
    'agregar a la lista', 'añadir a contactos', 'nuevo en el sistema'
  ],

  query_payment_history: [
    'historial de pagos', 'todos los pagos', 'pagos anteriores',
    'pagos realizados', 'pagos recibidos', 'registro de pagos',
    'lista de pagos', 'pagos históricos', 'pagos historicos',
    'movimientos de pago', 'cuánto ha pagado', 'cuanto ha pagado',
    'total pagado', 'suma de pagos', 'abonos realizados',
    'abonos recibidos', 'cancelaciones', 'liquidaciones',
    'pagos efectuados', 'pagos hechos', 'pagos realizados a',
    'pagos que ha hecho', 'pagos que he hecho', 'mis pagos',
    'pagos a mi favor', 'pagos en mi contra', 'histórico de pagos',
    'historico de pagos', 'bitácora de pagos', 'bitacora de pagos',
    'registro histórico', 'registro historico', 'archivo de pagos',
    'todos los abonos', 'todos los cancelaciones', 'toda la historia'
  ],

  query_last_payment: [
    'último pago', 'ultimo pago', 'última vez que pagó', 'ultima vez que pago',
    'cuándo pagó', 'cuando pago', 'cuándo fue el último pago', 'cuando fue el ultimo pago',
    'último abono', 'ultimo abono', 'última cancelación', 'ultima cancelacion',
    'reciente pago', 'pago más reciente', 'pago mas reciente',
    'último movimiento', 'ultimo movimiento', 'pago más nuevo',
    'pago mas nuevo', 'pago más actual', 'pago mas actual',
    'último desembolso', 'ultimo desembolso', 'última transferencia',
    'ultima transferencia', 'último depósito', 'ultimo deposito',
    'pago más recientemente', 'pago mas recientemente', 'más reciente pago',
    'mas reciente pago', 'lo último que pagó', 'lo ultimo que pago'
  ],

  query_overdue_debts: [
    'deudas vencidas', 'deudas atrasadas', 'deudas pendientes',
    'quién no ha pagado', 'quien no ha pagado', 'quiénes deben hace tiempo',
    'quienes deben hace tiempo', 'deudas morosas', 'deudas en mora',
    'clientes morosos', 'quién se atrasó', 'quien se atraso',
    'quién no cumple', 'quien no cumple', 'deudas retrasadas',
    'deudas vencidas', 'vencimientos', 'cuentas vencidas',
    'pagos atrasados', 'atrasos', 'retrasos en pagos',
    'morosidad', 'incumplimientos', 'deudas no pagadas a tiempo',
    'deudas fuera de plazo', 'deudas con retraso', 'retraso en pagos',
    'demora en pagos', 'pagos demorados', 'pagos atrasados',
    'quién tiene atraso', 'quien tiene atraso', 'quiénes deben y no pagan',
    'quienes deben y no pagan', 'deudores morosos', 'deudores atrasados',
    'clientes atrasados', 'quién lleva más tiempo debiendo',
    'quien lleva mas tiempo debiendo', 'deuda más antigua',
    'deuda mas antigua', 'deuda con mayor retraso'
  ],

  // ============ ✅ NUEVAS INTENCIONES ESPECÍFICAS ============
  
  query_i_owe: [
    // ============ A QUIÉN LE DEBO ============
    'a quién le debo', 'a quienes les debo', 'a quién debo',
    'a qué personas les debo', 'qué personas debo', 
    'quién me prestó', 'a quién le presté',
    'a quiénes debo dinero', 'personas a las que debo',
    'quienes me fiaron', 'a quiénes les debo plata',
    'lista de personas a las que debo', 'listado de acreedores',
    'ver a quienes les debo', 'consultar a quién le debo',
    'ver personas a las que debo', 'mostrar quién me prestó',
    'proveedores que debo', 'acreedores', 'a quién le debo plata',
    'a quién le debo dinero', 'a quién debo pagar',
    'quién me debe esperar pago', 'a quién tengo que pagar',
    'mis deudores a los que les debo', 'personas que me prestaron',
    
    // ============ VARIACIONES CON PREGUNTAS ============
    '¿a quién le debo?', '¿a quiénes les debo?', '¿a qué personas les debo?',
    '¿quién me prestó?', '¿a quién le presté?', '¿quién me fió?',
    '¿a quién le debo dinero?', '¿a quién le debo plata?',
    
    // ============ PATRONES ESPECÍFICOS ============
    'quién me tiene plata', 'a quién le debo varo', 'a quién le debo lucas',
    'a quién le debo guita', 'a quién le debo pasta',
    
    // ============ PARA TU APP ============
    '¿A qué personas les debo?', 'Ver a quienes debes dinero',
    'Lista de personas que me prestaron', 'Acreedores actuales'
  ],

  query_owe_me: [
    // ============ QUIÉN ME DEBE ============
    'quién me debe', 'quienes me deben', 'qué personas me deben',
    'quién me presté', 'a quién le presté', 
    'quién me quedó debiendo', 'quienes me quedaron debiendo',
    'quién me debe dinero', 'quién me debe plata',
    'personas que me deben', 'lista de personas que me deben',
    'listado de deudores', 'ver quién me debe', 'consultar quién me debe',
    'ver personas que me deben', 'mostrar quién me debe',
    'clientes que me deben', 'deudores', 'quién me debe varo',
    'quién me debe lucas', 'quién me debe guita', 'quién me debe pasta',
    'quién tiene que pagarme', 'a quién tengo que cobrar',
    'mis deudores', 'personas que me prestaron dinero',
    
    // ============ VARIACIONES CON PREGUNTAS ============
    '¿quién me debe?', '¿quienes me deben?', '¿qué personas me deben?',
    '¿quién me presté?', '¿a quién le presté?', '¿quién me fió?',
    '¿quién me debe dinero?', '¿quién me debe plata?',
    
    // ============ PATRONES ESPECÍFICOS ============
    'quién me tiene que pagar', 'quién me tiene que dar plata',
    'quién me debe varos', 'quién me debe lucas',
    'quién me debe guita', 'quién me debe pasta',
    
    // ============ PARA TU APP ============
    '¿Qué personas me deben?', 'Ver quienes te deben dinero',
    'Lista de personas que me deben', 'Deudores actuales',
    'Clientes con deuda pendiente'
  ],

  query_client_list: [
    // ============ LISTA DE CLIENTES ============
    'clientes', 'lista de clientes', 'todos los clientes',
    'mis clientes', 'contactos', 'lista de contactos',
    'personas registradas', 'ver clientes', 'mostrar clientes',
    'consultar clientes', 'clientes registrados', 'clientes en sistema',
    'clientes guardados', 'contactos guardados', 'personas en el sistema',
    'ver todos los clientes', 'mostrar todos los clientes',
    'lista completa de clientes', 'directorio de clientes',
    'agenda de clientes', 'base de clientes', 'registro de clientes',
    'clientes activos', 'clientes con historial',
    
    // ============ VARIACIONES ============
    '¿quiénes son mis clientes?', '¿tengo clientes registrados?',
    '¿cuáles son mis clientes?', 'muéstrame mis clientes',
    'dame la lista de clientes', 'quiero ver mis clientes',
    
    // ============ PARA TU APP ============
    'Lista de clientes', 'Ver todos mis clientes',
    'Clientes registrados', 'Directorio de contactos'
  ],

  query_all_debts: [
    // ============ TODAS LAS DEUDAS ============
    'todas las deudas', 'todos los fiados', 'todos los préstamos',
    'todas las obligaciones', 'deudas totales', 'fiados totales',
    'préstamos totales', 'ver todas las deudas', 'mostrar todas las deudas',
    'consultar todas las deudas', 'historial completo de deudas',
    'todas las transacciones', 'movimientos completos', 'registro completo',
    'deudas y pagos completos', 'estado completo de cuentas',
    'balance completo', 'resumen completo de transacciones',
    'todo el historial', 'todos los movimientos', 'todas las cuentas',
    'deudas pendientes totales', 'obligaciones pendientes',
    'todas las relaciones de deuda', 'completo de deudores y acreedores',
    
    // ============ PARA TU APP ============
    'Todas las deudas', 'Ver todas las deudas',
    'Deudas completas', 'Estado completo'
  ],

  clear_debts: [
    // ============ LIMPIAR DEUDAS ============
    'limpiar deudas', 'borrar deudas pagadas', 'eliminar deudas saldadas',
    'quitar deudas canceladas', 'limpiar historial', 'borrar pagos antiguos',
    'eliminar registros pagados', 'limpiar sistema', 'borrar completados',
    'eliminar finalizados', 'limpiar cuentas saldadas', 'borrar cuentas pagadas',
    'eliminar transacciones completadas', 'limpiar base de datos',
    'borrar registros antiguos', 'eliminar historial viejo',
    'limpiar deudas viejas', 'borrar deudas antiguas',
    'eliminar deudas pasadas', 'limpiar todo pagado',
    'borrar todo saldado', 'eliminar todo cancelado',
    'limpiar registros', 'borrar datos', 'eliminar información',
    
    // ============ VARIACIONES ============
    '¿puedo limpiar las deudas?', '¿cómo limpio las deudas?',
    'quiero limpiar las deudas', 'necesito borrar deudas',
    'limpiar todo', 'borrar todo', 'eliminar todo',
    
    // ============ PARA TU APP ============
    'Limpiar deudas pagadas', 'Borrar registros antiguos',
    'Eliminar deudas saldadas'
  ],

  // ============ ✅ NUEVA INTENCIÓN: ESTADÍSTICAS DE NEGOCIO ============
  business_stats: [
    // ============ RESUMEN DE NEGOCIO ============
    'resumen de mi negocio', 'estadísticas de clientes', 
    'estadísticas del negocio', 'métricas del negocio',
    'indicadores financieros', 'dashboard del negocio',
    'panel de control', 'estadísticas', 'métricas',
    'reporte de negocio', 'informe del negocio',
    'análisis del negocio', 'estudio del negocio',
    'datos del negocio', 'cifras del negocio',
    'números del negocio', 'rendimiento del negocio',
    'desempeño del negocio', 'resultados del negocio',
    'balance del negocio', 'estado del negocio',
    'situación del negocio', 'panorama del negocio',
    'visión del negocio', 'perspectiva del negocio',
    
    // ============ ESTADÍSTICAS ESPECÍFICAS ============
    'clientes con más deuda', 'clientes más frecuentes',
    'clientes al día', 'clientes morosos',
    'historial de ventas', 'ventas a crédito',
    'ingresos por cobrar', 'egresos por pagar',
    'flujo de caja', 'movimiento de dinero',
    'transacciones recientes', 'actividad reciente',
    'tendencias', 'proyecciones', 'pronósticos',
    
    // ============ PARA TU APP ============
    'Resumen de mi negocio', 'Ver estadísticas de clientes',
    'Estadísticas del negocio', 'Dashboard financiero',
    'Panel de métricas', 'Reporte de desempeño'
  ]
};

  // Tokenizer simple
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

  // ✅ NUEVO: Normalizar nombre de persona para evitar duplicados
  private normalizePersonName(name: string): string {
    if (!name) return name;

    const lowerName = name.toLowerCase().trim();
    console.log('🔤 Normalizando nombre:', name);

    // Lista de apodos y sus equivalentes formales
    const nicknameMap: { [key: string]: string } = {
      // Apodos comunes
      'pepe': 'josé',
      'pepito': 'josé',
      'chepe': 'josé',
      'chucho': 'jesus',
      'jesus': 'jesús',
      'jesusito': 'jesús',
      'jesusín': 'jesús',
      'jesusin': 'jesús',
      'luisito': 'luis',
      'luisín': 'luis',
      'luisin': 'luis',
      'luisillo': 'luis',
      'luichi': 'luis',
      'willy': 'guillermo',
      'wili': 'guillermo',
      'willi': 'guillermo',
      'memo': 'guillermo',
      'güillermo': 'guillermo',
      'tavo': 'gustavo',
      'gus': 'gustavo',
      'pancho': 'francisco',
      'pacho': 'francisco',
      'fran': 'francisco',
      'paco': 'francisco',
      'curro': 'francisco',
      'cico': 'francisco',
      'quico': 'francisco',
      'kiko': 'francisco',
      'fer': 'fernando',
      'nando': 'fernando',
      'fernandito': 'fernando',
      'beto': 'alberto',
      'alber': 'alberto',
      'bertín': 'alberto',
      'bertin': 'alberto',
      'tony': 'antonio',
      'toño': 'antonio',
      'toñito': 'antonio',
      'tonito': 'antonio',
      'antón': 'antonio',
      'anton': 'antonio',
      'tone': 'antonio',
      'fonso': 'alfonso',
      'poncho': 'alfonso',
      'alfon': 'alfonso',

      // Hombres
      'chus': 'jesus',
      'chuy': 'jesus',

      'chabelo': 'manuel',
      'manu': 'manuel',
      'manolo': 'manuel',
      'manolito': 'manuel',
      'lolo': 'manuel',
      'nel': 'manuel',
      'lito': 'manuel',
      'mané': 'manuel',
      'mane': 'manuel',
      'mel': 'manuel',
      'maño': 'manuel',
      'many': 'manuel',
      'manuél': 'manuel',
      'manué': 'manuel',
      'manuelito': 'manuel',
      'manuelín': 'manuel',
      'manuelin': 'manuel',
      'juancho': 'juan',
      'juanito': 'juan',
      'juancito': 'juan',
      'juanca': 'juan',
      'juanki': 'juan',
      'juanillo': 'juan',
      'juanelo': 'juan',
      'juane': 'juan',
      'juanín': 'juan',
      'juanin': 'juan',
      'pedrito': 'pedro',
      'perico': 'pedro',
      'peter': 'pedro',
      'pedrín': 'pedro',
      'pedrin': 'pedro',
      'periquito': 'pedro',
      'periquín': 'pedro',
      'periquin': 'pedro',
      'carlitos': 'carlos',
      'carlín': 'carlos',
      'carlin': 'carlos',
      'charles': 'carlos',
      'charlie': 'carlos',
      'carlangas': 'carlos',
      'caliche': 'carlos',
      'cali': 'carlos',
      'calín': 'carlos',
      'calin': 'carlos',









      // Mujeres
      'mari': 'maría',
      'maría': 'maria',
      'maru': 'maría',
      'marucha': 'maría',
      'maruchita': 'maría',
      'maruchín': 'maría',
      'maruchin': 'maría',
      'marujita': 'maría',
      'maruja': 'maría',
      'mary': 'maría',
      'marilú': 'maría luisa',
      'marilu': 'maría luisa',
      'mariluz': 'maría luz',
      'mari luz': 'maríluz',
      'mari luisa': 'maría luisa',
      'guada': 'guadalupe',
      'lupe': 'guadalupe',
      'lupita': 'guadalupe',
      'lupis': 'guadalupe',
      'lupilla': 'guadalupe',
      'lupín': 'guadalupe',
      'lupin': 'guadalupe',








      'ana lía': 'ana elena',
      'analia': 'ana elena',
      'anita': 'ana',

      'ana': 'ana maría',

      'anabel': 'ana isabel',
      'anabell': 'ana isabel',
      'anabella': 'ana isabel',
      'ana bella': 'ana isabel',

      'carmen': 'carmen rosa',
      'carmela': 'carmen',
      'carmelita': 'carmen',
      'carmencita': 'carmen',
      'carmencha': 'carmen',
      'carmenchu': 'carmen',
      'carmina': 'carmen',
      'carmín': 'carmen',
      'carmin': 'carmen',

      'rosa': 'rosa maría',
      'rosi': 'rosa',
      'rosita': 'rosa',
      'rosario': 'rosa',
      'rosarito': 'rosa',
      'rosarín': 'rosa',
      'rosarin': 'rosa',

    };

    // Separar el nombre en partes
    const parts = lowerName.split(' ');
    const normalizedParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      // Normalizar apodos
      const normalizedPart = nicknameMap[part] || part;

      // Mantener identificadores informales intactos
      if (i === 0 || !this.detectInformalType(part)) {
        normalizedParts.push(normalizedPart);
      } else {
        normalizedParts.push(part); // Mantener identificadores como están
      }
    }

    const normalized = normalizedParts.join(' ');
    console.log(`🔤 Nombre normalizado: "${name}" → "${normalized}"`);

    return this.capitalizeFullName(normalized);
  }

  // ✅ MEJORADO EXTREMADAMENTE: Extraer nombres manteniendo identificadores COMPLETOS
  extractPerson(text: string): string | null {
    try {
      console.log('👤 Buscando persona en:', text);
      const lowerText = text.toLowerCase();

      // ============ REGLA PRINCIPAL: SI TIENE IDENTIFICADOR INFORMAL, GUARDAR COMPLETO ============

      // Buscar patrones como "José carnicería", "María panadería", etc.
      const words = lowerText.split(/\s+/);
      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = words[i];
        const nextWord = words[i + 1];

        // Si la palabra actual es un nombre común y la siguiente es un identificador informal
        if (this.isCommonFirstName(currentWord)) {
          const informalType = this.detectInformalType(nextWord);

          // ✅ IMPORTANTE: Si es un identificador informal, GUARDAR COMPLETO
          if (informalType) {
            // GUARDAR NOMBRE COMPLETO CON IDENTIFICADOR
            const fullName = `${currentWord} ${nextWord}`;
            console.log(`👤 ✅✅✅ DETECTADO NOMBRE CON IDENTIFICADOR: ${fullName} (tipo: ${informalType})`);
            console.log(`👤 ✅ DECISIÓN: Se guardará COMPLETO como: ${this.capitalizeFullName(fullName)}`);
            const normalized = this.normalizePersonName(fullName);
            console.log(`👤 ✅ NORMALIZADO: ${normalized}`);
            return normalized;
          }
        }
      }

      // ============ PATRONES ESPECÍFICOS DE PAGOS (ALTA PRIORIDAD) ============

      // 1. "Le pagué a José carnicería 3600" - ✅ CORREGIDO CON DETECCIÓN PERFECTA
      const lePaguePattern = /le\s+pag[uú]e\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const lePagueMatch = text.match(lePaguePattern);
      if (lePagueMatch && lePagueMatch[1]) {
        const fullName = lePagueMatch[1].trim();
        console.log('👤 Extraído de "le pagué a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 2. "Le pagó a José carnicería 3500" 
      const lePagoPattern = /le\s+pag[óo]\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const lePagoMatch = text.match(lePagoPattern);
      if (lePagoMatch && lePagoMatch[1]) {
        const fullName = lePagoMatch[1].trim();
        console.log('👤 Extraído de "le pagó a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 3. "Aboné a José carnicería 4000"
      const abonePattern = /abon[ée]\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const aboneMatch = text.match(abonePattern);
      if (aboneMatch && aboneMatch[1]) {
        const fullName = aboneMatch[1].trim();
        console.log('👤 Extraído de "aboné a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 4. "Cancelé a José carnicería 5000"
      const cancelePattern = /cancel[ée]\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const canceleMatch = text.match(cancelePattern);
      if (canceleMatch && canceleMatch[1]) {
        const fullName = canceleMatch[1].trim();
        console.log('👤 Extraído de "cancelé a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 5. "Saldé con José carnicería 6000"
      const saldePattern = /sald[ée]\s+(?:con|a)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const saldeMatch = text.match(saldePattern);
      if (saldeMatch && saldeMatch[1]) {
        const fullName = saldeMatch[1].trim();
        console.log('👤 Extraído de "saldé con":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 6. "Liquidé a José carnicería 7000"
      const liquidePattern = /liquid[ée]\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const liquideMatch = text.match(liquidePattern);
      if (liquideMatch && liquideMatch[1]) {
        const fullName = liquideMatch[1].trim();
        console.log('👤 Extraído de "liquidé a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // ============ PATRONES DE DEUDAS ============

      // 7. "Le debo a José carnicería 6000"
      const leDeboPattern = /le\s+debo\s+a\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const leDeboMatch = text.match(leDeboPattern);
      if (leDeboMatch && leDeboMatch[1]) {
        const fullName = leDeboMatch[1].trim();
        console.log('👤 Extraído de "le debo a":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 8. "Me debe José carnicería 6500"
      const meDebePattern = /me\s+debe\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const meDebeMatch = text.match(meDebePattern);
      if (meDebeMatch && meDebeMatch[1]) {
        const fullName = meDebeMatch[1].trim();
        console.log('👤 Extraído de "me debe":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 9. "José carnicería me debe 6500" (al inicio)
      const inicioMeDebePattern = /^([a-záéíóúñ]+\s+[a-záéíóúñ]+)\s+me\s+debe/i;
      const inicioMeDebeMatch = text.match(inicioMeDebePattern);
      if (inicioMeDebeMatch && inicioMeDebeMatch[1]) {
        const fullName = inicioMeDebeMatch[1].trim();
        console.log('👤 Extraído de inicio "nombre me debe":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 10. "Me fió José carnicería 8000"
      const meFioPattern = /me\s+fi[óo]\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const meFioMatch = text.match(meFioPattern);
      if (meFioMatch && meFioMatch[1]) {
        const fullName = meFioMatch[1].trim();
        console.log('👤 Extraído de "me fió":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 11. "Me prestó José carnicería 9000"
      const mePrestoPattern = /me\s+prest[óo]\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const mePrestoMatch = text.match(mePrestoPattern);
      if (mePrestoMatch && mePrestoMatch[1]) {
        const fullName = mePrestoMatch[1].trim();
        console.log('👤 Extraído de "me prestó":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // ============ PATRONES DE CONSULTAS ============

      // 12. "¿Cuánto me debe José carnicería?"
      const cuantoMeDebePattern = /(?:cu[aá]nto)\s+(?:me\s+)?debe\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const cuantoMeDebeMatch = text.match(cuantoMeDebePattern);
      if (cuantoMeDebeMatch && cuantoMeDebeMatch[1]) {
        const fullName = cuantoMeDebeMatch[1].trim();
        console.log('👤 Extraído de "¿cuánto me debe?":', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // 13. "Historial de pagos de José carnicería"
      const historialPattern = /(?:historial|pagos|último pago|ultimo pago|deuda)\s+(?:de|del)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i;
      const historialMatch = text.match(historialPattern);
      if (historialMatch && historialMatch[1]) {
        const fullName = historialMatch[1].trim();
        console.log('👤 Extraído de consulta histórica:', fullName);
        return this.processNameWithIdentifier(fullName);
      }

      // ============ PATRONES GENERALES ============

      // 14. Patrones de tratamiento + nombre
      const tratamientoPatterns = [
        /(?:al|a el|a la)\s+(?:señor|señora|señorita|don|doña|doctor|doctora|ing|ing\.|ing\.|ing )\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
        /(?:el|la)\s+([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*)/i,
      ];

      for (const pattern of tratamientoPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const fullName = match[1].trim();
          console.log('👤 Patrón de tratamiento encontrado:', fullName);
          return this.processNameWithIdentifier(fullName);
        }
      }

      // ============ FALLBACK: BUSCAR NOMBRE SIMPLE ============

      // Buscar cualquier nombre común en el texto
      for (const word of words) {
        if (this.isCommonFirstName(word) && word.length > 2) {
          console.log(`👤 ✅ Encontrado nombre simple: ${word}`);
          const normalized = this.normalizePersonName(word);
          return normalized;
        }
      }

      // Último recurso: buscar dos palabras que parezcan nombre
      for (let i = 0; i < words.length - 1; i++) {
        const twoWords = words.slice(i, i + 2).join(' ');
        if (this.looksLikeName(twoWords)) {
          console.log(`👤 Parece nombre: ${twoWords}`);
          const normalized = this.normalizePersonName(twoWords);
          return normalized;
        }
      }

      console.log('👤 No se encontró persona en el texto');
      return null;
    } catch (error) {
      console.warn('Error extrayendo persona:', error);
      return null;
    }
  }

  // ✅ NUEVO: Procesar nombre con identificador inteligente - SIEMPRE MANTENER IDENTIFICADOR
  private processNameWithIdentifier(fullName: string): string {
    console.log(`👤 Procesando nombre con identificador: "${fullName}"`);

    const lowerName = fullName.toLowerCase();
    const parts = lowerName.split(' ');

    if (parts.length >= 2) {
      const firstName = parts[0];
      const secondWord = parts[1];

      // ✅ REGLA PRINCIPAL: SI TIENE IDENTIFICADOR INFORMAL, GUARDAR COMPLETO
      const informalType = this.detectInformalType(secondWord);
      if (informalType) {
        console.log(`👤 ✅✅✅ IDENTIFICADOR DETECTADO: "${secondWord}" (${informalType})`);
        console.log(`👤 ✅ DECISIÓN: Mantener nombre COMPLETO con identificador`);
        const normalized = this.normalizePersonName(fullName);
        console.log(`👤 ✅ NORMALIZADO: ${normalized}`);
        return normalized;
      }

      // Si es nombre + apellido común, también completo
      if (this.isCommonFirstName(firstName) && this.isCommonLastName(secondWord)) {
        const normalized = this.normalizePersonName(fullName);
        return normalized;
      }
    }

    // Por defecto, normalizar completo
    const normalized = this.normalizePersonName(fullName);
    console.log(`👤 Nombre normalizado por defecto: ${normalized}`);
    return normalized;
  }

  // ✅ NUEVO: Verificar si parece un nombre
  private looksLikeName(text: string): boolean {
    const words = text.toLowerCase().split(' ');
    if (words.length !== 2) return false;

    return (
      (this.isCommonFirstName(words[0]) || this.isCommonLastName(words[0])) &&
      (this.isCommonFirstName(words[1]) || this.isCommonLastName(words[1]))
    );
  }

  private isCommonLastName(word: string): boolean {
    return this.commonLastNames.includes(word.toLowerCase());
  }

  private detectInformalType(word: string): string | null {
    const lowerWord = word.toLowerCase();
    if (this.informalNamePatterns.business.includes(lowerWord)) return 'business';
    if (this.informalNamePatterns.relationship.includes(lowerWord)) return 'relationship';
    if (this.informalNamePatterns.occupation.includes(lowerWord)) return 'occupation';
    if (this.informalNamePatterns.location.includes(lowerWord)) return 'location';
    return null;
  }

  private isCommonFirstName(word: string): boolean {
    return this.commonFirstNames.includes(word.toLowerCase());
  }

  // ✅ MEJORADO EXTREMADAMENTE: Extraer cantidades con TODOS los formatos
  extractAmount(text: string): number | null {
    try {
      console.log('💰 Buscando cantidad en:', text);
      const normalizedText = this.normalizeAmountText(text);
      console.log('💰 Texto normalizado:', normalizedText);

      // ============ 1. NÚMEROS DIRECTOS CON SÍMBOLOS DE MONEDA ============

      // Patrón para números con puntos, comas, espacios: 118.000, 118,000, 118 000
      const directNumberPatterns = [
        // $118000 (sin separadores)
        /\$?\s*(\d{4,})(?:\s|$|\.|,)/,
        // $118.000, $118,000, $118 000
        /\$?\s*(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{2})?)/,
        // 118.000, 118,000, 118 000 (sin símbolo)
        /(\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d{2})?)(?:\s|$|pesos|dolares)/i,
        // Números con coma como separador de miles: 200,000 o 200000
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+)(?:\s|$|pesos|dolares)/i,
        // Números decimales: 118.50, 118,50
        /(\d+(?:[.,]\d{2}))(?:\s|$)/,
      ];

      for (const pattern of directNumberPatterns) {
        const match = normalizedText.match(pattern);
        if (match && match[1]) {
          console.log('💰 Patrón de número directo encontrado:', match[0]);

          let numberStr = match[1];

          // Manejar separador de miles (coma o punto)
          // Si tiene coma y parece ser miles (más de 3 dígitos después de la coma)
          if (numberStr.includes(',') && /,\d{3}/.test(numberStr)) {
            // Es separador de miles: 200,000 -> 200000
            numberStr = numberStr.replace(/,/g, '');
          }
          // Si tiene punto y parece ser miles (más de 3 dígitos después del punto)
          else if (numberStr.includes('.') && /\.\d{3}/.test(numberStr)) {
            // Es separador de miles: 200.000 -> 200000
            numberStr = numberStr.replace(/\./g, '');
          }
          // Limpiar espacios
          numberStr = numberStr.replace(/\s/g, '');

          // Manejar decimales (si tiene punto o coma al final con 2 dígitos)
          if (/,\d{2}$/.test(numberStr) || /\.\d{2}$/.test(numberStr)) {
            numberStr = numberStr.replace(',', '.');
            const num = parseFloat(numberStr);
            if (!isNaN(num)) {
              console.log('💰 Cantidad con decimales:', num);
              return num;
            }
          }

          const num = parseInt(numberStr, 10);
          if (!isNaN(num) && num > 0) {
            console.log('💰 Número directo procesado:', num);
            return num;
          }
        }
      }

      // ============ 2. NÚMEROS EN PALABRAS ============

      const wordNumbers: { [key: string]: number } = {
        // Unidades
        'uno': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
        'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,

        // Decenas
        'diez': 10, 'veinte': 20, 'treinta': 30, 'cuarenta': 40,
        'cincuenta': 50, 'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,

        // Números especiales
        'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
        'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
        'veintiuno': 21, 'veintidós': 22, 'veintidos': 22, 'veintitrés': 23, 'veintitres': 23,
        'veinticuatro': 24, 'veinticinco': 25, 'veintiséis': 26, 'veintiseis': 26,
        'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,

        // Centenas
        'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
        'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
        'setecientos': 700, 'ochocientos': 800, 'novecientos': 900,

        // Miles
        'mil': 1000, 'dos mil': 2000, 'tres mil': 3000, 'cuatro mil': 4000,
        'cinco mil': 5000, 'seis mil': 6000, 'siete mil': 7000,
        'ocho mil': 8000, 'nueve mil': 9000, 'diez mil': 10000,

        // Decenas de miles
        'veinte mil': 20000, 'treinta mil': 30000, 'cuarenta mil': 40000,
        'cincuenta mil': 50000, 'sesenta mil': 60000, 'setenta mil': 70000,
        'ochenta mil': 80000, 'noventa mil': 90000,

        // Cientos de miles
        'cien mil': 100000, 'ciento diez mil': 110000, 'ciento veinte mil': 120000,
        'ciento treinta mil': 130000, 'ciento cuarenta mil': 140000,
        'ciento cincuenta mil': 150000, 'ciento sesenta mil': 160000,
        'ciento setenta mil': 170000, 'ciento ochenta mil': 180000,
        'ciento noventa mil': 190000,

        // Millones
        'millón': 1000000, 'un millón': 1000000, 'dos millones': 2000000,
        'tres millones': 3000000, 'cinco millones': 5000000, 'diez millones': 10000000,
      };

      // Buscar números en palabras completas
      for (const [word, value] of Object.entries(wordNumbers)) {
        const pattern = new RegExp(`\\b${word}\\b`, 'i');
        if (pattern.test(normalizedText)) {
          console.log('💰 Número en palabras encontrado:', word, '=', value);
          return value;
        }
      }

      // ============ 3. NÚMEROS COMBINADOS ============

      // Patrones como "ciento dieciocho mil"
      const combinedPatterns = [
        // Cientos + decenas/units + mil
        { regex: /(ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos)\s+(\w+)\s+mil/i, multiplier: 1000 },
        // Decenas/units + mil
        { regex: /(\w+)\s+mil/i, multiplier: 1000 },
        // Millones
        { regex: /(\w+)\s+millon(?:es)?/i, multiplier: 1000000 },
      ];

      for (const { regex, multiplier } of combinedPatterns) {
        const match = normalizedText.match(regex);
        if (match) {
          let total = 0;

          if (match[2]) {
            // Formato: "ciento dieciocho mil"
            const hundreds = this.parseHundreds(match[1]);
            const tensUnits = this.parseNumberWord(match[2]) || 0;
            total = (hundreds || 0) + tensUnits;
          } else {
            // Formato: "dieciocho mil"
            total = this.parseNumberWord(match[1]) || 0;
          }

          if (total > 0) {
            const result = total * multiplier;
            console.log('💰 Combinación compleja:', match[0], '=', result);
            return result;
          }
        }
      }

      // ============ 4. EXPRESIONES COLOQUIALES ============

      const slangMap: { [key: string]: number } = {
        // Colombia
        'luca': 1000, 'lucas': 1000, 'paloma': 1000, 'palo': 1000,
        'una luca': 1000, 'dos lucas': 2000, 'tres lucas': 3000,
        'cinco lucas': 5000, 'diez lucas': 10000, 'cien lucas': 100000,

        // México
        'varo': 1, 'varos': 1, // En contexto usualmente se especifica
        'cien varos': 100, 'mil varos': 1000,

        // Argentina
        'mango': 1, 'mangos': 1,
        'cien mangos': 100, 'mil mangos': 1000,

        // General
        'k': 1000, // 5k = 5000
        'mil pesos': 1000, 'diez mil pesos': 10000,
      };

      for (const [slang, value] of Object.entries(slangMap)) {
        const pattern = new RegExp(`(\\d+)\\s*${slang}|${slang}`, 'i');
        const match = normalizedText.match(pattern);
        if (match) {
          if (match[1]) {
            // Formato: "5 lucas"
            const num = parseInt(match[1], 10);
            const result = num * value;
            console.log('💰 Expresión coloquial:', match[0], '=', result);
            return result;
          } else {
            // Solo la expresión: "lucas" (asumimos 1000)
            console.log('💰 Expresión coloquial simple:', slang, '=', value);
            return value;
          }
        }
      }

      console.log('❌ No se encontró cantidad reconocible');
      return null;
    } catch (error) {
      console.warn('Error extrayendo cantidad:', error);
      return null;
    }
  }

  // ✅ NUEVO: Normalizar texto para extracción de cantidades
  private normalizeAmountText(text: string): string {
    let normalized = text.toLowerCase();

    // Reemplazar expresiones regionales
    const replacements: { [key: string]: string } = {
      // Colombia
      'lucas': 'mil',
      'paloma': 'mil',
      'palo': 'mil',
      'varo': 'peso',
      'varos': 'pesos',
      'plata': 'pesos',

      // México
      'lana': 'pesos',
      'feria': 'pesos',
      'morralla': 'centavos',

      // Argentina
      'guita': 'pesos',
      'mango': 'peso',
      'mangos': 'pesos',

      // España
      'pasta': 'euros',
      'parné': 'dinero',
      'calé': 'dinero',

      // General
      'k': 'mil',
      'billón': 'millón',
      'billon': 'millón',
    };

    for (const [from, to] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
    }

    // Normalizar números mixtos
    normalized = normalized.replace(/(\d+)\s*(mil|k|m)/gi, (match, num, unit) => {
      const n = parseInt(num, 10);
      if (unit.toLowerCase().includes('mil') || unit.toLowerCase() === 'k') {
        return `${n * 1000}`;
      } else if (unit.toLowerCase().includes('m')) {
        return `${n * 1000000}`;
      }
      return match;
    });

    return normalized;
  }

  private parseHundreds(word: string): number | null {
    const hundredsMap: { [key: string]: number } = {
      'cien': 100, 'ciento': 100,
      'doscientos': 200, 'trescientos': 300, 'cuatrocientos': 400,
      'quinientos': 500, 'seiscientos': 600, 'setecientos': 700,
      'ochocientos': 800, 'novecientos': 900,
    };
    return hundredsMap[word.toLowerCase()] || null;
  }

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

  private parseNumberWord(word: string): number | null {
    const numberMap: { [key: string]: number } = {
      'un': 1, 'uno': 1, 'una': 1,
      'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
      'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9,

      'diez': 10, 'once': 11, 'doce': 12, 'trece': 13,
      'catorce': 14, 'quince': 15, 'dieciseis': 16, 'dieciséis': 16,
      'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
      'veinte': 20, 'veintiun': 21, 'veintiuno': 21, 'veintiuna': 21,
      'veintidos': 22, 'veintidós': 22, 'veintitres': 23, 'veintitrés': 23,
      'veinticuatro': 24, 'veinticinco': 25, 'veintiseis': 26, 'veintiséis': 26,
      'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
      'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
      'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,

      'cien': 100, 'ciento': 100,
      'doscientos': 200, 'doscientas': 200,
      'trescientos': 300, 'trescientas': 300,
      'cuatrocientos': 400, 'cuatrocientas': 400,
      'quinientos': 500, 'quinientas': 500,
      'seiscientos': 600, 'seiscientas': 600,
      'setecientos': 700, 'setecientas': 700,
      'ochocientos': 800, 'ochocientas': 800,
      'novecientos': 900, 'novecientas': 900,

      'mil': 1000,
      'millon': 1000000, 'millón': 1000000,
    };

    return numberMap[word.toLowerCase()] || null;
  }

  extractDescription(text: string): string | null {
    const patterns = [
      /por\s+(.+?)(?:\s+(?:pesos|d[óo]lares|de|$))/i,
      /para\s+(.+?)(?:\s+(?:pesos|d[óo]lares|de|$))/i,
      /de\s+(.+?)(?:\s+(?:pesos|d[óo]lares|de|$))/i,
      /motivo\s*:\s*(.+?)(?:\s+|$)/i,
      /raz[óo]n\s*:\s*(.+?)(?:\s+|$)/i,
      /concepto\s*:\s*(.+?)(?:\s+|$)/i,
      /por motivo de\s+(.+?)(?:\s+|$)/i,
      /debido a\s+(.+?)(?:\s+|$)/i,
      /a causa de\s+(.+?)(?:\s+|$)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const desc = match[1].trim();
        if (desc.length > 2 && !this.isCommonWord(desc)) {
          return desc;
        }
      }
    }

    return null;
  }

  // ✅ MEJORADO EXTREMADAMENTE: Detectar intención con TODAS las variaciones
  detectIntent(text: string): Intent {
    const lowerText = text.toLowerCase();
    const normalizedText = this.normalizeIntentText(lowerText);
    console.log('🔍 Detectando intención para:', normalizedText);

    // ============ CONSULTAS GENERALES ============

    // 1. "¿Qué personas me deben?" y todas sus variaciones
    if (/(?:qu[ée]\s+personas?\s+me\s+deben?|qui[ée]n\s+me\s+debe|ver\s+qui[ée]n\s+me\s+debe|personas?\s+que\s+me\s+deben?)/i.test(normalizedText)) {
      console.log('✅ Intención: query_owe_me (quién me debe)');
      return 'query_owe_me';
    }

    // 2. "¿A qué personas les debo?" y todas sus variaciones
    if (/(?:a\s+qu[ée]\s+personas?\s+les?\s+debo?|a\s+qui[ée]n\s+le\s+debo|ver\s+a\s+qui[ée]n\s+le\s+debo|personas?\s+a\s+quienes?\s+les?\s+debo)/i.test(normalizedText)) {
      console.log('✅ Intención: query_i_owe (a quién le debo)');
      return 'query_i_owe';
    }

    // 3. "Resumen de mis deudas" y variaciones
    if (/(?:resumen\s+(?:de\s+)?mis?\s+deudas?|balance\s+total|total\s+de\s+deudas?|ver\s+balance)/i.test(normalizedText)) {
      console.log('✅ Intención: show_summary');
      return 'show_summary';
    }

    // 4. "Resumen de mi negocio" y variaciones
    if (/(?:resumen\s+(?:de\s+)?mi\s+negocio|estad[ií]sticas?\s+de\s+clientes?|ver\s+estad[ií]sticas?|balance\s+del\s+negocio)/i.test(normalizedText)) {
      console.log('✅ Intención: query_all_debts o show_summary');
      // Dependiendo de qué quieres mostrar, puedes usar:
      // return 'query_all_debts'; // Para todas las deudas
      return 'show_summary'; // Para balance general
    }

    // 1. "¿A quién le debo?" - TODAS LAS VARIACIONES
    if (/(?:a qu[ií]e?n|qui[ée]nes?)\s+(?:les?|me)?\s*(?:debo|tengo\s+deudas?|tengo\s+pendiente|tengo\s+que pagar|tengo\s+fiado)/i.test(normalizedText)) {
      console.log('✅ Intención: query_i_owe (a quién le debo)');
      return 'query_i_owe';
    }

    // 2. "¿Quién me debe?" - TODAS LAS VARIACIONES
    if (/(?:qui[ée]n|qui[ée]nes?)\s+(?:me\s+)?(?:deben|debe|tiene\s+pendiente|tiene\s+que pagarme|me\s+tiene|me\s+queda\s+debiendo)/i.test(normalizedText)) {
      console.log('✅ Intención: query_owe_me (quién me debe)');
      return 'query_owe_me';
    }

    // 3. "Lista de clientes" - TODAS LAS VARIACIONES
    if (/(?:lista|todos|ver|mostrar|consultar)\s+(?:mis\s+)?(?:clientes|contactos|personas)/i.test(normalizedText)) {
      console.log('✅ Intención: query_client_list');
      return 'query_client_list';
    }

    // 4. "Todas las deudas" - TODAS LAS VARIACIONES
    if (/(?:todas|todos|ver|mostrar|consultar)\s+(?:las\s+)?(?:deudas|obligaciones|pendientes|fiados|prestamos)/i.test(normalizedText)) {
      console.log('✅ Intención: query_all_debts');
      return 'query_all_debts';
    }

    // 5. "Limpiar deudas" - TODAS LAS VARIACIONES
    if (/(?:limpiar|borrar|eliminar|quitar)\s+(?:deudas\s+)?(?:pagadas|canceladas|saldadas|liquidadas)/i.test(normalizedText)) {
      console.log('✅ Intención: clear_debts');
      return 'clear_debts';
    }

    // 5b. "Eliminar cliente" - NUEVO
    if (/(?:elimina|borrar|quitar|eliminar)\s+(?:al\s+)?(?:cliente\s+)?(.+)/i.test(normalizedText) ||
      /(.+)\s+(?:ya\s+)?(?:no\s+)?(?:me\s+)?(?:debe|nada|pendiente)/i.test(normalizedText) ||
      /(.+)\s+(?:está\s+)?(?:cancelado|saldado|pagado|quitado)/i.test(normalizedText)) {
      console.log('✅ Intención: delete_client');
      return 'delete_client';
    }

    if (/(?:resumen\s+(?:de\s+)?mi\s+negocio|estad[ií]sticas?\s+de\s+clientes?|clientes?\s+con\s+deuda|clientes?\s+al\s+d[ií]a|reporte\s+de\s+negocio)/i.test(normalizedText)) {
      console.log('✅ Intención: business_stats');
      return 'business_stats';
    }

    // ============ PAGOS HISTÓRICOS ============

    // 6. Historial de pagos - TODAS LAS VARIACIONES
    if (/(?:historial|registro|lista|todos los)\s+(?:de\s+)?(?:pagos|abonos|cancelaciones)\s+(?:de|del)/i.test(normalizedText) ||
      /(?:cu[aá]nto\s+ha\s+pagado|total\s+pagado|suma\s+de\s+pagos)\s+.+/i.test(normalizedText)) {
      console.log('✅ Intención: query_payment_history');
      return 'query_payment_history';
    }

    // 7. Último pago - TODAS LAS VARIACIONES
    if (/(?:[úu]ltimo|[úu]ltima\s+vez|reciente|recientemente|cu[aá]ndo)\s+(?:pag[óo]|abon[óo]|cancel[óo]|sald[óo]|liquid[óo])/i.test(normalizedText) ||
      /(?:cu[aá]ndo\s+fue\s+el\s+[úu]ltimo|hace\s+cu[aá]nto\s+pag[óo])/i.test(normalizedText)) {
      console.log('✅ Intención: query_last_payment');
      return 'query_last_payment';
    }

    // 8. Deudas vencidas - TODAS LAS VARIACIONES
    if (/(?:deudas\s+vencidas|atrasadas|morosas|en\s+mora|con\s+retraso)/i.test(normalizedText) ||
      /(?:qui[eé]n\s+no\s+ha\s+pagado|qui[eé]n\s+se\s+atras[óo]|qui[eé]n\s+est[aá]\s+atrasado)/i.test(normalizedText)) {
      console.log('✅ Intención: query_overdue_debts');
      return 'query_overdue_debts';
    }

    // ============ ✅ CORREGIDO: DETECCIÓN DE PAGOS PERFECTA ============

    // 9. PAGOS RECIBIDOS - TODAS LAS VARIACIONES POSIBLES
    const pagosRecibidosPatterns = [
      // "Me pagó José 5000"
      /me\s+pag[óo]\s+.+\s+\d+/i,
      // "José me pagó 5000"
      /.+\s+me\s+pag[óo]\s+\d+/i,
      // "Me abonó María 3000"
      /me\s+abon[óo]\s+.+\s+\d+/i,
      // "Me canceló la deuda"
      /me\s+cancel[óo]\s+.+\s+\d+/i,
      // "Me saldó la cuenta"
      /me\s+sald[óo]\s+.+\s+\d+/i,
      // "Me liquidó el préstamo"
      /me\s+liquid[óo]\s+.+\s+\d+/i,
      // "Me dio el dinero"
      /me\s+di[óo]\s+(?:el\s+)?dinero/i,
      // "Me entregó el pago"
      /me\s+entreg[óo]\s+(?:el\s+)?pago/i,
      // "Recibí pago de"
      /recib[ií]\s+pago\s+(?:de|del)/i,
      // "Me pegó" (Colombia)
      /me\s+peg[óo]\s+.+\s+\d+/i,
      // "Me metió" (Colombia)
      /me\s+meti[óo]\s+.+\s+\d+/i,
      // "Me soltó" (Argentina/Colombia)
      /me\s+solt[óo]\s+.+\s+\d+/i,
      // "Me chicleó" (México)
      /me\s+chicle[óo]\s+.+\s+\d+/i,
      // "Me depositó"
      /me\s+deposit[óo]\s+.+\s+\d+/i,
      // "Me transfirió"
      /me\s+transfiri[óo]\s+.+\s+\d+/i,
      // "Me mandó dinero"
      /me\s+mand[óo]\s+dinero/i,
      // "Me envió plata"
      /me\s+envi[óo]\s+plata/i,
    ];

    for (const pattern of pagosRecibidosPatterns) {
      if (pattern.test(normalizedText)) {
        console.log('✅ Intención: add_payment (recibido) - Patrón:', pattern);
        return 'add_payment';
      }
    }

    // 10. PAGOS REALIZADOS - TODAS LAS VARIACIONES POSIBLES
    const pagosRealizadosPatterns = [
      // "Le pagué a José 5000" - ✅ ESTE ES EL CLAVE
      /le\s+pag[uú]e\s+a\s+.+\s+\d+/i,
      // "Pagué a María 3000"
      /pag[uú]e\s+a\s+.+\s+\d+/i,
      // "Le aboné a Carlos"
      /le\s+abon[eé]\s+a\s+.+\s+\d+/i,
      // "Aboné a la cuenta de"
      /abon[eé]\s+a\s+.+\s+\d+/i,
      // "Le cancelé la deuda"
      /le\s+cancel[eé]\s+.+\s+\d+/i,
      // "Cancelé a Juan 4000"
      /cancel[eé]\s+a\s+.+\s+\d+/i,
      // "Le saldé la deuda"
      /le\s+sald[eé]\s+.+\s+\d+/i,
      // "Saldé con Pedro 5000"
      /sald[eé]\s+(?:con|a)\s+.+\s+\d+/i,
      // "Le liquidé el préstamo"
      /le\s+liquid[eé]\s+.+\s+\d+/i,
      // "Liquidé a María 6000"
      /liquid[eé]\s+a\s+.+\s+\d+/i,
      // "Hice un pago a"
      /hice\s+un\s+pago\s+(?:a|para)/i,
      // "Realicé el pago de"
      /realic[eé]\s+(?:el\s+)?pago\s+(?:de|del)/i,
      // "Efectué pago a"
      /efectu[eé]\s+pago\s+(?:a|para)/i,
      // "Deposité a"
      /deposit[eé]\s+a\s+.+\s+\d+/i,
      // "Transferí a"
      /transfer[ií]\s+a\s+.+\s+\d+/i,
      // "Mandé dinero a"
      /mand[eé]\s+dinero\s+a/i,
      // "Envié plata a"
      /envi[eé]\s+plata\s+a/i,
      // "Pegué" (Colombia)
      /peg[uú]e\s+a\s+.+\s+\d+/i,
      // "Metí" (Colombia)
      /met[ií]\s+a\s+.+\s+\d+/i,
      // "Solté" (Argentina/Colombia)
      /solt[eé]\s+a\s+.+\s+\d+/i,
      // "Chicleé" (México)
      /chicle[eé]\s+a\s+.+\s+\d+/i,
    ];

    for (const pattern of pagosRealizadosPatterns) {
      if (pattern.test(normalizedText)) {
        console.log('✅ Intención: add_payment (realizado) - Patrón:', pattern);
        return 'add_payment';
      }
    }

    // ============ DEUDAS ============

    // 11. DEUDAS QUE YO TENGO - TODAS LAS VARIACIONES
    const deudasYoPatterns = [
      // "Le debo a José 5000" - ✅ CLAVE
      /le\s+debo\s+a\s+.+\s+\d+/i,
      // "Yo le debo a María"
      /yo\s+le\s+debo\s+a\s+.+\s+\d+/i,
      // "Debo a Carlos 3000"
      /debo\s+a\s+.+\s+\d+/i,
      // "Tengo que pagarle a"
      /tengo\s+que\s+pagar(?:le)?\s+a\s+.+\s+\d+/i,
      // "Me toca pagar a"
      /me\s+toca\s+pagar\s+(?:a|para)\s+.+\s+\d+/i,
      // "Tengo una deuda con"
      /tengo\s+una\s+deuda\s+con\s+.+\s+\d+/i,
      // "Contraje deuda con"
      /contraje\s+deuda\s+con\s+.+\s+\d+/i,
      // "Me endeudé con"
      /me\s+endeud[eé]\s+con\s+.+\s+\d+/i,
      // "Me fió Juan 5000"
      /me\s+fi[óo]\s+.+\s+\d+/i,
      // "Me prestó dinero"
      /me\s+prest[óo]\s+.+\s+\d+/i,
      // "Me dio fiado"
      /me\s+di[óo]\s+fiado\s+.+\s+\d+/i,
      // "Me dio préstamo"
      /me\s+di[óo]\s+pr[eé]stamo\s+.+\s+\d+/i,
      // "Compré fiado a"
      /compr[eé]\s+fiado\s+a\s+.+\s+\d+/i,
      // "Saqué fiado a"
      /saqu[eé]\s+fiado\s+a\s+.+\s+\d+/i,
      // "Pedí fiado a"
      /ped[ií]\s+fiado\s+a\s+.+\s+\d+/i,
      // "Tomé prestado de"
      /tom[eé]\s+prestado\s+de\s+.+\s+\d+/i,
      // "Me vendió a crédito"
      /me\s+vendi[óo]\s+a\s+cr[eé]dito\s+.+\s+\d+/i,
    ];

    for (const pattern of deudasYoPatterns) {
      if (pattern.test(normalizedText)) {
        console.log('✅ Intención: add_debt (yo debo) - Patrón:', pattern);
        return 'add_debt';
      }
    }

    // 12. DEUDAS QUE ME DEBEN - TODAS LAS VARIACIONES
    const deudasMeDebenPatterns = [
      // "José me debe 5000"
      /.+\s+me\s+debe\s+\d+/i,
      // "Me debe José 3000"
      /me\s+debe\s+.+\s+\d+/i,
      // "Me quedó debiendo"
      /me\s+qued[óo]\s+debiendo\s+.+\s+\d+/i,
      // "Me fió en la tienda"
      /me\s+fi[óo]\s+.+\s+\d+/i,
      // "Me prestó dinero"
      /me\s+prest[óo]\s+.+\s+\d+/i,
      // "Me dio fiado"
      /me\s+di[óo]\s+fiado\s+.+\s+\d+/i,
      // "Tengo que cobrarle a"
      /tengo\s+que\s+cobrar(?:le)?\s+a\s+.+\s+\d+/i,
      // "Me adeuda"
      /me\s+adeuda\s+.+\s+\d+/i,
      // "Me tiene un roto" (Colombia)
      /me\s+tiene\s+un\s+roto\s+.+\s+\d+/i,
      // "Me quedó mal" (Colombia)
      /me\s+qued[óo]\s+mal\s+.+\s+\d+/i,
      // "Le presté a"
      /le\s+prest[eé]\s+a\s+.+\s+\d+/i,
      // "Le di fiado a"
      /le\s+di\s+fiado\s+a\s+.+\s+\d+/i,
      // "Le adelanté a"
      /le\s+adelant[eé]\s+a\s+.+\s+\d+/i,
      // "Le di crédito a"
      /le\s+di\s+cr[eé]dito\s+a\s+.+\s+\d+/i,
    ];

    for (const pattern of deudasMeDebenPatterns) {
      if (pattern.test(normalizedText)) {
        console.log('✅ Intención: add_debt (me deben) - Patrón:', pattern);
        return 'add_debt';
      }
    }

    // ============ CONSULTAS ESPECÍFICAS ============

    // 13. Consulta de deuda específica
    if (/(?:cu[aá]nto|qu[eé])\s+(?:me\s+)?debe\s+.+/i.test(normalizedText) ||
      /(?:cu[aá]nto|qu[eé])\s+(?:le\s+)?debo\s+a\s+.+/i.test(normalizedText) ||
      /(?:consulta|ver|revisar|chequear)\s+(?:la\s+)?deuda\s+(?:de|del)/i.test(normalizedText) ||
      /(?:estado\s+de\s+cuenta|saldo)\s+(?:de|del)/i.test(normalizedText) ||
      /(?:cu[aá]nto\s+es\s+lo\s+que|cu[aá]nto\s+tengo\s+que)\s+(?:pagar|cobrar)\s+a/i.test(normalizedText)) {
      console.log('✅ Intención: query_debt');
      return 'query_debt';
    }

    // ============ CAMBIO CRÍTICO AQUÍ ============
    // 14. Consulta de tiempo - MEJORADO para capturar "Desde cuándo me debe"
    const tiempoPatterns = [
      // "Desde cuándo me debe daniel"
      /(?:desde\s+cu[aá]ndo|hace\s+cu[aá]nto)\s+(?:me\s+debe|le\s+debo)/i,
      // "Desde cuándo daniel me debe" (alternativo)
      /(?:desde\s+cu[aá]ndo|hace\s+cu[aá]nto)\s+.+\s+(?:me\s+debe|le\s+debo)/i,
      // "Cuánto tiempo me debe"
      /(?:cu[aá]nto\s+tiempo)\s+(?:me\s+debe|le\s+debo)/i,
      // "Cuánto tiempo lleva debiendo"
      /(?:cu[aá]nto\s+tiempo)\s+(?:lleva\s+debiendo|tiene\s+debiendo)/i,
      // "Desde cuándo tiene la deuda"
      /(?:desde\s+cu[aá]ndo|hace\s+cu[aá]nto)\s+tiene\s+(?:la\s+)?deuda/i,
      // "Desde cuándo existe la deuda"
      /(?:desde\s+cu[aá]ndo|hace\s+cu[aá]nto)\s+existe\s+(?:la\s+)?deuda/i,
      // "Desde cuándo me debe [nombre]" (patrón específico para tu caso)
      /desde\s+cu[aá]ndo\s+(?:me\s+)?debe\s+.+/i,
      // "Hace cuánto me debe [nombre]" (patrón específico para tu caso)
      /hace\s+cu[aá]nto\s+(?:me\s+)?debe\s+.+/i
    ];

    for (const pattern of tiempoPatterns) {
      if (pattern.test(normalizedText)) {
        console.log('✅ Intención: query_debt (tiempo) - Patrón:', pattern);
        return 'query_debt';
      }
    }
    // ============ FIN DEL CAMBIO ============

    // ============ RESUMEN ============

    // 15. Resumen general
    if (/(?:resumen|balance|total\s+general|estado\s+general)/i.test(normalizedText) ||
      /(?:cu[aá]nto\s+debo\s+en\s+total|cu[aá]nto\s+me\s+deben\s+en\s+total)/i.test(normalizedText) ||
      /(?:situaci[óo]n\s+financiera|finanzas|panorama)/i.test(normalizedText) ||
      /(?:todo\s+junto|suma\s+de\s+todo|todo\s+sumado)/i.test(normalizedText)) {
      console.log('✅ Intención: show_summary');
      return 'show_summary';
    }

    // ============ CREAR CLIENTE ============

    // 16. Crear cliente nuevo
    if (/(?:cliente\s+nuevo|nuevo\s+cliente|registrar\s+cliente|agregar\s+cliente)/i.test(normalizedText) ||
      /(?:añadir|crear|ingresar)\s+(?:cliente|contacto|persona)/i.test(normalizedText) ||
      /(?:dar\s+de\s+alta|alta\s+de|nuevo\s+registro)/i.test(normalizedText)) {
      console.log('✅ Intención: create_client');
      return 'create_client';
    }

    // ============ DETECCIÓN POR PALABRAS CLAVE ============

    // Buscar por palabras clave específicas
    const keywordMap: { [key: string]: Intent } = {
      // Deudas
      'deuda': 'add_debt',
      'debo': 'add_debt',
      'debe': 'add_debt',
      'prestamo': 'add_debt',
      'préstamo': 'add_debt',
      'fiado': 'add_debt',
      'fiar': 'add_debt',
      'fio': 'add_debt',
      'fió': 'add_debt',

      'adeudar': 'add_debt',
      'adeudo': 'add_debt',
      'pendiente': 'add_debt',
      'endeude': 'add_debt',
      'contraje': 'add_debt',
      'prestar': 'add_debt',
      'prestó': 'add_debt',
      'presto': 'add_debt',

      // Pagos
      'pago': 'add_payment',
      'pagó': 'add_payment',
      'pagué': 'add_payment',
      'pague': 'add_payment',
      'abone': 'add_payment',
      'pagado': 'add_payment',
      'abono': 'add_payment',
      'abonó': 'add_payment',
      'cancelé': 'add_payment',
      'canceló': 'add_payment',
      'cancelar': 'add_payment',
      'saldó': 'add_payment',
      'saldo': 'add_payment',
      'liquidó': 'add_payment',
      'liquidar': 'add_payment',
      'pego': 'add_payment',
      'pegó': 'add_payment',
      'metio': 'add_payment',
      'metió': 'add_payment',
      'suelto': 'add_payment',
      'soltó': 'add_payment',
      'chicleo': 'add_payment',
      'chicleó': 'add_payment',

      // Consultas
      'cuánto': 'query_debt',
      'cuanto': 'query_debt',
      'consulta': 'query_debt',
      'ver': 'query_debt',
      'revisar': 'query_debt',
      'chequear': 'query_debt',
      'información': 'query_debt',
      'informacion': 'query_debt',
      'estado': 'query_debt',
      'historial': 'query_payment_history',
      'último': 'query_last_payment',
      'ultimo': 'query_last_payment',
      'vencida': 'query_overdue_debts',
      'atrasada': 'query_overdue_debts',
      'morosa': 'query_overdue_debts',

      // Resumen
      'resumen': 'show_summary',
      'balance': 'show_summary',
      'total': 'show_summary',
      'suma': 'show_summary',
      'general': 'show_summary',
      'financiero': 'show_summary',
      'situación': 'show_summary',
      'situacion': 'show_summary',

      // Clientes
      'cliente': 'create_client',
      'registrar': 'create_client',
      'agregar': 'create_client',
      'añadir': 'create_client',
      'crear': 'create_client',
      'ingresar': 'create_client',
      'nuevo': 'create_client',
      'contacto': 'create_client',
    };

    const words = normalizedText.split(/\s+/);
    for (const word of words) {
      if (keywordMap[word]) {
        console.log(`✅ Intención por palabra clave "${word}": ${keywordMap[word]}`);
        return keywordMap[word];
      }
    }

    console.log('❌ Intención no reconocida');
    return 'unknown';
  }

  // ✅ NUEVO: Normalizar texto para detección de intención
  private normalizeIntentText(text: string): string {
    let normalized = text.toLowerCase();

    // Normalizar verbos de pago
    const verbosPago = {
      'pague': 'pagué',
      'pago': 'pagó',
      'pegue': 'pegué',
      'pego': 'pegó',
      'meti': 'metí',
      'metio': 'metió',
      'suelto': 'solté',

      'abone': 'aboné',
      'abono': 'abonó',
      'cancele': 'cancelé',
      'cancelo': 'canceló',
      'salde': 'saldé',
      'saldo': 'saldó',
      'liquide': 'liquidé',
      'liquido': 'liquidó',
    };

    for (const [incorrecto, correcto] of Object.entries(verbosPago)) {
      normalized = normalized.replace(new RegExp(`\\b${incorrecto}\\b`, 'g'), correcto);
    }

    // Normalizar expresiones de deuda
    const expresionesDeuda = {
      'fio': 'fió',
      'presto': 'prestó',
      'adeudo': 'adeudó',
      'fiado': 'fió',
      'quedo debiendo': 'quedó debiendo',
      'me debe': 'debe',
      'le debo': 'debo',
    };

    for (const [incorrecto, correcto] of Object.entries(expresionesDeuda)) {
      normalized = normalized.replace(new RegExp(`\\b${incorrecto}\\b`, 'g'), correcto);
    }

    return normalized;
  }

  // ✅ MEJORADO: Aplicar correcciones de lenguaje natural
  private applyBasicCorrections(text: string): string {
    const corrections: { [key: string]: string } = {
      // Números escritos
      'quinientos mil': '500000',
      'seiscientos mil': '600000',
      'setecientos mil': '700000',
      'ochocientos mil': '800000',
      'novecientos mil': '900000',
      'un millón': '1000000',
      'dos millones': '2000000',
      'tres millones': '3000000',
      'cinco millones': '5000000',
      'diez millones': '10000000',

      // Monedas y slang
      'dólares': 'pesos',
      'dolares': 'pesos',
      'dollar': 'pesos',
      'dólar': 'pesos',
      'euros': 'pesos',
      'usd': 'pesos',
      'cop': 'pesos',
      'luca': 'mil pesos',
      'lucas': 'mil pesos',
      'paloma': 'mil pesos',
      'palo': 'mil pesos',
      'varos': 'pesos',
      'varo': 'pesos',
      'plata': 'pesos',
      'billete': 'pesos',
      'dinero': 'pesos',
      'lana': 'pesos',
      'feria': 'pesos',
      'guita': 'pesos',
      'mango': 'pesos',
      'mangos': 'pesos',
      'pasta': 'pesos',
      'parné': 'pesos',
      'calé': 'pesos',

      // Correcciones comunes
      'güiro': 'pesos',
      'güira': 'pesos',

      'chivo': 'pesos',

      'real': 'pesos',
      'roto': 'deuda',

    };

    let corrected = text.toLowerCase();

    // Aplicar correcciones
    for (const [wrong, correct] of Object.entries(corrections)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), correct);
    }

    // Correcciones de conjugaciones verbales
    corrected = corrected.replace(/pag[oóuú]e/g, 'pagó');
    corrected = corrected.replace(/abon[oóeé]/g, 'abonó');
    corrected = corrected.replace(/cancel[oóeé]/g, 'canceló');
    corrected = corrected.replace(/sald[oóeé]/g, 'saldó');
    corrected = corrected.replace(/liquid[oóeé]/g, 'liquidó');
    corrected = corrected.replace(/met[ií]o/g, 'metió');
    corrected = corrected.replace(/peg[oóuú]e/g, 'pegó');
    corrected = corrected.replace(/solt[oóeé]/g, 'soltó');
    corrected = corrected.replace(/chicle[oóeé]/g, 'chicleó');

    return corrected;
  }

  // ✅ NUEVO: Generar clave única para persona
  private generatePersonKey(name: string): string {
    if (!name) return '';

    const lowerName = name.toLowerCase();
    const parts = lowerName.split(' ');

    // Tomar el primer nombre y el primer apellido/identificador
    if (parts.length >= 2) {
      return `${parts[0]}_${parts[1]}`;
    }

    return parts[0] || '';
  }

  // Procesar comando completo
  parseCommand(text: string): ParsedCommand {
    const cacheKey = text.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let processedText = this.applyBasicCorrections(text);
    console.log('🔍 Texto procesado:', processedText);

    const language = this.detectLanguage(processedText);
    const intent = this.detectIntent(processedText);
    let person = this.extractPerson(processedText);
    const amount = this.extractAmount(processedText);
    const description = this.extractDescription(processedText);

    console.log('🔍 NLP Resultado:', { intent, person, amount, description, language });

    // Enriquecer información del nombre
    let informalInfo = {};
    let normalizedName = person || '';
    let personKey = '';

    if (person) {
      normalizedName = this.normalizePersonName(person);
      personKey = this.generatePersonKey(normalizedName);

      const lowerPerson = normalizedName.toLowerCase();
      const parts = lowerPerson.split(' ');

      if (parts.length >= 2) {
        const identifier = parts[1];
        const informalType = this.detectInformalType(identifier);

        if (informalType) {
          informalInfo = {
            fullName: normalizedName,
            informalIdentifier: identifier,
            informalType: informalType,
            keepFullIdentifier: true,
            isBusiness: informalType === 'business',
            isOccupation: informalType === 'occupation',
            isLocation: informalType === 'location',
            normalizedName: normalizedName,
            personKey: personKey,
          };

          console.log(`👤 ✅ Enriquecido: ${normalizedName} (tipo: ${informalType}, key: ${personKey})`);
        }
      }
    }

    // Forzar person = null para consultas generales
    if (intent === 'query_i_owe' || intent === 'query_owe_me' ||
      intent === 'query_client_list' || intent === 'query_all_debts' ||
      intent === 'query_overdue_debts' || intent === 'clear_debts') {
      person = null;
      informalInfo = {};
      normalizedName = '';
      personKey = '';
    }

    // Calcular confianza
    let confidence = 0.3;
    if (person) confidence += 0.3;
    if (amount) confidence += 0.25;
    if (intent !== 'unknown') confidence += 0.2;
    if (language === 'es') confidence += 0.1;
    if (description) confidence += 0.1;
    if (Object.keys(informalInfo).length > 0) confidence += 0.1;

    const result: ParsedCommand = {
      intent,
      entities: {
        person: person || undefined,
        amount: amount || undefined,
        description: description || undefined,
        date: new Date(),
        ...informalInfo,
        normalizedName: normalizedName || undefined,
        personKey: personKey || undefined,
      },
      confidence: Math.min(confidence, 1.0),
      rawText: text,
      language,
      normalizedText: processedText,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      // Artículos y preposiciones
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'de', 'a', 'en', 'por', 'para', 'con', 'sin', 'sobre',
      'bajo', 'entre', 'hacia', 'desde', 'hasta', 'ante', 'bajo',
      'contra', 'durante', 'mediante', 'según', 'versus', 'vía',

      // Conjunciones
      'y', 'o', 'pero', 'mas', 'aunque', 'sino', 'porque',
      'pues', 'que', 'si', 'como', 'cuando', 'donde',

      // Pronombres
      'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'lo', 'la',
      'los', 'las', 'mi', 'tu', 'su', 'nuestro', 'vuestro',
      'este', 'ese', 'aquel', 'esto', 'eso', 'aquello',

      // Verbos comunes
      'es', 'son', 'era', 'fueron', 'ser', 'estar', 'tener',
      'haber', 'hacer', 'poder', 'querer', 'saber', 'decir',
      'ir', 'ver', 'dar', 'venir', 'salir', 'volver',

      // Palabras de deudas
      'pesos', 'dólares', 'dolares', 'dinero', 'pago', 'deuda', 'cliente',
      'material', 'trabajo', 'servicio', 'producto', 'factura',
      'recibo', 'cuenta', 'saldo', 'total', 'resumen', 'mil',
      'ciento', 'cientos', 'miles', 'mucho', 'poco', 'algo',
      'todo', 'nada', 'mismo', 'propio', 'cierto', 'varios',
    ];

    const lowerWord = word.toLowerCase();
    return commonWords.includes(lowerWord) ||
      this.intentKeywords.add_debt.some(k => lowerWord.includes(k)) ||
      this.intentKeywords.add_payment.some(k => lowerWord.includes(k));
  }

  // ✅ MEJORADO: Generar respuestas más naturales
  generateResponse(parsed: ParsedCommand, data?: any): string {
    const { intent, entities } = parsed;

    switch (intent) {
      case 'query_i_owe':
        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            return '🎉 ¡Excelente! No le debes a nadie. Estás libre de deudas.';
          }
          const list = data.map((d: any) =>
            `${d.person}: ${formatCurrency(d.amount)}${d.description ? ` (${d.description})` : ''}`
          ).join(', ');
          return `📋 Tienes deudas con ${data.length} persona${data.length > 1 ? 's' : ''}: ${list}.`;
        }
        return '📋 Aquí tienes la lista de personas a las que les debes.';

      case 'query_owe_me':
        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            return '📭 Por ahora nadie te debe dinero. ¡Todo al día!';
          }
          const list = data.map((d: any) =>
            `${d.person}: ${formatCurrency(d.amount)}${d.description ? ` (${d.description})` : ''}`
          ).join(', ');
          return `💰 Hay ${data.length} persona${data.length > 1 ? 's' : ''} que te deben: ${list}.`;
        }
        return '💰 Aquí tienes la lista de personas que te deben.';

      case 'query_client_list':
        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            return '📋 Aún no tienes clientes registrados. Agrega uno con "cliente nuevo [nombre]".';
          }
          const clientNames = data.map((c: any) => c.name).join(', ');
          return `📋 Tienes ${data.length} cliente${data.length > 1 ? 's' : ''} registrado${data.length > 1 ? 's' : ''}: ${clientNames}.`;
        }
        return '📋 Aquí tienes tu lista de clientes.';

      case 'query_all_debts':
        if (data) {
          const { owing = [], owed = [] } = data;
          const totalOwing = owing.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
          const totalOwed = owed.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
          const net = totalOwed - totalOwing;

          let netMessage = '';
          if (net > 0) {
            netMessage = `Te deben ${formatCurrency(net)} más de lo que tú debes.`;
          } else if (net < 0) {
            netMessage = `Debes ${formatCurrency(-net)} más de lo que te deben.`;
          } else {
            netMessage = 'Estás equilibrado.';
          }

          return `📊 Estado completo: Tú debes ${formatCurrency(totalOwing)} a ${owing.length} persona${owing.length > 1 ? 's' : ''}. Te deben ${formatCurrency(totalOwed)} de ${owed.length} persona${owed.length > 1 ? 's' : ''}. ${netMessage}`;
        }
        return '📊 Aquí tienes el listado completo de todas las deudas.';

      case 'clear_debts':
        if (data && data.cleared > 0) {
          return `🧹 Perfecto. Limpié ${data.cleared} deuda${data.cleared > 1 ? 's' : ''} que ya estaban pagadas.`;
        }
        return '✅ No había deudas pagadas para limpiar. Todo está en orden.';

      case 'add_debt':
        if (entities.person && entities.amount) {
          const rawText = parsed.rawText.toLowerCase();
          const isOwing = rawText.includes('le debo') ||
            rawText.includes('debo a') ||
            rawText.includes('yo le debo') ||
            rawText.includes('tengo que pagar');

          const date = new Date();
          const formattedDate = date.toLocaleDateString('es-ES');

          if (isOwing) {
            return `✅ Anotado el ${formattedDate}: Le debes ${formatCurrency(entities.amount)} a ${entities.person}${entities.description ? ` por "${entities.description}"` : ''}.`;
          } else {
            return `✅ Registrado el ${formattedDate}: ${entities.person} te debe ${formatCurrency(entities.amount)}${entities.description ? ` por "${entities.description}"` : ''}.`;
          }
        }
        return '¿Quién y cuánto? Por ejemplo: "María me debe 5000" o "Le debo a Juan 3000".';

      case 'add_payment':
        if (entities.person && entities.amount) {
          const rawText = parsed.rawText.toLowerCase();
          const isMyPayment = rawText.includes('le pagué') ||
            rawText.includes('pagué a') ||
            rawText.includes('le aboné') ||
            rawText.includes('aboné a') ||
            rawText.includes('cancelé') ||
            rawText.includes('saldé') ||
            rawText.includes('liquidé') ||
            rawText.includes('pegué') ||
            rawText.includes('metí') ||
            rawText.includes('solté') ||
            rawText.includes('chicleé');

          const date = new Date();
          const formattedDate = date.toLocaleDateString('es-ES');

          if (isMyPayment) {
            return `✅ Registrado el ${formattedDate}: Pagaste ${formatCurrency(entities.amount)} a ${entities.person}.`;
          } else {
            return `✅ Anotado el ${formattedDate}: ${entities.person} te pagó ${formatCurrency(entities.amount)}.`;
          }
        }
        return '¿Quién pagó cuánto? Por ejemplo: "Juan me pagó 5000" o "Le pagué a María 3000".';

      case 'query_debt':
        if (entities.person) {
          if (data?.amount) {
            if (data?.hasTimeQuery && data.formattedOldestDate) {
              return `${entities.person} te debe ${formatCurrency(data.amount)} desde el ${data.formattedOldestDate} (hace ${data.daysSinceOldestDebt} días).`;
            }
            return `${entities.person} tiene una deuda de ${formatCurrency(data.amount)}${data.description ? ` por "${data.description}"` : ''}.`;
          }
          return `${entities.person} no tiene deudas pendientes contigo.`;
        }
        if (data && Array.isArray(data)) {
          if (data.length === 0) {
            return 'No tienes deudas pendientes con nadie. ¡Muy bien!';
          }
          const list = data.map((d: any) => `${d.person}: ${formatCurrency(d.amount)}`).join(', ');
          return `📋 Tienes ${data.length} deuda${data.length > 1 ? 's' : ''} pendiente${data.length > 1 ? 's' : ''}: ${list}.`;
        }
        return '¿De quién quieres consultar la deuda?';

      case 'business_stats':
        if (data) {
          const {
            totalClients = 0,
            clientsWithDebt = 0,
            totalDebt = 0,
            totalCredit = 0,
            recentActivity = 0
          } = data;

          return `📊 **Resumen de tu negocio**:
• Clientes totales: ${totalClients}
• Clientes con deuda: ${clientsWithDebt}
• Total a cobrar: ${formatCurrency(totalDebt)}
• Total a pagar: ${formatCurrency(totalCredit)}
• Saldo neto: ${formatCurrency(totalDebt - totalCredit)}
• Actividad reciente (7 días): ${recentActivity} movimientos`;
        }
        return '📊 Aquí tienes el resumen estadístico de tu negocio.';

case 'show_summary':
  console.log('📊 Data recibida en show_summary:', {
    keys: Object.keys(data || {}),
    owingCount: data?.owing?.length || 0,
    owedCount: data?.owed?.length || 0,
    totalOwing: data?.totalOwing,
    totalOwed: data?.totalOwed
  });
  
  try {
    // Extraer datos de manera segura
    const owingList = Array.isArray(data?.owing) ? data.owing : [];
    const owedList = Array.isArray(data?.owed) ? data.owed : [];
    
    const totalOwing = data?.totalOwing || owingList.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const totalOwed = data?.totalOwed || owedList.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
    const net = totalOwed - totalOwing;
    
    console.log('📊 Procesado:', {
      totalOwing,
      totalOwed,
      net,
      owingCount: owingList.length,
      owedCount: owedList.length
    });
    
    // ============ VERSIÓN SIMPLIFICADA Y CLARA ============
    
    // 1. INTRODUCCIÓN BREVE
    let response = `Resumen de deudas. `;
    
    // 2. SALDO NETO PRIMERO (lo más importante)
    if (net > 0) {
      response += `Tienes un saldo a favor de ${formatCurrency(net)}. `;
    } else if (net < 0) {
      response += `Tienes un saldo en contra de ${formatCurrency(-net)}. `;
    } else {
      response += `Estás en equilibrio. `;
    }
    
    // 3. RESUMEN DE LO QUE TE DEBEN
    if (owedList.length > 0) {
      response += `Te deben ${formatCurrency(totalOwed)}. `;
      
      // Solo mencionar las 2 principales deudas si son significativas
      if (owedList.length > 0) {
        const topDebts = [...owedList]
          .sort((a: any, b: any) => (b.amount || 0) - (a.amount || 0))
          .slice(0, 2)
          .filter((d: any) => (d.amount || 0) > 10000); // Solo mencionar si son mayores a 10,000
        
        if (topDebts.length > 0) {
          response += `Las mayores deudas son: `;
          topDebts.forEach((debt: any, index: number) => {
            if (index > 0) response += ` y `;
            response += `${debt.person} con ${formatCurrency(debt.amount || 0)}`;
          });
          response += `. `;
        }
      }
    } else {
      response += `Nadie te debe dinero. `;
    }
    
    // 4. RESUMEN DE LO QUE TÚ DEBES
    if (owingList.length > 0) {
      response += `Tú debes ${formatCurrency(totalOwing)}. `;
      
      // Solo mencionar las deudas grandes
      const significantDebts = owingList.filter((d: any) => (d.amount || 0) > 10000);
      if (significantDebts.length > 0) {
        response += `Principalmente a `;
        significantDebts.forEach((debt: any, index: number) => {
          if (index > 0) response += ` y `;
          response += `${debt.person}`;
        });
        response += `. `;
      }
    } else {
      response += `No le debes a nadie. `;
    }
    
    // 5. RESUMEN FINAL
    response += `En total, ${owedList.length} persona${owedList.length !== 1 ? 's' : ''} te debe y tú le debes a ${owingList.length} persona${owingList.length !== 1 ? 's' : ''}. `;
    
    // 6. CONCLUSIÓN
    if (net > 50000) {
      response += `Tu situación financiera es muy favorable.`;
    } else if (net > 0) {
      response += `Vas bien.`;
    } else if (net < -50000) {
      response += `Recomiendo revisar tus deudas pendientes.`;
    } else if (net < 0) {
      response += `Procura mantener el equilibrio.`;
    } else {
      response += `Todo está en orden.`;
    }
    
    // 7. VERSIÓN ALTERNATIVA MÁS CORTA (opcional)
    // Si prefieres algo aún más corto:
    /*
    let shortResponse = `Resumen: `;
    shortResponse += `Te deben ${formatCurrency(totalOwed)} y tú debes ${formatCurrency(totalOwing)}. `;
    shortResponse += net > 0 ? `Saldo a favor: ${formatCurrency(net)}.` : 
                    net < 0 ? `Saldo en contra: ${formatCurrency(-net)}.` : 
                    `En equilibrio.`;
    return shortResponse;
    */
    
    return response;
    
  } catch (error) {
    console.error('❌ Error en show_summary:', error);
    return 'Lo siento, hubo un error obteniendo el resumen. Por favor intenta de nuevo.';
  }

      case 'create_client':
        if (entities.person) {
          const date = new Date().toLocaleDateString('es-ES');
          return `✅ Cliente agregado el ${date}: ${entities.person}. Ahora puedes registrar deudas y pagos con esta persona.`;
        }
        return '¿Cómo se llama el nuevo cliente? Por ejemplo: "cliente nuevo Juan Pérez".';

      case 'query_payment_history':
        if (entities.person) {
          if (data?.hasPayments) {
            if (data.totalPayments === 1) {
              const payment = data.recentPayments?.[0] || data.lastPayment;
              if (payment) {
                const date = payment.formattedDate || payment.date || 'fecha desconocida';
                const amount = formatCurrency(payment.amount || 0);
                return `📅 ${entities.person} te ha pagado una vez: ${amount} el ${date}.`;
              }
            }

            const lastPayment = data.lastPayment || {};
            const lastAmount = lastPayment.amount || 0;
            const lastDate = lastPayment.formattedDate || lastPayment.date || 'fecha desconocida';
            const daysSince = data.daysSinceLastPayment || 'varios';

            return `📅 Historial de ${entities.person}: ${data.totalPayments} pago${data.totalPayments > 1 ? 's' : ''} por un total de ${formatCurrency(data.totalAmount || 0)}. El último pago fue de ${formatCurrency(lastAmount)} el ${lastDate} (hace ${daysSince} días).`;
          }
          return `${entities.person} no tiene pagos registrados aún.`;
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

            return `📅 ${entities.person} te pagó por última vez ${timeDesc} (${date}): ${amount}${desc}.`;
          }
          return `${entities.person} aún no te ha realizado ningún pago.`;
        }
        return '¿De quién quieres saber el último pago?';

      case 'query_overdue_debts':
        if (data?.count && data.count > 0) {
          const totalAmount = data.totalAmount || 0;

          if (data.formattedDebts && Array.isArray(data.formattedDebts)) {
            if (data.count === 1) {
              const debt = data.formattedDebts[0];
              const person = debt?.person || 'Alguien';
              const amount = formatCurrency(debt?.amount || 0);
              const date = debt?.formattedDate || 'alguna fecha';
              const daysOverdue = debt?.daysOverdue || 'varios';

              return `⚠️ ATENCIÓN: ${person} debe ${amount} desde ${date} (${daysOverdue} días de retraso).`;
            }

            const validDebts = data.formattedDebts.filter((debt: any) => debt && typeof debt === 'object');
            if (validDebts.length > 0) {
              const sortedDebts = [...validDebts].sort((a: any, b: any) => (b?.daysOverdue || 0) - (a?.daysOverdue || 0));
              const topDebt = sortedDebts[0];
              const person = topDebt?.person || 'Alguien';
              const daysOverdue = topDebt?.daysOverdue || 'varios';

              return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}. La más antigua es ${person} con ${daysOverdue} días de retraso.`;
            }
          }
          return `⚠️ Hay ${data.count} deuda${data.count > 1 ? 's' : ''} vencida${data.count > 1 ? 's' : ''} por ${formatCurrency(totalAmount)}.`;
        }
        return '✅ ¡Todo al día! No hay deudas vencidas.';

      default:
        return `No entendí completamente. Prueba con:\n• "Juan me debe 5000"\n• "Le pagué a María 3000"\n• "¿Cuánto me debe Pedro?"\n• "Resumen de deudas"\n• "Me fió José 8000"\n• "Aboné a Carlos 4000"`;
    }
  }
}

export const nlpService = new NLPService();