import { toast } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { VoiceProvider } from './context/VoiceContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import UserRegistration from './components/UserRegistration';
import LoginPage from './components/LoginPage';
import VoiceLogin from './components/VoiceLogin';
import { storageService } from './services/storageService';
import { userService } from './services/userService';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const DebtsPage = lazy(() => import('./pages/DebtsPage'));
const AddDebtPage = lazy(() => import('./pages/AddDebtPage'));

function AppContent() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'voiceLogin' | 'app'>('login');
  const [user, setUser] = useState(userService.getCurrentUser());
  const [voiceVerified, setVoiceVerified] = useState(!user?.voiceData);

  useEffect(() => {
    // Migrar datos de voz antiguos
    userService.migrateVoiceData();

    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      setCurrentView('app');
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Consolidar deudas al iniciar la app
      const result = storageService.consolidateDebts();
      if (result.consolidated > 0) {
        console.log(`🔄 Se consolidaron ${result.consolidated} deudas duplicadas`);
        // Opcional: mostrar notificación al usuario
        toast.success(`Se consolidaron ${result.consolidated} deudas duplicadas`);
      }
    }
  }, [user]);

  const handleUserRegistration = (newUser: any) => {
    try {
      userService.registerUser(newUser);
      setUser(userService.getCurrentUser());
      setCurrentView('app');
      toast.success('¡Registro completado! Bienvenido a Wallet Voice.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en registro');
    }
  };

  const handleLogin = () => {
    setUser(userService.getCurrentUser());
    setCurrentView('app');
  };

  if (currentView === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setCurrentView('register')}
        onVoiceLogin={() => setCurrentView('voiceLogin')}
      />
    );
  }

  if (currentView === 'register') {
    return <UserRegistration onRegister={handleUserRegistration} />;
  }

  if (currentView === 'voiceLogin') {
    return (
      <VoiceLogin
        onLogin={handleLogin}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  if (user && user.voiceData && !voiceVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verificación de Voz</h2>
          <p className="text-gray-600 mb-6">
            Di tu nombre completo para verificar tu identidad.
          </p>
          <button
            onClick={() => setVoiceVerified(true)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Verificar Voz
          </button>
          <button
            onClick={() => setVoiceVerified(true)}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            Omitir
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <UserRegistration onRegister={handleUserRegistration} />;
  }


  return (
    <ErrorBoundary>
      <VoiceProvider>
        <div className="min-h-screen bg-gray-100">
          <Header />
        <main className="pb-16">
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/debts" element={<DebtsPage />} />
              <Route path="/add-debt" element={<AddDebtPage />} />
            </Routes>
          </Suspense>
        </main>
          <BottomNav />
        </div>
      </VoiceProvider>
    </ErrorBoundary>
  );
}

function App() {
  return <AppContent />;
}

export default App;