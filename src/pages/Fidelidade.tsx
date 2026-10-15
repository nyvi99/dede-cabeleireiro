import React, { useState } from 'react';
import { Search, Scissors, Gift, AlertCircle, Check } from 'lucide-react';
import { AppState } from '../types.ts';

interface FidelidadeProps {
  state: AppState;
}

interface LookupResult {
  codigo: string;
  nome: string;
  totalCortes: number;
  cortesCiclo: number;
  metaCiclo: number;
  promocaoAtiva: boolean;
}

export const Fidelidade: React.FC<FidelidadeProps> = ({ state }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const metaCortes = state.fidelidadeConfig.cortesParaGanhar || 6;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch(`/api/fidelidade/lookup/${cleanCode}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cartão não encontrado.');
      }
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Código não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#e5ded6]">
          Cartão Fidelidade
        </h1>
      </div>

      {/* Main Card */}
      <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 sm:p-8 shadow-xl mb-6">
        <p className="text-sm sm:text-base text-[#b8aca0] leading-relaxed mb-6">
          A cada <strong className="text-[#dfa73b] font-semibold">{metaCortes} cortes</strong>, o
          próximo é por nossa conta. Digite o código do seu cartão (peça ao barbeiro).
        </p>

        {/* Input & Search Button */}
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex.: A1B2C3"
            maxLength={10}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-[#0e0c0a] border border-[#2d2419] text-[#f2eee9] placeholder-[#5c5347] text-base text-center tracking-widest uppercase font-mono focus:outline-none focus:border-[#dfa73b] transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] flex items-center justify-center hover:from-[#ebb448] hover:to-[#c68925] transition-all shadow-[0_4px_16px_rgba(223,167,59,0.25)] disabled:opacity-50 active:scale-95 shrink-0"
            title="Consultar Cartão"
          >
            <Search className="w-6 h-6 stroke-[2.5]" />
          </button>
        </form>

        {/* Error State */}
        {errorMsg && (
          <div className="mt-5 p-3.5 rounded-xl bg-[#281111] border border-[#592323] text-[#fca5a5] text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Found Result Card */}
        {result && (
          <div className="mt-6 pt-6 border-t border-[#262017] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#8f8373] block">Cliente</span>
                <span className="font-display text-xl font-bold text-[#faf6f0]">
                  {result.nome}
                </span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-[#261f15] border border-[#4a3922] text-[#dfa73b] font-mono font-bold text-sm tracking-wider">
                {result.codigo}
              </span>
            </div>

            {/* Visual Fidelity Stamps */}
            <div className="bg-[#0e0c0a] border border-[#2d2419] rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-[#a39788]">
                  Cortes no ciclo atual:
                </span>
                <span className="text-xs font-bold text-[#dfa73b] font-mono">
                  {result.cortesCiclo} / {result.metaCiclo}
                </span>
              </div>

              {/* Grid of Stamps */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {Array.from({ length: result.metaCiclo }).map((_, index) => {
                  const isDone = index < result.cortesCiclo;
                  const isReward = index === result.metaCiclo - 1;
                  return (
                    <div
                      key={index}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isDone
                          ? 'bg-gradient-to-b from-[#3a2c16] to-[#251b0d] border border-[#dfa73b] text-[#dfa73b] shadow-[0_0_12px_rgba(223,167,59,0.2)]'
                          : 'bg-[#15120e] border border-[#241e17] text-[#4d4438]'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <Scissors className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-bold">#{index + 1}</span>
                        </>
                      ) : isReward ? (
                        <>
                          <Gift className="w-5 h-5 mb-0.5 text-[#857357]" />
                          <span className="text-[9px] uppercase font-semibold text-[#857357]">Grátis</span>
                        </>
                      ) : (
                        <span className="text-xs font-mono font-medium">#{index + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Banner */}
              {result.cortesCiclo >= result.metaCiclo ? (
                <div className="mt-4 p-3 rounded-xl bg-[#23351d] border border-[#3b662d] text-[#86efac] text-xs sm:text-sm font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#4ade80]" />
                  <span>🎉 Parabéns! Você completou o ciclo e seu próximo corte é gratuito!</span>
                </div>
              ) : (
                <p className="mt-4 text-xs text-[#8f8373] text-center">
                  Faltam apenas{' '}
                  <strong className="text-[#dfa73b]">
                    {result.metaCiclo - result.cortesCiclo} corte(s)
                  </strong>{' '}
                  para você ganhar o seu corte grátis!
                </p>
              )}
            </div>

            <div className="text-xs text-[#73685a] text-center">
              Total de cortes acumulados na barbearia: {result.totalCortes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
