import { toast } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { VoiceProvider } from './context/VoiceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';
import UserRegistration from './components/UserRegistration';
import LoginPage from './components/LoginPage';
import VoiceLogin from './components/VoiceLogin';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const WalletsPage = lazy(() => import('./pages/WalletsPage'));
const DebtsPage = lazy(() => import('./pages/DebtsPage'));
const AddDebtPage = lazy(() => import('./pages/AddDebtPage'));
const BusinessPage = lazy(() => import('./pages/BusinessPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function AppContent() {
  const { state, login, register } = useAuth();
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'voiceLogin' | 'app'>('login');

  useEffect(() => {
    if (state.user) {
      setCurrentView('app');
    } else {
      setCurrentView('login');
    }
  }, [state.user]);

  const handleUserRegistration = async (email: string, password: string) => {
    try {
      await register(email, password);
      setCurrentView('app');
      toast.success('¡Registro completado! Bienvenido a Wallet Voice.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en registro');
      throw error;
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      setCurrentView('app');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en login');
      throw error;
    }
  };

  const handleVoiceLogin = (email?: string) => {
    if (email) {
      setCurrentView('app');
    }
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
        onLogin={handleVoiceLogin}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  return (
    <ErrorBoundary>
      <VoiceProvider>
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 text-gray-800 relative">
  {/* Solo 3 elementos con mucho espacio */}
  <div 
    className="absolute inset-0 opacity-8 pointer-events-none"
    style={{
      backgroundImage: `
        url("data:image/svg+xml,%3Csvg width='250' height='250' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='35' y='65' font-size='55' opacity='0.1'%3E🧮%3C/text%3E%3C/svg%3E"),
        url("data:image/svg+xml,%3Csvg width='250' height='250' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='35' y='65' font-size='55' opacity='0.1'%3E📓%3C/text%3E%3C/svg%3E"),
        url("data:image/svg+xml,%3Csvg width='250' height='250' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='35' y='65' font-size='55' opacity='0.1'%3E✏️%3C/text%3E%3C/svg%3E")
      `,
      backgroundSize: '250px 250px',
      backgroundPosition: '0 0, 125px 125px, 0 125px'
    }}
  />
  
  <div className="relative z-10">
    <Header />
    <main className="pb-16">
      <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/debts" element={<DebtsPage />} />
          <Route path="/add-debt" element={<AddDebtPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/business" element={<BusinessPage />} />
          <Route path="/summary" element={<BusinessPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Suspense>
    </main>
    <BottomNav />
  </div>
</div>
      </VoiceProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
