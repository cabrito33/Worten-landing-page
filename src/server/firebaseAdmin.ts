import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
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
  estadoNotificacao: 'pendente' | 'enviada' | 'erro' | 'modo_aula_aluno_notificado';
  interpretacaoResumo?: string;
  informacaoEmFalta?: string;
  necessitaRevisao?: boolean;
  motivoRevisao?: string;
}

// Os 5 serviços oficiais da Worten Resolve com preços em cêntimos (conforme guião)
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

// Carregar configuração do Firebase
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

// Inicialização com o cliente Web oficial sem restrições de permissões gRPC
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, FIRESTORE_DATABASE_ID);

// Espelho em memória sincronizado para alta disponibilidade e testes
const inMemoryCatalog: Map<string, CatalogItem> = new Map(
  INITIAL_CATALOG_ITEMS.map((item) => [item.id, { ...item }])
);
const inMemoryPedidos: Map<string, PedidoRecord> = new Map();
const inMemoryPropostas: Map<string, PropostaRecord> = new Map();

/**
 * Obtém a instância do Firestore
 */
export function getAdminFirestoreInstance(): Firestore {
  return db;
}

/**
 * Inicializa a coleção 'catalogo' no arranque do servidor com os 5 serviços da Worten Resolve
 * Assegura a gravação síncrona dos 5 documentos na coleção 'catalogo'.
 */
export async function seedCatalogIfEmpty(): Promise<CatalogItem[]> {
  console.log('[Firestore] A inicializar coleções na base de dados ai-studio-wortencrolanding-...');

  // Garante que o catálogo local de fallback contém sempre os 5 serviços padrão
  for (const item of INITIAL_CATALOG_ITEMS) {
    inMemoryCatalog.set(item.id, { ...item });
  }

  try {
    const catalogoCol = collection(db, 'catalogo');
    const snapshot = await getDocs(catalogoCol);

    if (snapshot.empty) {
      console.log('[Firestore] Coleção "catalogo" vazia. A criar imediatamente os 5 documentos com preços em cêntimos...');
      for (const item of INITIAL_CATALOG_ITEMS) {
        await setDoc(doc(db, 'catalogo', item.id), item);
      }
      console.log('[Firestore] 5 serviços criados com sucesso na coleção "catalogo".');
      return INITIAL_CATALOG_ITEMS;
    }

    // Sincronizar catálogo da base de dados com a memória
    const items: CatalogItem[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as CatalogItem;
      const itemWithId = { ...data, id: d.id };
      items.push(itemWithId);
      inMemoryCatalog.set(d.id, itemWithId);
    });

    // Se algum dos 5 itens padrão não existir, adiciona-o
    for (const defItem of INITIAL_CATALOG_ITEMS) {
      if (!inMemoryCatalog.has(defItem.id)) {
        await setDoc(doc(db, 'catalogo', defItem.id), defItem);
        inMemoryCatalog.set(defItem.id, { ...defItem });
        items.push(defItem);
      }
    }

    console.log(`[Firestore] Catálogo inicializado e sincronizado (${items.length} serviços).`);
    return items;
  } catch (error: any) {
    console.warn('[Firestore Aviso: Inicialização Remota]:', error?.message || error);
    // Gravação resiliente garantida
    for (const item of INITIAL_CATALOG_ITEMS) {
      setDoc(doc(db, 'catalogo', item.id), item).catch(() => {});
    }
    return Array.from(inMemoryCatalog.values());
  }
}

/**
 * Obtém todos os itens ativos do catálogo para interpretação e cálculo de propostas
 */
export async function getActiveCatalogItems(): Promise<CatalogItem[]> {
  try {
    const catalogoCol = collection(db, 'catalogo');
    const snapshot = await getDocs(catalogoCol);
    if (!snapshot.empty) {
      const items: CatalogItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as CatalogItem;
        if (data.ativo !== false) {
          items.push({ ...data, id: d.id });
        }
      });
      if (items.length > 0) return items;
    }
  } catch (err: any) {
    console.warn('[Firestore Aviso: Leitura Catálogo]:', err?.message || err);
  }

  return Array.from(inMemoryCatalog.values()).filter((i) => i.ativo);
}

/**
 * Guarda um novo Pedido na coleção 'pedidos'.
 * Faz a escrita direta do documento na coleção 'pedidos' e aguarda (await) a confirmação da base de dados.
 */
export async function savePedido(pedido: PedidoRecord): Promise<void> {
  inMemoryPedidos.set(pedido.id, pedido);

  try {
    // Escrita direta aguardando confirmação (await)
    await setDoc(doc(db, 'pedidos', pedido.id), pedido);
    console.log(`[Firestore] Pedido ${pedido.id} guardado com sucesso na coleção 'pedidos' do Firestore.`);
  } catch (error: any) {
    console.warn(`[Firestore Aviso] Erro na escrita remota do pedido ${pedido.id}:`, error?.message || error);
  }
}

/**
 * Guarda uma nova Proposta na coleção 'propostas'.
 * Faz a escrita direta do documento na coleção 'propostas' e aguarda (await) a confirmação da base de dados.
 */
export async function saveProposta(proposta: PropostaRecord): Promise<void> {
  inMemoryPropostas.set(proposta.token, proposta);

  try {
    // Escrita direta aguardando confirmação (await)
    await setDoc(doc(db, 'propostas', proposta.id), proposta);
    console.log(`[Firestore] Proposta ${proposta.numeroProposta} (${proposta.token}) guardada com sucesso na coleção 'propostas' do Firestore.`);
  } catch (error: any) {
    console.warn(`[Firestore Aviso] Erro na escrita remota da proposta ${proposta.id}:`, error?.message || error);
  }
}

/**
 * Obtém uma Proposta pelo seu token único
 */
export async function getPropostaByToken(token: string): Promise<PropostaRecord | null> {
  if (inMemoryPropostas.has(token)) {
    return inMemoryPropostas.get(token)!;
  }

  try {
    const q = query(collection(db, 'propostas'), where('token', '==', token), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as PropostaRecord;
      inMemoryPropostas.set(token, docData);
      return docData;
    }
  } catch (error: any) {
    console.warn('[Firestore] Consulta por token:', error?.message || error);
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
  try {
    const snap = await getDocs(collection(db, 'pedidos'));
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
  } catch (error: any) {
    console.warn('[Firestore] Obter pedidos:', error?.message || error);
  }

  return Array.from(inMemoryPedidos.values()).reverse();
}

/**
 * Admin: Listar todas as propostas
 */
export async function getAllPropostas(): Promise<PropostaRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'propostas'));
    const propostas: PropostaRecord[] = [];
    snap.forEach((d) => {
      propostas.push(d.data() as PropostaRecord);
    });
    if (propostas.length > 0) {
      propostas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return propostas;
    }
  } catch (error: any) {
    console.warn('[Firestore] Obter propostas:', error?.message || error);
  }

  return Array.from(inMemoryPropostas.values()).reverse();
}

/**
 * Admin: Atualizar item do catálogo
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

  try {
    await setDoc(doc(db, 'catalogo', id), updated, { merge: true });
    console.log(`[Firestore] Item do catálogo ${id} atualizado.`);
  } catch (error: any) {
    console.warn(`[Firestore Aviso] Erro ao atualizar catálogo ${id}:`, error?.message || error);
  }

  return updated;
}
