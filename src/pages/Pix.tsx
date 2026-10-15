import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Send, Check } from 'lucide-react';
import { AppState } from '../types.ts';

interface PixProps {
  state: AppState;
}

export const Pix: React.FC<PixProps> = ({ state }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const pixPayload = state.pix.payloadGerado || state.pix.chave;

  useEffect(() => {
    if (pixPayload) {
      QRCode.toDataURL(pixPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [pixPayload]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(state.pix.chave);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleSendReceipt = () => {
    const rawNumber = state.pix.whatsapp.replace(/\D/g, '') || '77998614589';
    const message = encodeURIComponent(
      `Olá Dedé! Já fiz o PIX de R$ ${state.valorCorte.toFixed(2).replace('.', ',')}. Segue o comprovante:`
    );
    window.open(`https://wa.me/55${rawNumber}?text=${message}`, '_blank');
  };

  const formattedValue = state.valorCorte.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#e5ded6]">
          Pague com <span className="text-[#e8af38]">PIX</span>
        </h1>
      </div>

      {/* Main Payment Card */}
      <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 sm:p-8 flex flex-col items-center shadow-xl mb-6">
        <span className="text-xs text-[#8c8273] uppercase tracking-wider mb-1">
          Valor do corte
        </span>
        <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#dfa73b] mb-1">
          {formattedValue}
        </span>
        <span className="text-xs text-[#b8ad9e] mb-6 text-center">
          Recebedor: <strong className="text-[#ded6ca] font-medium">{state.pix.nomeRecebedor}</strong>
        </span>

        {/* Chave PIX Container */}
        <div className="w-full bg-[#1b1713] border border-[#332819] rounded-2xl p-4 text-center mb-4">
          <span className="text-[10px] sm:text-xs text-[#8c806f] font-mono tracking-wider block mb-1">
            CHAVE PIX
          </span>
          <span className="text-sm sm:text-base font-bold text-[#faf7f2] font-mono tracking-wide break-all">
            {state.pix.chave}
          </span>
        </div>

        {/* Copiar Chave PIX Button */}
        <button
          onClick={handleCopyKey}
          className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.2)] hover:from-[#ebb448] hover:to-[#c68925] active:scale-[0.99] mb-6"
        >
          {copiedKey ? <Check className="w-5 h-5 text-black" /> : <Copy className="w-5 h-5" />}
          {copiedKey ? 'CHAVE COPIADA!' : 'COPIAR CHAVE PIX'}
        </button>

        {/* QR Code Container */}
        <div className="p-3 bg-white rounded-2xl shadow-md mb-4 flex items-center justify-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR Code PIX Dedé Cabeleireiro"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl"
            />
          ) : (
            <div className="w-48 h-48 bg-slate-100 animate-pulse rounded-xl" />
          )}
        </div>

        {/* Copiar código PIX copia e cola Button */}
        <button
          onClick={handleCopyPayload}
          className="w-full py-3 px-4 rounded-xl border border-[#2d2419] bg-[#171410] text-[#c7bcb0] hover:text-white hover:border-[#4d3d27] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {copiedPayload ? <Check className="w-4 h-4 text-[#dfa73b]" /> : <Copy className="w-4 h-4 text-[#dfa73b]" />}
          {copiedPayload ? 'Código PIX copiado!' : 'Copiar código PIX copia e cola'}
        </button>
      </div>

      {/* Como pagar Card */}
      <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 sm:p-7 shadow-lg mb-6">
        <h2 className="font-display text-lg font-bold text-[#dfa73b] mb-4">
          Como pagar
        </h2>
        <ol className="space-y-3 text-xs sm:text-sm text-[#b8ada0] leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="font-semibold text-[#dfa73b]">1.</span>
            <span>Abra o aplicativo do seu banco e entre na área PIX.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-semibold text-[#dfa73b]">2.</span>
            <span>
              Escolha <strong>Pagar com chave</strong> e cole a chave copiada, ou leia o QR Code.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-semibold text-[#dfa73b]">3.</span>
            <span>Confira o nome do recebedor e o valor e confirme.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="font-semibold text-[#dfa73b]">4.</span>
            <span>Salve o comprovante e toque no botão abaixo para enviá-lo.</span>
          </li>
        </ol>
      </div>

      {/* Já paguei — Enviar Comprovante Button */}
      <button
        onClick={handleSendReceipt}
        className="w-full py-4 px-6 rounded-2xl font-semibold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2.5 transition-all bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_6px_28px_rgba(223,167,59,0.25)] hover:from-[#ebb448] hover:to-[#c68925] active:scale-[0.99]"
      >
        <Send className="w-5 h-5" />
        JÁ PAGUEI — ENVIAR COMPROVANTE
      </button>
    </div>
  );
};
