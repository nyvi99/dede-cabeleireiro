import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Persistent database path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface User {
  id: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: string;
}

interface QueueItem {
  id: string;
  nome: string;
  horario: string;
  status: 'aguardando' | 'atendendo' | 'finalizado';
  createdAt: number;
}

interface FidelityCard {
  id: string;
  codigo: string;
  nome: string;
  telefone?: string;
  totalCortes: number;
  cortesCiclo: number;
  createdAt: string;
  updatedAt: string;
}

interface AppData {
  users: User[];
  barbeariaAberta: boolean;
  horarios: string;
  valorCorte: number;
  pix: {
    chave: string;
    nomeRecebedor: string;
    cidadeRecebedor: string;
    pixCopiaColaOpcional: string;
    whatsapp: string;
  };
  fidelidadeConfig: {
    promocaoAtiva: boolean;
    cortesParaGanhar: number;
  };
  aviso: string | null;
  fila: QueueItem[];
  cartoes: FidelityCard[];
}

// Initial seed matching user screenshots
const defaultData: AppData = {
  users: [],
  barbeariaAberta: true,
  horarios: 'Seg a Sáb: 8h às 12h Manhã\nA Tarde das 14:30 às 17:30',
  valorCorte: 20,
  pix: {
    chave: '47943015000157',
    nomeRecebedor: 'Romilton Andre Sales Santos',
    cidadeRecebedor: 'PARAMIRIM-BAHIA',
    pixCopiaColaOpcional: '',
    whatsapp: '77998614589',
  },
  fidelidadeConfig: {
    promocaoAtiva: true,
    cortesParaGanhar: 6,
  },
  aviso: null,
  fila: [
    {
      id: 'q-seed-1',
      nome: 'Sun',
      horario: '10:37',
      status: 'finalizado',
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: 'q-seed-2',
      nome: 'Filho de betim',
      horario: '14:36',
      status: 'finalizado',
      createdAt: Date.now() - 3600000,
    },
  ],
  cartoes: [
    {
      id: 'c-1',
      codigo: '63A95C',
      nome: 'Abner',
      telefone: '',
      totalCortes: 5,
      cortesCiclo: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-2',
      codigo: '144D2D',
      nome: 'Adão',
      telefone: '',
      totalCortes: 2,
      cortesCiclo: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-3',
      codigo: 'B5B419',
      nome: 'Adria',
      telefone: '',
      totalCortes: 2,
      cortesCiclo: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'c-4',
      codigo: '8C18AD',
      nome: 'Adriano arraial',
      telefone: '',
      totalCortes: 0,
      cortesCiclo: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'dede_barber_salt_2026').digest('hex');
}

function loadDatabase(): AppData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch (err) {
    console.error('Failed to load DB, using defaults', err);
    return defaultData;
  }
}

function saveDatabase(data: AppData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB', err);
  }
}

let db = loadDatabase();

// In-memory sessions
const activeSessions = new Map<string, { userId: string; email: string; isAdmin: boolean }>();

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate standard EMV PIX string
function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function calculateCrc16(str: string): string {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePixPayload(key: string, name: string, city: string, amount: number): string {
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
    .toUpperCase();
  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
    .toUpperCase();

  const formattedAmount = amount > 0 ? amount.toFixed(2) : '';

  let merchantAccount = formatField('00', 'br.gov.bcb.pix');
  merchantAccount += formatField('01', key.trim());

  let payload = '';
  payload += formatField('00', '01');
  payload += formatField('26', merchantAccount);
  payload += formatField('52', '0000');
  payload += formatField('53', '986');
  if (formattedAmount) {
    payload += formatField('54', formattedAmount);
  }
  payload += formatField('58', 'BR');
  payload += formatField('59', cleanName || 'DEDE CABELEIREIRO');
  payload += formatField('60', cleanCity || 'PARAMIRIM');
  payload += formatField('62', formatField('05', '***'));
  payload += '6304';

  const crc = calculateCrc16(payload);
  return payload + crc;
}

// Public state endpoint
app.get('/api/state', (_req, res) => {
  const { chave, nomeRecebedor, cidadeRecebedor, pixCopiaColaOpcional, whatsapp } = db.pix;
  const pixPayload = pixCopiaColaOpcional && pixCopiaColaOpcional.trim().length > 0
    ? pixCopiaColaOpcional.trim()
    : generatePixPayload(chave, nomeRecebedor, cidadeRecebedor, db.valorCorte);

  res.json({
    barbeariaAberta: db.barbeariaAberta,
    horarios: db.horarios,
    valorCorte: db.valorCorte,
    pix: {
      chave,
      nomeRecebedor,
      cidadeRecebedor,
      pixCopiaColaOpcional,
      whatsapp,
      payloadGerado: pixPayload,
    },
    fidelidadeConfig: db.fidelidadeConfig,
    aviso: db.aviso,
    fila: db.fila,
    hasAdmin: db.users.some(u => u.isAdmin),
    totalUsers: db.users.length,
  });
});

// Auth middleware helper
function checkAdminAuth(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const session = activeSessions.get(token);
  return Boolean(session && session.isAdmin);
}

// Authentication endpoints: allow creating the admin account once
app.post('/api/auth/register', (req, res) => {
  const hasAdmin = db.users.some(u => u.isAdmin);
  if (hasAdmin) {
    return res.status(403).json({
      error: 'Apenas a conta de administrador configurada possui acesso a este painel.',
    });
  }

  const { email, password } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail.length < 3 || password.length < 4) {
    return res.status(400).json({ error: 'Credenciais inválidas. Senha deve ter pelo menos 4 caracteres.' });
  }

  const newUser: User = {
    id: 'user-' + Date.now(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    isAdmin: true,
    createdAt: new Date().toISOString(),
  };

  db.users = [newUser];
  saveDatabase(db);

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    userId: newUser.id,
    email: newUser.email,
    isAdmin: newUser.isAdmin,
  });

  return res.json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    },
    message: 'Conta de administrador criada com sucesso!',
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Esta conta não possui privilégios de administrador.' });
  }

  const token = crypto.randomUUID();
  activeSessions.set(token, {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ user: null });
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ user: null });
  }
  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ user: null });
  }
  return res.json({ user: session });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    activeSessions.delete(token);
  }
  return res.json({ success: true });
});

// Admin Queue Management
app.post('/api/admin/toggle-aberta', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { aberta } = req.body;
  db.barbeariaAberta = typeof aberta === 'boolean' ? aberta : !db.barbeariaAberta;
  saveDatabase(db);
  res.json({ barbeariaAberta: db.barbeariaAberta });
});

app.post('/api/admin/fila/add', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
  }

  const now = new Date();
  const horario = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const item: QueueItem = {
    id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    nome: nome.trim(),
    horario,
    status: 'aguardando',
    createdAt: Date.now(),
  };

  db.fila.push(item);
  saveDatabase(db);
  res.json({ item, fila: db.fila });
});

app.post('/api/fila/join', (req, res) => {
  if (!db.barbeariaAberta) {
    return res.status(400).json({ error: 'A barbearia está fechada no momento.' });
  }
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Informe seu nome.' });
  }

  const now = new Date();
  const horario = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const item: QueueItem = {
    id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    nome: nome.trim(),
    horario,
    status: 'aguardando',
    createdAt: Date.now(),
  };

  db.fila.push(item);
  saveDatabase(db);
  res.json({ item, fila: db.fila });
});

app.post('/api/admin/fila/advance', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });

  let advanced = false;
  for (const item of db.fila) {
    if (item.status === 'atendendo') {
      item.status = 'finalizado';
      advanced = true;
    }
  }

  const nextWaiting = db.fila.find(item => item.status === 'aguardando');
  if (nextWaiting) {
    nextWaiting.status = 'atendendo';
    advanced = true;
  }

  saveDatabase(db);
  res.json({ fila: db.fila, message: advanced ? 'Fila avançada!' : 'Nenhum cliente para avançar.' });
});

app.post('/api/admin/fila/status', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { id, status } = req.body;
  const item = db.fila.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item não encontrado na fila.' });

  if (['aguardando', 'atendendo', 'finalizado'].includes(status)) {
    if (status === 'atendendo') {
      db.fila.forEach(i => {
        if (i.id !== id && i.status === 'atendendo') {
          i.status = 'finalizado';
        }
      });
    }
    item.status = status;
    saveDatabase(db);
  }
  res.json({ fila: db.fila });
});

app.delete('/api/admin/fila/:id', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { id } = req.params;
  db.fila = db.fila.filter(i => i.id !== id);
  saveDatabase(db);
  res.json({ fila: db.fila });
});

app.post('/api/admin/fila/clear-finalizados', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  db.fila = db.fila.filter(i => i.status !== 'finalizado');
  saveDatabase(db);
  res.json({ fila: db.fila });
});

// Admin Store Settings
app.post('/api/admin/loja', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { horarios, valorCorte, pix, fidelidadeConfig } = req.body;

  if (horarios !== undefined) db.horarios = String(horarios);
  if (valorCorte !== undefined) db.valorCorte = Number(valorCorte) || 20;

  if (pix) {
    db.pix = {
      chave: String(pix.chave || db.pix.chave),
      nomeRecebedor: String(pix.nomeRecebedor || db.pix.nomeRecebedor),
      cidadeRecebedor: String(pix.cidadeRecebedor || db.pix.cidadeRecebedor),
      pixCopiaColaOpcional: String(pix.pixCopiaColaOpcional ?? db.pix.pixCopiaColaOpcional),
      whatsapp: String(pix.whatsapp || db.pix.whatsapp).replace(/\D/g, ''),
    };
  }

  if (fidelidadeConfig) {
    db.fidelidadeConfig = {
      promocaoAtiva: Boolean(fidelidadeConfig.promocaoAtiva),
      cortesParaGanhar: Number(fidelidadeConfig.cortesParaGanhar) || 6,
    };
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Configurações salvas com sucesso!' });
});

// Admin Avisos
app.post('/api/admin/aviso', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { aviso } = req.body;
  db.aviso = aviso ? String(aviso).trim() : null;
  saveDatabase(db);
  res.json({ aviso: db.aviso, message: db.aviso ? 'Aviso publicado!' : 'Aviso removido.' });
});

// Fidelity Cards Endpoints
app.get('/api/admin/fidelidade', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  res.json({ cartoes: db.cartoes });
});

app.post('/api/admin/fidelidade', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { nome, telefone } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome do cliente é obrigatório.' });
  }

  let codigo = generateRandomCode();
  while (db.cartoes.some(c => c.codigo.toUpperCase() === codigo)) {
    codigo = generateRandomCode();
  }

  const novoCartao: FidelityCard = {
    id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    codigo,
    nome: nome.trim(),
    telefone: telefone ? String(telefone).trim() : '',
    totalCortes: 0,
    cortesCiclo: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.cartoes.unshift(novoCartao);
  saveDatabase(db);
  res.json({ cartao: novoCartao, cartoes: db.cartoes });
});

app.post('/api/admin/fidelidade/:id/corte', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { id } = req.params;
  const { delta } = req.body;
  const card = db.cartoes.find(c => c.id === id);
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado.' });

  const change = Number(delta) || 1;
  const maxCiclo = db.fidelidadeConfig.cortesParaGanhar || 6;

  if (change > 0) {
    card.totalCortes += 1;
    card.cortesCiclo += 1;
    if (card.cortesCiclo > maxCiclo) {
      card.cortesCiclo = 1;
    }
  } else if (change < 0 && card.totalCortes > 0) {
    card.totalCortes -= 1;
    card.cortesCiclo = Math.max(0, card.cortesCiclo - 1);
  }

  card.updatedAt = new Date().toISOString();
  saveDatabase(db);
  res.json({ cartao: card, cartoes: db.cartoes });
});

app.delete('/api/admin/fidelidade/:id', (req, res) => {
  if (!checkAdminAuth(req)) return res.status(403).json({ error: 'Acesso não autorizado.' });
  const { id } = req.params;
  db.cartoes = db.cartoes.filter(c => c.id !== id);
  saveDatabase(db);
  res.json({ cartoes: db.cartoes });
});

// Public Fidelity Lookup by Code
app.get('/api/fidelidade/lookup/:codigo', (req, res) => {
  const code = req.params.codigo.trim().toUpperCase();
  const card = db.cartoes.find(c => c.codigo.toUpperCase() === code);
  if (!card) {
    return res.status(404).json({ error: 'Cartão não encontrado para este código.' });
  }

  res.json({
    codigo: card.codigo,
    nome: card.nome,
    totalCortes: card.totalCortes,
    cortesCiclo: card.cortesCiclo,
    metaCiclo: db.fidelidadeConfig.cortesParaGanhar || 6,
    promocaoAtiva: db.fidelidadeConfig.promocaoAtiva,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Dedé Cabeleireiro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
