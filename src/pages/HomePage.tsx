import React from 'react';
import BalanceCards from '../components/ui/BalanceCards';
import QuickActions from '../components/ui/QuickActions';
import CommandExamples from '../components/ui/CommandExamples';

const HomePage: React.FC = () => {

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <BalanceCards />
        <QuickActions />
        <CommandExamples />
      </div>
    </div>
  );
};

export default HomePage;