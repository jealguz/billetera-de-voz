export const formatCurrency = (amount: number | undefined | null): string => {
  // Si no hay cantidad o no es un número válido
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 pesos';
  }
  
  try {
    // Formatear como pesos colombianos
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    
    return `${formatted} pesos`;
    
  } catch (error) {
    console.warn('Error formateando moneda, usando formato simple:', amount);
    // Formato simple como fallback
    return `${amount.toLocaleString('es-CO')} pesos`;
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(date).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  
  return `Hace ${Math.floor(diffDays / 365)} años`;
};

export const formatVoiceResponse = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

