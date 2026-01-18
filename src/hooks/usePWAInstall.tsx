import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Función para detectar si está instalado
  const checkIfInstalled = () => {
    // Método 1: Modo standalone (iOS/Safari)
    const isInStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;

    // Método 2: Media query display-mode (Chrome/Android)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;

    // Método 3: Verificar si está en un navegador móvil y no tiene barra de direcciones
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasMinimalUI = window.innerHeight >= window.screen.height - 100 && window.innerWidth >= window.screen.width - 100;

    const installed = isInStandalone || isInStandaloneMode || (isMobile && hasMinimalUI);

    console.log('🔍 PWA Install Check:', {
      isInStandalone,
      isInStandaloneMode,
      isMobile,
      hasMinimalUI,
      installed
    });

    setIsInstalled(installed);
    return installed;
  };

  useEffect(() => {
    // Verificar estado inicial
    const installed = checkIfInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ App installed successfully');
      // Hide the install button after installation
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    // Escuchar cambios en el media query
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('📱 Display mode changed:', e.matches);
      setIsInstalled(e.matches);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Si no está instalado, mostrar el botón de instalación después de un tiempo
    if (!installed) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        if (!isInstalled) {
          console.log('📱 Mostrando botón de instalación (no detectado automáticamente)');
          setIsInstallable(true);
        }
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [isInstalled]);

  const installPWA = async () => {
    if (deferredPrompt) {
      // Método 1: Usar el prompt almacenado
      console.log('🚀 Mostrando prompt de instalación almacenado');
      deferredPrompt.prompt();

      try {
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Reset the deferred prompt
        setDeferredPrompt(null);
        setIsInstallable(false);

        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (error) {
        console.warn('Error handling install prompt:', error);
      }
    } else {
      // Método 2: Forzar mostrar opciones de instalación del navegador
      console.log('🚀 Intentando mostrar opciones de instalación alternativas');

      // En Android/Chrome, podemos intentar mostrar el menú de instalación
      if ('share' in navigator) {
        // Método alternativo: mostrar instrucciones
        alert('Para instalar la app:\n\n1. Toca el menú (⋮) en la parte superior derecha\n2. Selecciona "Agregar a pantalla de inicio"\n3. Confirma la instalación');
      } else {
        // Mostrar mensaje genérico
        alert('La app se puede instalar desde el menú del navegador.\nBusca la opción "Instalar" o "Agregar a pantalla de inicio".');
      }
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPWA,
    checkIfInstalled,
  };
};