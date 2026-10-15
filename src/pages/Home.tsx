import React from 'react';
import { Users, Scissors, ListOrdered, QrCode, MessageCircle, Clock, Megaphone } from 'lucide-react';
import { DedeLogo } from '../components/DedeLogo.tsx';
import { AppState } from '../types.ts';
import { TabType } from '../components/Header.tsx';

interface HomeProps {
  state: AppState;
  onNavigate: (tab: TabType) => void;
}

export const Home: React.FC<HomeProps> = ({ state, onNavigate }) => {
  const waitingCount = state.fila.filter((item) => item.status === 'aguardando').length;
  const inChairItem = state.fila.find((item) => item.status === 'atendendo');

  const handleWhatsApp = () => {
    const rawNumber = state.pix.whatsapp.replace(/\D/g, '') || '77998614589';
    const message = encodeURIComponent('Olá Dedé! Gostaria de mais informações.');
    window.open(`https://wa.me/55${rawNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Center Emblem & Branding */}
      <div className="flex flex-col items-center text-center mb-6">
        <DedeLogo size="lg" className="mb-4" />
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#e8af38] mb-1">
          Dedé Cabeleireiro
        </h1>
        <p className="text-sm sm:text-base text-[#9e9486] font-light">
          Corte com estilo, atendimento com respeito.
        </p>

        {/* Status Pill */}
        <div className="mt-4">
          {state.barbeariaAberta ? (
            <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider bg-[#0f2c18] text-[#34d399] border border-[#1c542d] shadow-[0_0_15px_rgba(52,211,153,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              ABERTO
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider bg-[#2c1010] text-[#f87171] border border-[#541c1c]">
              <span className="w-2 h-2 rounded-full bg-[#f87171]" />
              FECHADO
            </span>
          )}
        </div>
      </div>

      {/* Active Announcement (if any) */}
      {state.aviso && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-[#211a11] border border-[#523d1f] text-[#f0caa0] flex items-start gap-3 shadow-lg">
          <Megaphone className="w-5 h-5 text-[#dfa73b] shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-[#dfa73b] block mb-0.5">Aviso da Barbearia:</span>
            <p className="text-[#ded1c1] whitespace-pre-line">{state.aviso}</p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="w-full grid grid-cols-2 gap-4 mb-6">
        {/* Waiting Count */}
        <div className="bg-[#14120f] border border-[#262017] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-[#3d3220] transition-colors shadow-sm">
          <Users className="w-5 h-5 text-[#8f8474] mb-2" />
          <span className="font-display text-3xl font-bold text-[#e5ded6] tabular-nums mb-1">
            {waitingCount}
          </span>
          <span className="text-xs text-[#8f8474]">aguardando</span>
        </div>

        {/* In Chair Status */}
        <div className="bg-[#14120f] border border-[#262017] rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-[#3d3220] transition-colors shadow-sm">
          <Scissors className="w-5 h-5 text-[#8f8474] mb-2" />
          <span className="font-display text-2xl sm:text-3xl font-bold text-[#e5ded6] truncate max-w-full px-2 mb-1">
            {inChairItem ? inChairItem.nome : '—'}
          </span>
          <span className="text-xs text-[#8f8474]">
            {inChairItem ? 'na cadeira' : 'ninguém na cadeira'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 mb-6">
        {/* Consultar Fila Button */}
        <button
          onClick={() => onNavigate('fila')}
          className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.22)] hover:from-[#ebb448] hover:to-[#c68925] active:scale-[0.99]"
        >
          <ListOrdered className="w-5 h-5" />
          CONSULTAR A FILA
        </button>

        {/* Pagar com Pix Button */}
        <button
          onClick={() => onNavigate('pix')}
          className="w-full py-3.5 px-6 rounded-2xl font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all bg-[#14120f] border border-[#2c2419] text-[#e5ded6] hover:bg-[#1a1713] hover:border-[#453723] active:scale-[0.99]"
        >
          <QrCode className="w-5 h-5 text-[#dfa73b]" />
          PAGAR COM PIX
        </button>

        {/* Falar no WhatsApp Button */}
        <button
          onClick={handleWhatsApp}
          className="w-full py-3.5 px-6 rounded-2xl font-medium text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all bg-[#14120f] border border-[#2c2419] text-[#e5ded6] hover:bg-[#1a1713] hover:border-[#453723] active:scale-[0.99]"
        >
          <MessageCircle className="w-5 h-5 text-[#dfa73b]" />
          FALAR NO WHATSAPP
        </button>
      </div>

      {/* Horários Card */}
      <div className="w-full bg-[#14120f] border border-[#262017] rounded-2xl p-6 text-left">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-[#dfa73b]" />
          <h2 className="font-display text-lg font-bold text-[#dfa73b]">
            Horários
          </h2>
        </div>
        <p className="text-sm text-[#beb5a8] leading-relaxed whitespace-pre-line">
          {state.horarios}
        </p>
      </div>
    </div>
  );
};
