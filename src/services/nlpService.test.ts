import { nlpService } from './nlpService';

// Mock franc to avoid ESM issues
jest.mock('franc', () => jest.fn((text: string) => text.includes('Hola') ? 'spa' : 'eng'));

describe('NLPService', () => {
  beforeEach(() => {
    // Mock detectLanguage
    nlpService.detectLanguage = jest.fn(() => 'es');
  });
  test('extracts person from text', () => {
    expect(nlpService.extractPerson('Juan me debe 1000 pesos')).toBe('Juan');
    expect(nlpService.extractPerson('María García me debe 500')).toBe('María García');
    expect(nlpService.extractPerson('Camilo Arango me debe $3000')).toBe('Camilo Arango');
  });

  test('extracts amount from text', () => {
    expect(nlpService.extractAmount('me debe 2000 pesos')).toBe(2000);
    expect(nlpService.extractAmount('paga 500')).toBe(500);
    expect(nlpService.extractAmount('jose me debe 500 mil pesos')).toBe(500000);
    expect(nlpService.extractAmount('cinco millones')).toBe(5000000);
    expect(nlpService.extractAmount('Camilo Arango me debe $3000')).toBe(3000);
  });

  test('detects intent correctly', () => {
    expect(nlpService.detectIntent('Juan me debe 1000')).toBe('add_debt');
    expect(nlpService.detectIntent('cuánto me debe Juan')).toBe('query_debt');
    expect(nlpService.detectIntent('a qué personas les debo')).toBe('query_debt');
    expect(nlpService.detectIntent('resumen')).toBe('show_summary');
  });

  test('parses command correctly', () => {
    const result = nlpService.parseCommand('Juan me debe 1000 pesos');
    expect(result.intent).toBe('add_debt');
    expect(result.entities.person).toBe('Juan');
    expect(result.entities.amount).toBe(1000);

    const result2 = nlpService.parseCommand('Camilo Arango me debe $3000');
    expect(result2.intent).toBe('add_debt');
    expect(result2.entities.person).toBe('Camilo Arango');
    expect(result2.entities.amount).toBe(3000);

    const result3 = nlpService.parseCommand('yo le debo a Miguel Bejarano 10 000 pesos');
    expect(result3.intent).toBe('add_debt');
    expect(result3.entities.person).toBe('Miguel Bejarano');
    expect(result3.entities.amount).toBe(10000);

    const result4 = nlpService.parseCommand('le abono a Daniel Jiménez 20 000 pesos');
    expect(result4.intent).toBe('add_payment');
    expect(result4.entities.person).toBe('Daniel Jiménez');
    expect(result4.entities.amount).toBe(20000);

    const result5 = nlpService.parseCommand('Le debo a Yeison Guzmán 56000');
    expect(result5.intent).toBe('add_debt');
    expect(result5.entities.person).toBe('Yeison Guzmán');
    expect(result5.entities.amount).toBe(56000);

    const result6 = nlpService.parseCommand('A josé hernández le debo 20000');
    expect(result6.intent).toBe('add_debt');
    expect(result6.entities.person).toBe('José Hernández');
    expect(result6.entities.amount).toBe(20000);

    const result7 = nlpService.parseCommand('A la señora maría garcía le debo 15000');
    expect(result7.intent).toBe('add_debt');
    expect(result7.entities.person).toBe('María García');
    expect(result7.entities.amount).toBe(15000);

    const result8 = nlpService.parseCommand('Al doctor Juan Pérez le abono 25000');
    expect(result8.intent).toBe('add_payment');
    expect(result8.entities.person).toBe('Juan Pérez');
    expect(result8.entities.amount).toBe(25000);
  });
});