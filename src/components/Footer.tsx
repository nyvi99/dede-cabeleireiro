import React from 'react';
import { TabType } from './Header.tsx';

interface FooterProps {
  onGoToAdmin: () => void;
  currentTab: TabType;
}

export const Footer: React.FC<FooterProps> = ({ onGoToAdmin, currentTab }) => {
  const isInsideAdmin = currentTab === 'admin';

  return (
    <footer className="w-full max-w-4xl mx-auto px-4 py-10 mt-auto text-center">
      <p className="text-xs sm:text-sm text-[#736a5f]">
        <span>© Dedé Cabeleireiro</span>
        <span className="mx-2">·</span>
        <button
          type="button"
          onClick={onGoToAdmin}
          className="hover:text-[#e8af38] text-[#8c8274] transition-colors underline-offset-4 cursor-pointer"
        >
          {isInsideAdmin ? 'Voltar para o site' : 'Área do administrador'}
        </button>
      </p>
    </footer>
  );
};
