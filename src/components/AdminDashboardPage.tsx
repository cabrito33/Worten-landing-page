import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  ExternalLink,
  Copy,
  Search,
  Sparkles,
  ArrowLeft,
  Loader2,
  Save,
  X,
  Plus,
} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser } from '../firebase';
import type { CatalogItem, PedidoRecord, PropostaRecord } from '../server/firebaseAdmin.ts';

interface AdminDashboardPageProps {
  onNavigateHome: () => void;
  onOpenProposal: (token: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateHome,
  onOpenProposal,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [serverConfig, setServerConfig] = useState<{
    adminUidConfigured: boolean;
    adminUid: string | null;
    studentEmail: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'pedidos' | 'catalogo' | 'propostas'>('pedidos');

  // Dados
  const [pedidos, setPedidos] = useState<PedidoRecord[]>([]);
  const [catalogo, setCatalogo] = useState<CatalogItem[]>([]);
  const [propostas, setPropostas] = useState<PropostaRecord[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Edição de Catálogo
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editPriceEuros, setEditPriceEuros] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Monitorar estado de autenticação Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Obter configuração do servidor (ADMIN_UID)
  useEffect(() => {
    fetch('/api/admin/config')
      .then((res) => res.json())
      .then((data) => setServerConfig(data))
      .catch((err) => console.warn('Erro ao obter admin config:', err));
  }, []);

  // Verificação de autorização com base no UID
  const isAuthorized = Boolean(
    currentUser &&
      (!serverConfig?.adminUidConfigured ||
        currentUser.uid === serverConfig?.adminUid ||
        currentUser.email === serverConfig?.studentEmail)
  );

  // 3. Carregar dados se autorizado
  const loadAdminData = async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const headers: Record<string, string> = {
        'x-admin-uid': currentUser.uid,
        'x-admin-email': currentUser.email || '',
      };

      const [resPedidos, resCat, resProp] = await Promise.all([
        fetch('/api/admin/pedidos', { headers }),
        fetch('/api/admin/catalogo', { headers }),
        fetch('/api/admin/propostas', { headers }),
      ]);

      const [dataPedidos, dataCat, dataProp] = await Promise.all([
        resPedidos.json(),
        resCat.json(),
        resProp.json(),
      ]);

      if (dataPedidos.success) setPedidos(dataPedidos.pedidos || []);
      if (dataCat.success) setCatalogo(dataCat.catalogo || []);
      if (dataProp.success) setPropostas(dataProp.propostas || []);
    } catch (err) {
      console.error('Erro ao carregar dados de administração:', err);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && currentUser) {
      loadAdminData();
    }
  }, [isAuthorized, currentUser]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      alert('Falha ao autenticar com Google: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setActionMsg(`${label} copiado para a área de transferência!`);
    setTimeout(() => setActionMsg(null), 3000);
  };

  const startEditCatalog = (item: CatalogItem) => {
    setEditingItem({ ...item });
    setEditPriceEuros((item.precoCentimos / 100).toFixed(2));
  };

  const saveCatalogChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !currentUser) return;

    setSavingEdit(true);
    try {
      const priceEurosNum = parseFloat(editPriceEuros.replace(',', '.'));
      const precoCentimos = Math.round(priceEurosNum * 100);

      if (isNaN(precoCentimos) || precoCentimos < 0) {
        alert('Por favor, insira um preço válido em euros.');
        setSavingEdit(false);
        return;
      }

      const res = await fetch(`/api/admin/catalogo/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-uid': currentUser.uid,
          'x-admin-email': currentUser.email || '',
        },
        body: JSON.stringify({
          ...editingItem,
          precoCentimos,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao guardar.');
      }

      setCatalogo((prev) =>
        prev.map((c) => (c.id === editingItem.id ? data.item : c))
      );
      setEditingItem(null);
      setActionMsg(`Serviço "${data.item.nome}" atualizado no Firestore!`);
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      alert('Erro ao atualizar item do catálogo: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // 1. Tela de Carregamento
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl max-w-sm w-full border border-neutral-200 dark:border-neutral-800">
          <Loader2 className="w-10 h-10 animate-spin text-[#DE001A] mx-auto mb-4" />
          <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">A verificar credenciais Firebase...</p>
        </div>
      </div>
    );
  }

  // 2. Tela de Login (Não Autenticado)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#DE001A] text-white flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-lg shadow-red-500/20">
            W
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-[#DE001A] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Worten Resolve · Painel Admin
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Autenticação de Administrador
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 mb-8 leading-relaxed">
            Área protegida por Firebase Authentication. Faça login com a sua conta Google para gerir os pedidos dos clientes, consultar propostas geradas e editar os preços do catálogo.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            className="w-full py-4 px-6 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-emerald-400" />
            Entrar com Google (Firebase Auth)
          </button>

          <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar à Loja Worten
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Tela de Bloqueio por UID Não Autorizado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-amber-300 dark:border-amber-900/50 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Acesso Restrito ao Administrador
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
            A sua conta Google foi autenticada com sucesso, mas o seu UID não coincide com o <code>ADMIN_UID</code> configurado no servidor.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 text-left border border-neutral-200 dark:border-neutral-700 space-y-2">
            <div>
              <span className="text-[11px] font-bold uppercase text-neutral-500">O Seu UID (Firebase):</span>
              <div className="flex items-center justify-between font-mono text-xs font-bold text-neutral-900 dark:text-white break-all bg-white dark:bg-neutral-900 p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 mt-1">
                <span>{currentUser.uid}</span>
                <button
                  onClick={() => copyToClipboard(currentUser.uid, 'UID')}
                  className="p-1 hover:text-[#DE001A] transition cursor-pointer"
                  title="Copiar UID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-neutral-500">ADMIN_UID Esperado no Servidor:</span>
              <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
                {serverConfig?.adminUid || 'Não definido nas variáveis de ambiente'}
              </p>
            </div>
          </div>

          {actionMsg && (
            <div className="mt-3 text-xs text-emerald-600 font-bold">
              {actionMsg}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => copyToClipboard(currentUser.uid, 'UID')}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-xs hover:bg-black transition cursor-pointer"
            >
              Copiar o Meu UID
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl bg-red-50 text-[#DE001A] font-bold text-xs hover:bg-red-100 transition cursor-pointer"
            >
              Trocar de Conta
            </button>
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-100 transition cursor-pointer"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Painel de Administração Autorizado
  return (
    <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans pb-16">
      {/* Notificação Toast */}
      {actionMsg && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Barra de Navegação do Admin */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition cursor-pointer"
              title="Voltar à Loja"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DE001A] text-white flex items-center justify-center font-black text-xl shadow-md">
                W
              </div>
              <div>
                <h1 className="text-base font-black text-neutral-900 dark:text-white leading-tight">
                  Worten Resolve · Painel Admin
                </h1>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Gestão de Pedidos, Propostas e Catálogo no Firestore
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-neutral-900 dark:text-white">
                {currentUser.displayName || currentUser.email}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Admin Autorizado
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 hover:text-[#DE001A] text-neutral-700 dark:text-neutral-300 text-xs font-bold transition cursor-pointer"
              title="Terminar Sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Separadores das Secções */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 border-t border-neutral-100 dark:border-neutral-800/80 text-sm font-bold">
          <button
            onClick={() => setActiveTab('pedidos')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pedidos'
                ? 'border-[#DE001A] text-[#DE001A]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Pedidos de Clientes ({pedidos.length})
          </button>

          <button
            onClick={() => setActiveTab('catalogo')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'catalogo'
                ? 'border-[#DE001A] text-[#DE001A]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo de Serviços ({catalogo.length})
          </button>

          <button
            onClick={() => setActiveTab('propostas')}
            className={`py-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'propostas'
                ? 'border-[#DE001A] text-[#DE001A]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Propostas Emitidas ({propostas.length})
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {dataLoading && (
          <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#DE001A] mx-auto mb-2" />
            <p className="text-xs text-neutral-500">A sincronizar com o Cloud Firestore...</p>
          </div>
        )}

        {/* TAB 1: PEDIDOS */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  Pedidos Recebidos na Landing Page
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Submissões com interpretação estruturada gerada pelo Gemini 2.5 Flash
                </p>
              </div>

              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, email ou avaria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#DE001A]"
                />
              </div>
            </div>

            {pedidos.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">Ainda não existem pedidos</h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Submeta um pedido no formulário da página principal para testar o fluxo completo com IA e Firestore.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pedidos
                  .filter((p) => {
                    const s = searchTerm.toLowerCase();
                    return (
                      p.nome.toLowerCase().includes(s) ||
                      p.email.toLowerCase().includes(s) ||
                      p.textoOriginal.toLowerCase().includes(s)
                    );
                  })
                  .map((pedido) => (
                    <div
                      key={pedido.id}
                      className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-base text-neutral-900 dark:text-white">
                              {pedido.nome}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                pedido.status === 'proposta_gerada'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                            >
                              {pedido.status === 'proposta_gerada' ? 'Proposta Gerada' : 'Em Revisão'}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-3">
                            <span>{pedido.email}</span>
                            <span>•</span>
                            <span>
                              {new Date(pedido.data).toLocaleString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {pedido.propostaToken && (
                          <button
                            type="button"
                            onClick={() => onOpenProposal(pedido.propostaToken!)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold shadow-md transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir Proposta Gerada
                          </button>
                        )}
                      </div>

                      {/* Texto Original */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-[#F8F9FA] dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs">
                        <span className="font-bold text-neutral-500 block mb-1">Texto Original do Cliente:</span>
                        <p className="text-neutral-800 dark:text-neutral-200 italic leading-relaxed">
                          &ldquo;{pedido.textoOriginal}&rdquo;
                        </p>
                      </div>

                      {/* Interpretação Estruturada da IA */}
                      {pedido.interpretacaoIA && (
                        <div className="mt-3 p-4 rounded-2xl bg-red-50/40 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold text-[#DE001A]">
                            <Sparkles className="w-4 h-4" />
                            Interpretação Estruturada Gemini:
                          </div>
                          <p className="text-neutral-700 dark:text-neutral-300">
                            <strong>Resumo:</strong> {pedido.interpretacaoIA.resumo}
                          </p>

                          {pedido.interpretacaoIA.itensIdentificados?.length > 0 && (
                            <div>
                              <strong>Serviços Identificados:</strong>
                              <ul className="mt-1 list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
                                {pedido.interpretacaoIA.itensIdentificados.map((it, idx) => (
                                  <li key={idx}>
                                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                      {it.catalogId}
                                    </span>{' '}
                                    (Qtd: {it.quantidade}) — {it.evidencia}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {pedido.interpretacaoIA.necessitaRevisao && (
                            <div className="text-amber-800 dark:text-amber-300 font-medium">
                              ⚠️ <strong>Motivo de Revisão:</strong> {pedido.interpretacaoIA.motivoRevisao}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  Catálogo de Serviços da Worten Resolve
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Preços oficiais armazenados em cêntimos no Firestore. Usados estritamente pelo backend para calcular propostas.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Nome do Serviço</th>
                      <th className="py-3 px-3 text-center">Categoria</th>
                      <th className="py-3 px-4 text-right">Preço (Cêntimos)</th>
                      <th className="py-3 px-4 text-right">Preço em Euros (€)</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {catalogo.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-500">
                          {item.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900 dark:text-white">
                          <div>{item.nome}</div>
                          <div className="text-[11px] font-normal text-neutral-500 line-clamp-1">
                            {item.descricao}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold uppercase">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-neutral-700 dark:text-neutral-300">
                          {item.precoCentimos} cêntimos
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#DE001A] text-base">
                          {(item.precoCentimos / 100).toFixed(2)} €
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.ativo
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {item.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => startEditCatalog(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROPOSTAS */}
        {activeTab === 'propostas' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                  Propostas Comerciais Geradas
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Todas as propostas registadas na coleção Firestore &apos;propostas&apos; com tokens únicos e validade de 15 dias
                </p>
              </div>
            </div>

            {propostas.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800">
                <Sparkles className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                <h3 className="font-bold text-base text-neutral-800 dark:text-neutral-200">Ainda não foram geradas propostas</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {propostas.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-bold text-xs text-[#DE001A] bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg">
                          {prop.numeroProposta}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(prop.createdAt).toLocaleDateString('pt-PT')}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                        {prop.clienteNome}
                      </h3>
                      <p className="text-xs text-neutral-500">{prop.clienteEmail}</p>

                      <div className="mt-3 py-2 border-y border-neutral-100 dark:border-neutral-800 flex justify-between text-xs">
                        <span>Itens: {prop.itens.length}</span>
                        <span>Total s/ IVA: {(prop.totalSemIvaCentimos / 100).toFixed(2)} €</span>
                        <span className="font-black text-[#DE001A]">
                          Total c/ IVA: {(prop.totalComIvaCentimos / 100).toFixed(2)} €
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-neutral-500">
                        Válida até: {new Date(prop.dataValidade).toLocaleDateString('pt-PT')} (15 dias)
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`${window.location.origin}/proposta/${prop.token}`, 'Link público')}
                        className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Copiar Link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Link
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenProposal(prop.token)}
                        className="px-4 py-2 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver Proposta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Edição de Serviço do Catálogo */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                Editar Serviço do Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveCatalogChanges} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.nome}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nome: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                  Preço em Euros (€) <span className="text-neutral-400 font-normal">(Convertido para cêntimos no Firestore)</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPriceEuros}
                  onChange={(e) => setEditPriceEuros(e.target.value)}
                  placeholder="Ex: 89.00"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm font-black text-[#DE001A]"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Valor equivalente: {Math.round((parseFloat(editPriceEuros || '0') || 0) * 100)} cêntimos
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={editingItem.descricao}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, descricao: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={editingItem.ativo}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, ativo: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-[#DE001A] focus:ring-[#DE001A]"
                />
                <label htmlFor="ativoCheckbox" className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Serviço Ativo para Seleção na IA
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 font-bold text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
