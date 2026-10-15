import React, { useState } from 'react';
import { Scissors, User, UserPlus, CheckCircle2 } from 'lucide-react';
import { AppState, QueueItem } from '../types.ts';

interface FilaProps {
  state: AppState;
  onRefresh: () => void;
}

export const Fila: React.FC<FilaProps> = ({ state, onRefresh }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const activeQueue = state.fila.filter((item) => item.status !== 'finalizado');
  const inChair = state.fila.find((item) => item.status === 'atendendo');
  const waitingList = state.fila.filter((item) => item.status === 'aguardando');

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/fila/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: clientName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao entrar na fila.');
      }
      setClientName('');
      setShowJoinModal(false);
      setFeedbackMsg({ text: 'Você entrou na fila com sucesso!' });
      onRefresh();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Erro de conexão.', error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#e5ded6] mb-2">
          Fila de atendimento
        </h1>
        <p className="flex items-center gap-2 text-xs sm:text-sm text-[#9c9388]">
          <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
          Atualiza sozinha, sem precisar recarregar.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`mb-4 p-3.5 rounded-xl text-sm flex items-center gap-2 border ${
            feedbackMsg.error
              ? 'bg-[#2b1010] border-[#662020] text-[#fca5a5]'
              : 'bg-[#102b18] border-[#206634] text-[#86efac]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Queue Card Container */}
      <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 sm:p-8 min-h-[160px] flex flex-col justify-center shadow-lg">
        {activeQueue.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base sm:text-lg text-[#857b6f] font-normal">
              Ninguém na fila agora.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Customer in Chair (if any) */}
            {inChair && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#241a0d] to-[#1c140a] border border-[#5a421f] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3a2b16] flex items-center justify-center text-[#e8af38]">
                    <Scissors className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-[#dfa73b] font-semibold block">
                      Na cadeira agora
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#faf7f2]">
                      {inChair.nome}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#a39480] tabular-nums font-mono">
                  {inChair.horario}
                </span>
              </div>
            )}

            {/* Waiting List */}
            {waitingList.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-[#8f8373] px-1 font-medium">
                  <span>Aguardando ({waitingList.length})</span>
                  <span>Chegada</span>
                </div>

                <div className="divide-y divide-[#221c15]">
                  {waitingList.map((item: QueueItem, idx: number) => (
                    <div
                      key={item.id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-[#1a1713] rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#241e16] text-[#c99532] text-xs font-semibold flex items-center justify-center tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#756a5c]" />
                          <span className="text-sm sm:text-base font-medium text-[#ded8d0]">
                            {item.nome}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#7d7162] tabular-nums font-mono">
                        {item.horario}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Button for customers to join queue */}
      <div className="mt-5 flex justify-center">
        {state.barbeariaAberta ? (
          <button
            onClick={() => setShowJoinModal(true)}
            className="text-xs sm:text-sm font-medium text-[#dfa73b] hover:text-[#ebb448] py-2 px-4 rounded-xl border border-[#3f301c] hover:bg-[#1f1911] transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Entrar na fila
          </button>
        ) : (
          <span className="text-xs text-[#73685a]">
            Barbearia fechada no momento para novos clientes.
          </span>
        )}
      </div>

      {/* Modal to join queue */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#161310] border border-[#3a2c1b] rounded-3xl p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-[#e5ded6] mb-1">
              Entrar na fila
            </h3>
            <p className="text-xs text-[#8c8172] mb-4">
              Informe seu primeiro nome e inicial (ex.: João S.).
            </p>

            <form onSubmit={handleJoinQueue} className="space-y-4">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Seu nome (ex.: Carlos M.)"
                className="w-full px-4 py-3 rounded-xl bg-[#0d0b09] border border-[#2d2419] text-[#e5ded6] placeholder-[#5c5448] text-sm focus:outline-none focus:border-[#dfa73b]"
                autoFocus
                required
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#2d2419] text-[#9c9284] text-sm hover:bg-[#201b15]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !clientName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] font-semibold text-sm hover:from-[#ebb448] hover:to-[#c68925] disabled:opacity-50"
                >
                  {isSubmitting ? 'Entrando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
