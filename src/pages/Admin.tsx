import React, { useState, useEffect } from 'react';
import {
  LogOut,
  FastForward,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Megaphone,
  User,
  Phone,
  Search,
} from 'lucide-react';
import { AppState, QueueItem, FidelityCard, AdminUser } from '../types.ts';

interface AdminProps {
  state: AppState;
  onRefresh: () => void;
  onNavigate?: (tab: 'inicio' | 'fila' | 'pix' | 'fidelidade' | 'admin') => void;
}

type AdminTab = 'fila' | 'loja' | 'avisos' | 'fidelidade';

export const Admin: React.FC<AdminProps> = ({ state, onRefresh, onNavigate }) => {
  // Auth state - starts logged out with EMPTY fields as requested
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'register' | 'login'>(() => (state.hasAdmin ? 'login' : 'register'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync authMode if state.hasAdmin changes
  useEffect(() => {
    if (state.hasAdmin) {
      setAuthMode('login');
    } else {
      setAuthMode('register');
    }
  }, [state.hasAdmin]);

  // Admin Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('fila');

  // Tab: Fila state
  const [newClientName, setNewClientName] = useState('');
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);

  // Tab: Loja state
  const [horarios, setHorarios] = useState(state.horarios);
  const [valorCorte, setValorCorte] = useState(state.valorCorte.toString());
  const [pixChave, setPixChave] = useState(state.pix.chave);
  const [pixNome, setPixNome] = useState(state.pix.nomeRecebedor);
  const [pixCidade, setPixCidade] = useState(state.pix.cidadeRecebedor);
  const [pixCopiaCola, setPixCopiaCola] = useState(state.pix.pixCopiaColaOpcional || '');
  const [pixWhatsapp, setPixWhatsapp] = useState(state.pix.whatsapp);
  const [promocaoAtiva, setPromocaoAtiva] = useState(state.fidelidadeConfig.promocaoAtiva);
  const [cortesParaGanhar, setCortesParaGanhar] = useState(state.fidelidadeConfig.cortesParaGanhar.toString());
  const [savingLoja, setSavingLoja] = useState(false);
  const [lojaMsg, setLojaMsg] = useState<string | null>(null);

  // Tab: Avisos state
  const [novoAviso, setNovoAviso] = useState('');
  const [publicandoAviso, setPublicandoAviso] = useState(false);
  const [avisoMsg, setAvisoMsg] = useState<string | null>(null);

  // Tab: Fidelidade state
  const [cartoes, setCartoes] = useState<FidelityCard[]>([]);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [criandoCartao, setCriandoCartao] = useState(false);
  const [buscaFidelidade, setBuscaFidelidade] = useState('');
  const [fidelidadeMsg, setFidelidadeMsg] = useState<string | null>(null);

  // Sync state into local forms when state changes
  useEffect(() => {
    setHorarios(state.horarios);
    setValorCorte(state.valorCorte.toString());
    setPixChave(state.pix.chave);
    setPixNome(state.pix.nomeRecebedor);
    setPixCidade(state.pix.cidadeRecebedor);
    setPixCopiaCola(state.pix.pixCopiaColaOpcional || '');
    setPixWhatsapp(state.pix.whatsapp);
    setPromocaoAtiva(state.fidelidadeConfig.promocaoAtiva);
    setCortesParaGanhar(state.fidelidadeConfig.cortesParaGanhar.toString());
  }, [state]);

  // Load fidelity cards when authenticated
  const loadCartoes = async (token: string) => {
    try {
      const res = await fetch('/api/admin/fidelidade', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.cartoes) {
        setCartoes(data.cartoes);
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    }
  };

  useEffect(() => {
    if (currentUser && authToken) {
      loadCartoes(authToken);
    }
  }, [currentUser, authToken, activeTab]);

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        // ignore
      }
    }
    setAuthToken(null);
    setCurrentUser(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    // If attempting to register when admin is already configured
    if (authMode === 'register' && state.hasAdmin) {
      setAuthError('Apenas a conta de administrador configurada possui acesso a este painel.');
      setAuthLoading(false);
      return;
    }

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na autenticação.');
      }

      if (data.token && data.user) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        loadCartoes(data.token);
        onRefresh();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar operação.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle Shop Open/Closed
  const handleToggleAberta = async () => {
    if (!authToken) return;
    try {
      await fetch('/api/admin/toggle-aberta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ aberta: !state.barbeariaAberta }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Add customer to queue
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !authToken) return;

    setIsSubmittingClient(true);
    try {
      const res = await fetch('/api/admin/fila/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ nome: newClientName.trim() }),
      });
      if (res.ok) {
        setNewClientName('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingClient(false);
    }
  };

  // Advance queue
  const handleAdvanceQueue = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/fila/advance', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set status for specific client
  const handleSetStatus = async (id: string, status: 'aguardando' | 'atendendo' | 'finalizado') => {
    if (!authToken) return;
    try {
      await fetch('/api/admin/fila/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id, status }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete client from queue
  const handleDeleteQueueItem = async (id: string) => {
    if (!authToken) return;
    try {
      await fetch(`/api/admin/fila/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Clear finalized clients
  const handleClearFinalizados = async () => {
    if (!authToken) return;
    try {
      await fetch('/api/admin/fila/clear-finalizados', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Save Store Settings
  const handleSaveLoja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setSavingLoja(true);
    setLojaMsg(null);
    try {
      const res = await fetch('/api/admin/loja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          horarios,
          valorCorte: parseFloat(valorCorte) || 20,
          pix: {
            chave: pixChave,
            nomeRecebedor: pixNome,
            cidadeRecebedor: pixCidade,
            pixCopiaColaOpcional: pixCopiaCola,
            whatsapp: pixWhatsapp,
          },
          fidelidadeConfig: {
            promocaoAtiva,
            cortesParaGanhar: parseInt(cortesParaGanhar) || 6,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
      setLojaMsg('Configurações salvas com sucesso!');
      onRefresh();
      setTimeout(() => setLojaMsg(null), 3000);
    } catch (err: any) {
      setLojaMsg(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSavingLoja(false);
    }
  };

  // Publicar Aviso
  const handlePublicarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    setPublicandoAviso(true);
    setAvisoMsg(null);
    try {
      const res = await fetch('/api/admin/aviso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ aviso: novoAviso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao publicar aviso.');
      setAvisoMsg('Aviso publicado com sucesso!');
      setNovoAviso('');
      onRefresh();
      setTimeout(() => setAvisoMsg(null), 3000);
    } catch (err: any) {
      setAvisoMsg(err.message || 'Erro ao publicar.');
    } finally {
      setPublicandoAviso(false);
    }
  };

  const handleRemoverAviso = async () => {
    if (!authToken) return;
    try {
      await fetch('/api/admin/aviso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ aviso: '' }),
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Create new fidelity card
  const handleCreateFidelityCard = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = novoClienteNome.trim();
    if (!nomeLimpo) {
      setFidelidadeMsg('Por favor, informe o nome do cliente.');
      return;
    }
    if (!authToken) {
      setFidelidadeMsg('Sessão inválida. Faça login novamente.');
      return;
    }

    setCriandoCartao(true);
    setFidelidadeMsg(null);
    try {
      const res = await fetch('/api/admin/fidelidade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          nome: nomeLimpo,
          telefone: novoClienteTelefone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar cartão.');
      }
      if (data.cartoes) {
        setCartoes(data.cartoes);
      } else if (data.cartao) {
        setCartoes((prev) => [data.cartao, ...prev]);
      }
      setNovoClienteNome('');
      setNovoClienteTelefone('');
      setFidelidadeMsg(`Cartão de "${nomeLimpo}" criado com sucesso! Código: ${data.cartao?.codigo || ''}`);
      setTimeout(() => setFidelidadeMsg(null), 4000);
      onRefresh();
    } catch (err: any) {
      setFidelidadeMsg(err.message || 'Erro ao adicionar cartão.');
    } finally {
      setCriandoCartao(false);
    }
  };

  // Update fidelity card cut count (+1 / -1)
  const handleUpdateCorte = async (id: string, delta: number) => {
    if (!authToken) return;
    try {
      const res = await fetch(`/api/admin/fidelidade/${id}/corte`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ delta }),
      });
      const data = await res.json();
      if (res.ok && data.cartoes) {
        setCartoes(data.cartoes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete fidelity card
  const handleDeleteCard = async (id: string) => {
    const cardToDelete = cartoes.find((c) => c.id === id);
    const cardName = cardToDelete ? cardToDelete.nome : 'Cartão';

    // Optimistically update UI immediately
    setCartoes((prev) => prev.filter((c) => c.id !== id));
    setFidelidadeMsg(`Cartão de "${cardName}" excluído com sucesso.`);
    setTimeout(() => setFidelidadeMsg(null), 3500);

    if (!authToken) return;
    try {
      const res = await fetch(`/api/admin/fidelidade/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.cartoes) {
        setCartoes(data.cartoes);
      }
    } catch (err) {
      console.error('Erro ao deletar cartão:', err);
    }
  };

  // Filter fidelity cards by search query
  const filteredCartoes = cartoes.filter((c) => {
    const q = buscaFidelidade.toLowerCase().trim();
    if (!q) return true;
    return (
      c.nome.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q) ||
      (c.telefone && c.telefone.includes(q))
    );
  });

  // ==========================================
  // VIEW: NOT LOGGED IN (AUTH SCREEN)
  // ==========================================
  if (!currentUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {onNavigate && (
            <div className="mb-3">
              <button
                type="button"
                onClick={() => onNavigate('inicio')}
                className="text-xs text-[#8c806f] hover:text-[#e8af38] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>←</span>
                <span>Voltar ao site</span>
              </button>
            </div>
          )}

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#faf7f2] mb-6 text-center">
            Área do administrador
          </h1>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-[#2b1010] border border-[#592222] text-[#fca5a5] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#b8aca0] mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#b8aca0] mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base tracking-wide transition-all bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.2)] hover:from-[#ebb448] hover:to-[#c68925] disabled:opacity-50 mt-2 cursor-pointer uppercase"
            >
              {authLoading
                ? 'Processando...'
                : authMode === 'register'
                ? 'CRIAR CONTA'
                : 'ENTRAR'}
            </button>
          </form>

          {/* Toggle between Register and Login */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                if (authMode === 'login' && state.hasAdmin) {
                  setAuthError('Apenas a conta de administrador configurada possui acesso a este painel.');
                  return;
                }
                setAuthError(null);
                setAuthMode(authMode === 'register' ? 'login' : 'register');
              }}
              className="text-xs sm:text-sm text-[#b8aca0] hover:text-[#dfa73b] transition-colors underline underline-offset-4 cursor-pointer"
            >
              {authMode === 'register' ? 'Já tenho conta' : 'Criar nova conta'}
            </button>
          </div>

          <p className="mt-4 text-[11px] text-[#73685a] text-center leading-relaxed">
            Somente a primeira conta criada recebe acesso de administrador.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LOGGED IN ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#faf7f2]">
            Painel
          </h1>
          <span className="text-xs text-[#8c806f] font-mono">{currentUser.email}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2d2419] text-xs font-medium text-[#b8aca0] hover:text-[#faf7f2] hover:bg-[#1a1713] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center p-1 bg-[#14120f] border border-[#262017] rounded-2xl mb-6">
        {(['fila', 'loja', 'avisos', 'fidelidade'] as AdminTab[]).map((tab) => {
          const labels: Record<AdminTab, string> = {
            fila: 'Fila',
            loja: 'Loja',
            avisos: 'Avisos',
            fidelidade: 'Fidelidade',
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-black text-[#faf7f2] shadow-sm font-semibold'
                  : 'text-[#8c806f] hover:text-[#ded6ca]'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* TAB 1: FILA */}
      {/* ========================================== */}
      {activeTab === 'fila' && (
        <div className="space-y-4">
          {/* Barbearia Aberta Toggle Card */}
          <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-5 flex items-center justify-between shadow-md">
            <div>
              <span className="text-sm sm:text-base font-bold text-[#faf7f2] block">
                Barbearia {state.barbeariaAberta ? 'ABERTA' : 'FECHADA'}
              </span>
              <span className="text-xs text-[#8c806f]">Aparece na página inicial</span>
            </div>

            <button
              type="button"
              onClick={handleToggleAberta}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                state.barbeariaAberta ? 'bg-[#dfa73b]' : 'bg-[#292218]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#0c0a08] shadow ring-0 transition duration-200 ease-in-out ${
                  state.barbeariaAberta ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Add Client Card */}
          <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-5 shadow-md">
            <form onSubmit={handleAddClient} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente (ex.: João S.)"
                  className="flex-1 px-4 py-3 rounded-2xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingClient || !newClientName.trim()}
                  className="w-12 h-12 rounded-2xl bg-[#dfa73b] text-black flex items-center justify-center hover:bg-[#ebb448] disabled:opacity-50 transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              <p className="text-[11px] text-[#73685a]">
                O nome aparece publicamente. Use só o primeiro nome e a inicial.
              </p>

              {/* Big Avançar Fila Button */}
              <button
                type="button"
                onClick={handleAdvanceQueue}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.22)] hover:from-[#ebb448] hover:to-[#c68925] active:scale-[0.99] uppercase"
              >
                <FastForward className="w-5 h-5 fill-current" />
                AVANÇAR FILA
              </button>
            </form>
          </div>

          {/* Queue List Card */}
          <div className="bg-[#14120f] border border-[#262017] rounded-3xl p-5 shadow-md space-y-3">
            {state.fila.length === 0 ? (
              <p className="text-xs text-[#73685a] text-center py-4">Fila vazia no momento.</p>
            ) : (
              <div className="divide-y divide-[#211a12]">
                {state.fila.map((item: QueueItem) => (
                  <div key={item.id} className="py-3.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm sm:text-base font-bold text-[#faf7f2] block">
                          {item.nome}
                        </span>
                        <span className="text-xs text-[#73685a] font-mono tabular-nums">
                          {item.horario}
                        </span>
                      </div>

                      {/* Right badge */}
                      <span className="text-xs text-[#73685a] capitalize">
                        {item.status === 'atendendo'
                          ? 'Na cadeira'
                          : item.status === 'finalizado'
                          ? 'Finalizado'
                          : 'Aguardando'}
                      </span>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleSetStatus(item.id, 'aguardando')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          item.status === 'aguardando'
                            ? 'bg-[#dfa73b] text-black font-semibold'
                            : 'bg-[#1a1612] text-[#b8aca0] hover:text-white border border-[#2a2217]'
                        }`}
                      >
                        Aguardando
                      </button>

                      <button
                        onClick={() => handleSetStatus(item.id, 'atendendo')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          item.status === 'atendendo'
                            ? 'bg-[#dfa73b] text-black font-semibold'
                            : 'bg-[#1a1612] text-[#b8aca0] hover:text-white border border-[#2a2217]'
                        }`}
                      >
                        Atender
                      </button>

                      <button
                        onClick={() => handleSetStatus(item.id, 'finalizado')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                          item.status === 'finalizado'
                            ? 'bg-[#dfa73b] text-black font-semibold'
                            : 'bg-[#1a1612] text-[#b8aca0] hover:text-white border border-[#2a2217]'
                        }`}
                      >
                        Finalizar
                      </button>

                      <button
                        onClick={() => handleDeleteQueueItem(item.id)}
                        className="ml-auto p-1.5 text-[#73685a] hover:text-red-400 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Clear finalized */}
            {state.fila.some((i) => i.status === 'finalizado') && (
              <div className="pt-2 text-left">
                <button
                  onClick={handleClearFinalizados}
                  className="text-xs text-[#8c806f] hover:text-[#dfa73b] transition-colors"
                >
                  Limpar finalizados
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: LOJA */}
      {/* ========================================== */}
      {activeTab === 'loja' && (
        <form onSubmit={handleSaveLoja} className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 shadow-md space-y-5">
          {lojaMsg && (
            <div className="p-3 rounded-xl bg-[#122817] border border-[#23522d] text-[#86efac] text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{lojaMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
              Horários de funcionamento
            </label>
            <textarea
              rows={3}
              value={horarios}
              onChange={(e) => setHorarios(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
              Valor do corte (R$)
            </label>
            <input
              type="number"
              step="any"
              value={valorCorte}
              onChange={(e) => setValorCorte(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
            />
          </div>

          {/* PIX Settings */}
          <div className="pt-2 space-y-4">
            <h2 className="font-display text-base font-bold text-[#dfa73b]">
              PIX
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                Chave PIX
              </label>
              <input
                type="text"
                value={pixChave}
                onChange={(e) => setPixChave(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                Nome do recebedor
              </label>
              <input
                type="text"
                value={pixNome}
                onChange={(e) => setPixNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                Cidade do recebedor
              </label>
              <input
                type="text"
                value={pixCidade}
                onChange={(e) => setPixCidade(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <p className="text-[11px] text-[#73685a] leading-relaxed">
              Com chave, nome e cidade preenchidos, o site gera o QR Code automaticamente. Chave de celular: use o formato +5511999999999.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                PIX copia e cola do seu banco (opcional)
              </label>
              <textarea
                rows={2}
                value={pixCopiaCola}
                onChange={(e) => setPixCopiaCola(e.target.value)}
                placeholder="Cole aqui o código gerado pelo seu banco para usá-lo no lugar do QR automático"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                WhatsApp que recebe os comprovantes
              </label>
              <input
                type="text"
                value={pixWhatsapp}
                onChange={(e) => setPixWhatsapp(e.target.value)}
                placeholder="77998614589"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>
          </div>

          {/* Cartão Fidelidade Settings */}
          <div className="pt-2 space-y-4">
            <h2 className="font-display text-base font-bold text-[#dfa73b]">
              Cartão fidelidade
            </h2>

            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-[#b8aca0]">
                Promoção ativa
              </span>
              <button
                type="button"
                onClick={() => setPromocaoAtiva(!promocaoAtiva)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  promocaoAtiva ? 'bg-[#dfa73b]' : 'bg-[#292218]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-[#0c0a08] shadow ring-0 transition duration-200 ease-in-out ${
                    promocaoAtiva ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b8aca0] mb-1.5">
                Cortes para ganhar 1 grátis
              </label>
              <input
                type="number"
                value={cortesParaGanhar}
                onChange={(e) => setCortesParaGanhar(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={savingLoja}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.22)] hover:from-[#ebb448] hover:to-[#c68925] disabled:opacity-50 transition-all uppercase"
          >
            {savingLoja ? 'SALVANDO...' : 'SALVAR'}
          </button>
        </form>
      )}

      {/* ========================================== */}
      {/* TAB 3: AVISOS */}
      {/* ========================================== */}
      {activeTab === 'avisos' && (
        <div className="space-y-4">
          <form onSubmit={handlePublicarAviso} className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 shadow-md space-y-4">
            {avisoMsg && (
              <div className="p-3 rounded-xl bg-[#122817] border border-[#23522d] text-[#86efac] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{avisoMsg}</span>
              </div>
            )}

            <div>
              <textarea
                rows={4}
                value={novoAviso}
                onChange={(e) => setNovoAviso(e.target.value)}
                placeholder="Ex.: Hoje fecharemos às 17h."
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <button
              type="submit"
              disabled={publicandoAviso || !novoAviso.trim()}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.22)] hover:from-[#ebb448] hover:to-[#c68925] disabled:opacity-50 transition-all uppercase"
            >
              {publicandoAviso ? 'PUBLICANDO...' : 'PUBLICAR AVISO'}
            </button>
          </form>

          {/* Current active aviso (if any) */}
          {state.aviso && (
            <div className="bg-[#1b1712] border border-[#4d3a21] rounded-3xl p-5 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-bold text-[#dfa73b] flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" />
                  Aviso Ativo no Site
                </span>
                <button
                  onClick={handleRemoverAviso}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remover aviso
                </button>
              </div>
              <p className="text-sm text-[#faf7f2] whitespace-pre-line bg-[#0e0c0a] p-3 rounded-xl border border-[#2a2217]">
                {state.aviso}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: FIDELIDADE */}
      {/* ========================================== */}
      {activeTab === 'fidelidade' && (
        <div className="space-y-4">
          {/* New Card Form */}
          <form onSubmit={handleCreateFidelityCard} className="bg-[#14120f] border border-[#262017] rounded-3xl p-6 shadow-md space-y-4">
            <div>
              <input
                type="text"
                value={novoClienteNome}
                onChange={(e) => setNovoClienteNome(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b]"
                required
              />
            </div>

            <div>
              <input
                type="text"
                value={novoClienteTelefone}
                onChange={(e) => setNovoClienteTelefone(e.target.value)}
                placeholder="Telefone (privado, opcional)"
                className="w-full px-4 py-3 rounded-xl bg-[#0c0a08] border border-[#2a2217] text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none focus:border-[#dfa73b]"
              />
            </div>

            <button
              type="submit"
              disabled={criandoCartao || !novoClienteNome.trim()}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] shadow-[0_4px_24px_rgba(223,167,59,0.22)] hover:from-[#ebb448] hover:to-[#c68925] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 uppercase"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              NOVO CARTÃO
            </button>
          </form>

          {/* Feedback Banner */}
          {fidelidadeMsg && (
            <div className="p-3 rounded-xl bg-[#122817] border border-[#23522d] text-[#86efac] text-xs flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-[#4ade80]" />
              <span>{fidelidadeMsg}</span>
            </div>
          )}

          {/* Search Card */}
          <div className="bg-[#14120f] border border-[#262017] rounded-2xl px-4 py-3 shadow-md flex items-center gap-2">
            <Search className="w-4 h-4 text-[#73685a] shrink-0" />
            <input
              type="text"
              value={buscaFidelidade}
              onChange={(e) => setBuscaFidelidade(e.target.value)}
              placeholder="Buscar por nome, código ou telefone"
              className="w-full bg-transparent text-[#faf7f2] placeholder-[#574e42] text-sm focus:outline-none"
            />
          </div>

          {/* List of Fidelity Cards */}
          <div className="space-y-3">
            {filteredCartoes.length === 0 ? (
              <p className="text-xs text-[#73685a] text-center py-6">
                Nenhum cartão fidelidade encontrado.
              </p>
            ) : (
              filteredCartoes.map((card) => {
                const maxCiclo = state.fidelidadeConfig.cortesParaGanhar || 6;
                return (
                  <div
                    key={card.id}
                    className="bg-[#14120f] border border-[#262017] rounded-3xl p-5 shadow-md flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-base font-bold text-[#faf7f2] block">
                          {card.nome}
                        </span>
                        <span className="text-xs text-[#73685a] block">
                          {card.telefone ? card.telefone : 'sem telefone'}
                        </span>
                        <span className="text-xs text-[#dfa73b] font-medium block mt-1">
                          {card.totalCortes} corte(s) · ciclo atual {card.cortesCiclo}/{maxCiclo}
                        </span>
                      </div>

                      {/* Code Pill */}
                      <span className="px-3 py-1 rounded-xl bg-[#211a12] border border-[#3d2e1b] text-[#dfa73b] font-mono font-bold text-xs tracking-wider">
                        {card.codigo}
                      </span>
                    </div>

                    {/* Actions: + Registrar corte, -, Delete */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateCorte(card.id, 1)}
                        className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-[#dfa73b] to-[#b87e1f] text-[#0f0c08] font-bold text-xs flex items-center gap-1.5 hover:from-[#ebb448] hover:to-[#c68925] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        Registrar corte
                      </button>

                      <button
                        onClick={() => handleUpdateCorte(card.id, -1)}
                        className="w-8 h-8 rounded-xl bg-[#1b1713] border border-[#2a2217] text-[#b8aca0] hover:text-white flex items-center justify-center font-bold text-sm transition-colors"
                        title="Diminuir corte"
                      >
                        -
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                        className="ml-auto p-2 text-[#8c806f] hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Excluir cartão"
                        aria-label="Excluir cartão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
