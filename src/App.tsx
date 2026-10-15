import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { Home } from './pages/Home.tsx';
import { Fila } from './pages/Fila.tsx';
import { Pix } from './pages/Pix.tsx';
import { Fidelidade } from './pages/Fidelidade.tsx';
import { Admin } from './pages/Admin.tsx';
import { AppState } from './types.ts';

const initialFallbackState: AppState = {
  barbeariaAberta: true,
  horarios: 'Seg a Sáb: 8h às 12h Manhã\nA Tarde das 14:30 às 17:30',
  valorCorte: 20,
  pix: {
    chave: '47943015000157',
    nomeRecebedor: 'Romilton Andre Sales Santos',
    cidadeRecebedor: 'PARAMIRIM-BAHIA',
    pixCopiaColaOpcional: '',
    whatsapp: '77998614589',
    payloadGerado: '',
  },
  fidelidadeConfig: {
    promocaoAtiva: true,
    cortesParaGanhar: 6,
  },
  aviso: null,
  fila: [],
  hasAdmin: false,
  totalUsers: 0,
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');
  const [state, setState] = useState<AppState>(initialFallbackState);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch latest state from server
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Error fetching state', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load + periodic polling for real-time live queue ("Atualiza sozinha")
  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState();
    }, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [fetchState]);

  return (
    <div className="min-h-screen bg-[#0c0a08] text-[#e5ded6] flex flex-col font-sans selection:bg-[#dfa73b] selection:text-black">
      {/* Background warm subtle ambient radial light */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(168,119,34,0.15),transparent)] z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navigation Header */}
        <Header currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab)} />

        {/* Content Area */}
        <main className="flex-1 flex flex-col">
          {isLoading && !state.horarios ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-8 h-8 rounded-full border-2 border-[#dfa73b] border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {currentTab === 'inicio' && (
                <Home state={state} onNavigate={(tab) => setCurrentTab(tab)} />
              )}
              {currentTab === 'fila' && (
                <Fila state={state} onRefresh={fetchState} />
              )}
              {currentTab === 'pix' && (
                <Pix state={state} />
              )}
              {currentTab === 'fidelidade' && (
                <Fidelidade state={state} />
              )}
              {currentTab === 'admin' && (
                <Admin
                  state={state}
                  onRefresh={fetchState}
                  onNavigate={(tab) => setCurrentTab(tab)}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <Footer
          currentTab={currentTab}
          onGoToAdmin={() => setCurrentTab(currentTab === 'admin' ? 'inicio' : 'admin')}
        />
      </div>
    </div>
  );
}
