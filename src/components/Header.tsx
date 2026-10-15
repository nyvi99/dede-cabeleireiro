import React from 'react';
import { DedeLogo } from './DedeLogo.tsx';

export type TabType = 'inicio' | 'fila' | 'pix' | 'fidelidade' | 'admin';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const navItems: { id: TabType; label: string }[] = [
    { id: 'inicio', label: 'Início' },
    { id: 'fila', label: 'Fila' },
    { id: 'pix', label: 'PIX' },
    { id: 'fidelidade', label: 'Fidelidade' },
  ];

  return (
    <header className="w-full max-w-4xl mx-auto px-4 pt-6 pb-4">
      <div className="flex items-center justify-between">
        {/* Brand Lockup */}
        <button
          onClick={() => onTabChange('inicio')}
          className="flex items-center gap-3 group text-left transition-opacity hover:opacity-90"
        >
          <DedeLogo size="md" />
          <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#e8af38]">
            Dedé Cabeleireiro
          </span>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#322312] text-[#f2be5c] border border-[#5d411f] shadow-[0_0_12px_rgba(223,167,59,0.15)]'
                    : 'text-[#9c9388] hover:text-[#e5ded6] hover:bg-[#1a1612]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
