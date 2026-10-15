export interface QueueItem {
  id: string;
  nome: string;
  horario: string;
  status: 'aguardando' | 'atendendo' | 'finalizado';
  createdAt: number;
}

export interface FidelityCard {
  id: string;
  codigo: string;
  nome: string;
  telefone?: string;
  totalCortes: number;
  cortesCiclo: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  barbeariaAberta: boolean;
  horarios: string;
  valorCorte: number;
  pix: {
    chave: string;
    nomeRecebedor: string;
    cidadeRecebedor: string;
    pixCopiaColaOpcional: string;
    whatsapp: string;
    payloadGerado: string;
  };
  fidelidadeConfig: {
    promocaoAtiva: boolean;
    cortesParaGanhar: number;
  };
  aviso: string | null;
  fila: QueueItem[];
  hasAdmin: boolean;
  totalUsers: number;
}

export interface AdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}
