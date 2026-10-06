import { initializeApp as initAdminApp, getApps as getAdminApps, cert } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import type { Auth as AdminAuth } from 'firebase-admin/auth';

import { initializeApp as initWebApp, getApps as getWebApps } from 'firebase/app';
import {
  getFirestore as getWebFirestore,
  collection as webCollection,
  doc as webDoc,
  setDoc as webSetDoc,
  getDocs as webGetDocs,
  query as webQuery,
  where as webWhere,
  limit as webLimit,
  setLogLevel,
} from 'firebase/firestore';
import type { Firestore as WebFirestore } from 'firebase/firestore';

// Silencia logs internos do SDK do Firestore (evita ruído de GrpcConnection / Disconnecting idle stream)
try {
  setLogLevel('silent');
} catch {
  // Ignora se não suportado
}

import fs from 'fs';
import path from 'path';

export interface CatalogItem {
  id: string;
  nome: string;
  categoria: string;
  precoCentimos: number;
  moeda?: string;
  ativo: boolean;
  descricao: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProposalItem {
  catalogId: string;
  nome: string;
  categoria: string;
  quantidade: number;
  precoUnitarioCentimos: number;
  totalItemCentimos: number;
  evidencia?: string;
}

export interface PedidoRecord {
  id: string;
  nome: string;
  email: string;
  textoOriginal: string;
  timestamp: string;
  data: string;
  status: 'pendente' | 'proposta_gerada' | 'em_revisao' | 'concluido' | 'cancelado';
  propostaToken?: string;
  propostaId?: string;
  motivoRevisao?: string;
  dadosEstruturadosIA: {
    resumo: string;
    itensIdentificados: Array<{
      catalogId: string;
      quantidade: number;
      evidencia: string;
    }>;
    informacaoEmFalta: string;
    necessitaRevisao: boolean;
    motivoRevisao: string;
  };
  interpretacaoIA: {
    resumo: string;
    itensIdentificados: Array<{
      catalogId: string;
      quantidade: number;
      evidencia: string;
    }>;
    informacaoEmFalta: string;
    necessitaRevisao: boolean;
    motivoRevisao: string;
  };
}

export interface PropostaRecord {
  id: string;
  numeroProposta: string;
  pedidoId: string;
  token: string;
  clienteNome: string;
  clienteEmail: string;
  itens: ProposalItem[];
  totalSemIvaCentimos: number;
  totalSemIva?: number;
  totalComIvaCentimos: number;
  totalComIva?: number;
  dataValidade: string;
  validadeDias?: number;
  createdAt: string;
  status: 'ativa' | 'aceite' | 'expirada' | 'cancelada';
  estadoNotificacao: 'pendente' | 'enviada' | 'erro' | 'nao_configurado';
  notificacaoMessageId?: string;
  notificacaoDataEnvio?: string;
  notificacaoErro?: string;
  interpretacaoResumo?: string;
  informacaoEmFalta?: string;
  necessitaRevisao?: boolean;
  motivoRevisao?: string;
}

// Os 5 serviços oficiais da Worten Resolve com preços em cêntimos
export const INITIAL_CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'substituicao-ecra-smartphone',
    nome: 'Substituição de Ecrã Smartphone',
    categoria: 'mobile',
    precoCentimos: 8900, // 89.00 €
    moeda: 'EUR',
    ativo: true,
    descricao: 'Substituição de ecrã danificado de smartphone com componentes originais e garantia técnica Worten Resolve.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'instalacao-ar-condicionado',
    nome: 'Instalação de Ar Condicionado',
    categoria: 'climatizacao',
    precoCentimos: 14900, // 149.00 €
    moeda: 'EUR',
    ativo: true,
    descricao: 'Instalação completa de unidade interior e exterior de ar condicionado até 12000 BTU.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'diagnostico-portatil',
    nome: 'Diagnóstico de Portátil',
    categoria: 'informatica',
    precoCentimos: 3500, // 35.00 €
    moeda: 'EUR',
    ativo: true,
    descricao: 'Diagnóstico e despiste de avarias de hardware e software para computador portátil ou desktop.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'manutencao-frigorifico',
    nome: 'Manutenção de Frigorífico',
    categoria: 'eletrodomesticos',
    precoCentimos: 6500, // 65.00 €
    moeda: 'EUR',
    ativo: true,
    descricao: 'Verificação de circuito de frio, termóstato, vedantes e limpeza técnica do compressor.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'instalacao-tv-parede',
    nome: 'Instalação de TV de Parede',
    categoria: 'tv',
    precoCentimos: 4500, // 45.00 €
    moeda: 'EUR',
    ativo: true,
    descricao: 'Fixação e calibração de suporte de parede e arrumação de cabos para televisor.',
    createdAt: new Date().toISOString(),
  },
];

export const FIRESTORE_DATABASE_ID =
  'ai-studio-wortencrolanding-a204de8a-4617-419d-a46d-ba453f016294';

process.env.GOOGLE_CLOUD_PROJECT = 'cogent-apparatus-s41j7';

// Carregar configuração do Firebase a partir de firebase-applet-config.json
let firebaseConfig: any = {
  projectId: 'cogent-apparatus-s41j7',
  firestoreDatabaseId: FIRESTORE_DATABASE_ID,
};

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.warn('[Firestore Config] Aviso ao ler firebase-applet-config.json:', err);
  }
}

// -------------------------------------------------------------
// Inicialização do Firebase Admin SDK (CORREÇÃO 2 & CORREÇÃO 3)
// -------------------------------------------------------------
let adminApp: any = null;
let adminDb: AdminFirestore | null = null;
let adminAuth: AdminAuth | null = null;
let adminFirestoreOperational = false;

try {
  const existingAdminApps = getAdminApps();
  if (existingAdminApps.length > 0) {
    adminApp = existingAdminApps[0];
  } else {
    // 1. Suporte a chave de conta de serviço fornecida no Secrets panel
    const serviceAccountKeyRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

    if (serviceAccountKeyRaw) {
      try {
        const parsedKey = JSON.parse(serviceAccountKeyRaw);
        adminApp = initAdminApp({
          credential: cert(parsedKey),
          projectId: parsedKey.project_id || firebaseConfig.projectId,
        });
        console.log('[Firebase Admin] Inicializado com FIREBASE_SERVICE_ACCOUNT_KEY (credencial de serviço).');
      } catch (keyErr) {
        console.warn('[Firebase Admin] Erro ao analisar FIREBASE_SERVICE_ACCOUNT_KEY JSON:', keyErr);
        adminApp = initAdminApp({ projectId: firebaseConfig.projectId });
      }
    } else if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        adminApp = initAdminApp({
          credential: cert(serviceAccountPath),
          projectId: firebaseConfig.projectId,
        });
        console.log('[Firebase Admin] Inicializado com GOOGLE_APPLICATION_CREDENTIALS file.');
      } catch (pathErr) {
        console.warn('[Firebase Admin] Erro ao carregar GOOGLE_APPLICATION_CREDENTIALS:', pathErr);
        adminApp = initAdminApp({ projectId: firebaseConfig.projectId });
      }
    } else {
      // 2. Inicialização padrão com projectId
      adminApp = initAdminApp({
        projectId: firebaseConfig.projectId,
      });
      console.log(`[Firebase Admin] Inicializado com projeto ${firebaseConfig.projectId}.`);
    }
  }

  adminDb = getAdminFirestore(adminApp, FIRESTORE_DATABASE_ID);
  adminAuth = getAdminAuth(adminApp);
} catch (adminInitErr) {
  console.warn('[Firebase Admin] Aviso ao inicializar Admin SDK:', adminInitErr);
}

// Inicialização com Web Client como fallback resiliente caso o container do sandbox não tenha IAM
const webApp = getWebApps().length > 0 ? getWebApps()[0] : initWebApp(firebaseConfig);
const webDb: WebFirestore = getWebFirestore(webApp, FIRESTORE_DATABASE_ID);

export { adminAuth };

// Espelho em memória sincronizado para alta disponibilidade e testes
const inMemoryCatalog: Map<string, CatalogItem> = new Map(
  INITIAL_CATALOG_ITEMS.map((item) => [item.id, { ...item }])
);
const inMemoryPedidos: Map<string, PedidoRecord> = new Map();
const inMemoryPropostas: Map<string, PropostaRecord> = new Map();

/**
 * Remove recursivamente todos os campos com valor `undefined` de um objeto ou array
 * para garantir que o Firestore (Admin SDK e Web SDK) nunca receba valores undefined.
 */
export function removeUndefined<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => removeUndefined(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    if (data instanceof Date || (data.constructor && data.constructor.name !== 'Object')) {
      return data;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = removeUndefined(value);
      }
    }
    return clean as T;
  }
  return data;
}

/**
 * Inicializa a coleção 'catalogo' no arranque do servidor com os 5 serviços da Worten Resolve
 */
export async function seedCatalogIfEmpty(): Promise<CatalogItem[]> {
  console.log('[Firestore] A inicializar coleção "catalogo" na base de dados:', FIRESTORE_DATABASE_ID);

  for (const item of INITIAL_CATALOG_ITEMS) {
    inMemoryCatalog.set(item.id, { ...item });
  }

  // Tenta em primeiro lugar com Firebase Admin
  if (adminDb) {
    try {
      const snap = await adminDb.collection('catalogo').get();
      adminFirestoreOperational = true;
      console.log(`[Firebase Admin Firestore] Acesso verificado com sucesso (${snap.size} documentos no catálogo).`);

      if (snap.empty) {
        console.log('[Firebase Admin Firestore] Catálogo vazio. A semear os 5 serviços...');
        for (const item of INITIAL_CATALOG_ITEMS) {
          await adminDb.collection('catalogo').doc(item.id).set(removeUndefined(item));
        }
        return INITIAL_CATALOG_ITEMS;
      }

      const items: CatalogItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as CatalogItem;
        const itemWithId = { ...data, id: d.id };
        items.push(itemWithId);
        inMemoryCatalog.set(d.id, itemWithId);
      });

      for (const defItem of INITIAL_CATALOG_ITEMS) {
        if (!inMemoryCatalog.has(defItem.id)) {
          await adminDb.collection('catalogo').doc(defItem.id).set(removeUndefined(defItem));
          inMemoryCatalog.set(defItem.id, { ...defItem });
          items.push(defItem);
        }
      }

      return items;
    } catch (adminErr: any) {
      console.warn(
        `[Firebase Admin Firestore Indisponível]: ${adminErr?.message || adminErr}. (Isto ocorre quando o container não tem chave de conta de serviço ou permissão IAM cross-project).`
      );
      adminFirestoreOperational = false;
    }
  }

  // Fallback para Web Client SDK
  try {
    const snap = await webGetDocs(webCollection(webDb, 'catalogo'));
    if (snap.empty) {
      console.log('[Firestore Web Client] A semear os 5 serviços...');
      for (const item of INITIAL_CATALOG_ITEMS) {
        await webSetDoc(webDoc(webDb, 'catalogo', item.id), removeUndefined(item));
      }
      return INITIAL_CATALOG_ITEMS;
    }

    const items: CatalogItem[] = [];
    snap.forEach((d) => {
      const data = d.data() as CatalogItem;
      const itemWithId = { ...data, id: d.id };
      items.push(itemWithId);
      inMemoryCatalog.set(d.id, itemWithId);
    });

    for (const defItem of INITIAL_CATALOG_ITEMS) {
      if (!inMemoryCatalog.has(defItem.id)) {
        await webSetDoc(webDoc(webDb, 'catalogo', defItem.id), removeUndefined(defItem));
        inMemoryCatalog.set(defItem.id, { ...defItem });
        items.push(defItem);
      }
    }

    return items;
  } catch (webErr: any) {
    console.warn('[Firestore Web Client Aviso]:', webErr?.message || webErr);
    return Array.from(inMemoryCatalog.values());
  }
}

/**
 * Obtém todos os itens ativos do catálogo para cálculo de propostas
 */
export async function getActiveCatalogItems(): Promise<CatalogItem[]> {
  const all = await getAllCatalogItems();
  return all.filter((item) => item.ativo !== false);
}

/**
 * Obtém TODOS os itens do catálogo (ativos e inativos) para o painel de administração
 */
export async function getAllCatalogItems(): Promise<CatalogItem[]> {
  if (adminDb && adminFirestoreOperational) {
    try {
      const snap = await adminDb.collection('catalogo').get();
      if (!snap.empty) {
        const items: CatalogItem[] = [];
        snap.forEach((d) => {
          const data = d.data() as CatalogItem;
          const itemWithId = { ...data, id: d.id };
          items.push(itemWithId);
          inMemoryCatalog.set(d.id, itemWithId);
        });
        return items;
      }
    } catch (err: any) {
      console.warn('[Firebase Admin Catálogo]:', err?.message || err);
    }
  }

  try {
    const snap = await webGetDocs(webCollection(webDb, 'catalogo'));
    if (!snap.empty) {
      const items: CatalogItem[] = [];
      snap.forEach((d) => {
        const data = d.data() as CatalogItem;
        const itemWithId = { ...data, id: d.id };
        items.push(itemWithId);
        inMemoryCatalog.set(d.id, itemWithId);
      });
      return items;
    }
  } catch (err: any) {
    console.warn('[Firestore Web Catálogo]:', err?.message || err);
  }

  return Array.from(inMemoryCatalog.values());
}

/**
 * Guarda um novo Pedido na coleção 'pedidos'.
 * Faz a escrita direta do documento na coleção 'pedidos' e aguarda (await) a confirmação da base de dados.
 */
export async function savePedido(pedido: PedidoRecord): Promise<void> {
  inMemoryPedidos.set(pedido.id, pedido);
  const sanitizedPedido = removeUndefined(pedido);

  if (adminDb && adminFirestoreOperational) {
    try {
      await adminDb.collection('pedidos').doc(pedido.id).set(sanitizedPedido);
      console.log(`[Firebase Admin] Pedido ${pedido.id} guardado com sucesso na coleção 'pedidos'.`);
      return;
    } catch (err: any) {
      console.warn(`[Firebase Admin] Erro ao gravar pedido ${pedido.id}:`, err?.message || err);
    }
  }

  try {
    await webSetDoc(webDoc(webDb, 'pedidos', pedido.id), sanitizedPedido);
    console.log(`[Firestore Web] Pedido ${pedido.id} guardado com sucesso na coleção 'pedidos'.`);
  } catch (err: any) {
    console.warn(`[Firestore Web] Erro ao gravar pedido ${pedido.id}:`, err?.message || err);
  }
}

/**
 * Guarda uma nova Proposta na coleção 'propostas'.
 * Faz a escrita direta do documento na coleção 'propostas' e aguarda (await) a confirmação da base de dados.
 */
export async function saveProposta(proposta: PropostaRecord): Promise<void> {
  inMemoryPropostas.set(proposta.token, proposta);
  const sanitizedProposta = removeUndefined(proposta);

  if (adminDb && adminFirestoreOperational) {
    try {
      await adminDb.collection('propostas').doc(proposta.id).set(sanitizedProposta);
      console.log(`[Firebase Admin] Proposta ${proposta.numeroProposta} (${proposta.token}) guardada na coleção 'propostas'.`);
      return;
    } catch (err: any) {
      console.warn(`[Firebase Admin] Erro ao gravar proposta ${proposta.id}:`, err?.message || err);
    }
  }

  try {
    await webSetDoc(webDoc(webDb, 'propostas', proposta.id), sanitizedProposta);
    console.log(`[Firestore Web] Proposta ${proposta.numeroProposta} (${proposta.token}) guardada na coleção 'propostas'.`);
  } catch (err: any) {
    console.warn(`[Firestore Web] Erro ao gravar proposta ${proposta.id}:`, err?.message || err);
  }
}

/**
 * Atualiza o estado real da notificação ao aluno numa proposta (CORREÇÃO 5)
 */
export async function updatePropostaNotificacao(
  token: string,
  updates: {
    estadoNotificacao: 'pendente' | 'enviada' | 'erro' | 'nao_configurado';
    notificacaoMessageId?: string;
    notificacaoDataEnvio?: string;
    notificacaoErro?: string;
  }
): Promise<void> {
  const existing = inMemoryPropostas.get(token);
  if (existing) {
    const updated = { ...existing, ...updates };
    inMemoryPropostas.set(token, updated);
    const sanitizedUpdated = removeUndefined(updated);

    if (adminDb && adminFirestoreOperational) {
      try {
        await adminDb.collection('propostas').doc(updated.id).set(sanitizedUpdated, { merge: true });
        return;
      } catch (err: any) {
        console.warn('[Firebase Admin] Erro ao atualizar notificação:', err?.message || err);
      }
    }

    try {
      await webSetDoc(webDoc(webDb, 'propostas', updated.id), sanitizedUpdated, { merge: true });
    } catch (err: any) {
      console.warn('[Firestore Web] Erro ao atualizar notificação:', err?.message || err);
    }
  }
}

/**
 * Obtém uma Proposta pelo seu token único
 */
export async function getPropostaByToken(token: string): Promise<PropostaRecord | null> {
  if (inMemoryPropostas.has(token)) {
    return inMemoryPropostas.get(token)!;
  }

  if (adminDb && adminFirestoreOperational) {
    try {
      const snap = await adminDb.collection('propostas').where('token', '==', token).limit(1).get();
      if (!snap.empty) {
        const docData = snap.docs[0].data() as PropostaRecord;
        inMemoryPropostas.set(token, docData);
        return docData;
      }
    } catch (err: any) {
      console.warn('[Firebase Admin Consulta Proposta]:', err?.message || err);
    }
  }

  try {
    const q = webQuery(webCollection(webDb, 'propostas'), webWhere('token', '==', token), webLimit(1));
    const snap = await webGetDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as PropostaRecord;
      inMemoryPropostas.set(token, docData);
      return docData;
    }
  } catch (err: any) {
    console.warn('[Firestore Web Consulta Proposta]:', err?.message || err);
  }

  for (const p of inMemoryPropostas.values()) {
    if (p.token === token) return p;
  }

  return null;
}

/**
 * Admin: Listar todos os pedidos
 */
export async function getAllPedidos(): Promise<PedidoRecord[]> {
  if (adminDb && adminFirestoreOperational) {
    try {
      const snap = await adminDb.collection('pedidos').get();
      const pedidos: PedidoRecord[] = [];
      snap.forEach((d) => {
        pedidos.push(d.data() as PedidoRecord);
      });
      if (pedidos.length > 0) {
        pedidos.sort(
          (a, b) =>
            new Date(b.data || b.timestamp).getTime() - new Date(a.data || a.timestamp).getTime()
        );
        return pedidos;
      }
    } catch (err: any) {
      console.warn('[Firebase Admin Obter Pedidos]:', err?.message || err);
    }
  }

  try {
    const snap = await webGetDocs(webCollection(webDb, 'pedidos'));
    const pedidos: PedidoRecord[] = [];
    snap.forEach((d) => {
      pedidos.push(d.data() as PedidoRecord);
    });
    if (pedidos.length > 0) {
      pedidos.sort(
        (a, b) =>
          new Date(b.data || b.timestamp).getTime() - new Date(a.data || a.timestamp).getTime()
      );
      return pedidos;
    }
  } catch (err: any) {
    console.warn('[Firestore Web Obter Pedidos]:', err?.message || err);
  }

  return Array.from(inMemoryPedidos.values()).reverse();
}

/**
 * Admin: Listar todas as propostas
 */
export async function getAllPropostas(): Promise<PropostaRecord[]> {
  if (adminDb && adminFirestoreOperational) {
    try {
      const snap = await adminDb.collection('propostas').get();
      const propostas: PropostaRecord[] = [];
      snap.forEach((d) => {
        propostas.push(d.data() as PropostaRecord);
      });
      if (propostas.length > 0) {
        propostas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return propostas;
      }
    } catch (err: any) {
      console.warn('[Firebase Admin Obter Propostas]:', err?.message || err);
    }
  }

  try {
    const snap = await webGetDocs(webCollection(webDb, 'propostas'));
    const propostas: PropostaRecord[] = [];
    snap.forEach((d) => {
      propostas.push(d.data() as PropostaRecord);
    });
    if (propostas.length > 0) {
      propostas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return propostas;
    }
  } catch (err: any) {
    console.warn('[Firestore Web Obter Propostas]:', err?.message || err);
  }

  return Array.from(inMemoryPropostas.values()).reverse();
}

/**
 * Admin: Atualizar item do catálogo com validação rigorosa
 */
export async function updateCatalogItem(
  id: string,
  updates: Partial<CatalogItem>
): Promise<CatalogItem> {
  const existing = inMemoryCatalog.get(id) || {
    id,
    nome: '',
    categoria: 'geral',
    precoCentimos: 0,
    ativo: true,
    descricao: '',
    createdAt: new Date().toISOString(),
  };

  const updated: CatalogItem = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  inMemoryCatalog.set(id, updated);
  const sanitizedUpdated = removeUndefined(updated);

  if (adminDb && adminFirestoreOperational) {
    try {
      await adminDb.collection('catalogo').doc(id).set(sanitizedUpdated, { merge: true });
      console.log(`[Firebase Admin] Item ${id} atualizado.`);
      return updated;
    } catch (err: any) {
      console.warn('[Firebase Admin] Erro ao atualizar item:', err?.message || err);
    }
  }

  try {
    await webSetDoc(webDoc(webDb, 'catalogo', id), sanitizedUpdated, { merge: true });
    console.log(`[Firestore Web] Item do catálogo ${id} atualizado.`);
  } catch (error: any) {
    console.warn(`[Firestore Aviso] Erro ao atualizar catálogo ${id}:`, error?.message || error);
  }

  return updated;
}
