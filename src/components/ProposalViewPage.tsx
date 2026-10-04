import React, { useEffect, useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Share2,
  HelpCircle,
  ExternalLink,
  Phone,
  Sparkles,
} from 'lucide-react';
import type { PropostaRecord } from '../server/firebaseAdmin.ts';

interface ProposalViewPageProps {
  token: string;
  onNavigateHome: () => void;
  onOpenAssistant?: () => void;
}

export const ProposalViewPage: React.FC<ProposalViewPageProps> = ({
  token,
  onNavigateHome,
  onOpenAssistant,
}) => {
  const [proposta, setProposta] = useState<PropostaRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);

  useEffect(() => {
    // Impede a indexação por motores de busca (CORREÇÃO 4)
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    let created = false;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
      created = true;
    }
    const previous = robotsMeta.content;
    robotsMeta.content = 'noindex, nofollow';

    return () => {
      if (created) {
        robotsMeta.remove();
      } else {
        robotsMeta.content = previous;
      }
    };
  }, []);

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/propostas/${token}`);
        const data = await res.json();
        if (res.status === 410) {
          throw new Error('Esta proposta expirou.');
        }
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Proposta não encontrada.');
        }
        setProposta(data.proposta);
      } catch (err: any) {
        console.error('Erro ao carregar proposta:', err);
        setError(err.message || 'Não foi possível carregar a proposta com o token fornecido.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProposal();
    }
  }, [token]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl max-w-md w-full border border-neutral-200 dark:border-neutral-800">
          <div className="w-16 h-16 border-4 border-[#DE001A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">A carregar proposta...</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">A consultar registo seguro no Cloud Firestore.</p>
        </div>
      </div>
    );
  }

  if (error || !proposta) {
    const isExpired = error === 'Esta proposta expirou.';
    return (
      <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white dark:bg-neutral-900 rounded-3xl shadow-xl max-w-md w-full border border-red-200 dark:border-red-900/50">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-[#DE001A] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-neutral-900 dark:text-white">
            {isExpired ? 'Proposta Expirada' : 'Proposta Não Encontrada'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            {isExpired
              ? 'Esta proposta expirou. O prazo de validade de 15 dias foi ultrapassado. Por favor, submeta um novo pedido para obter um orçamento atualizado.'
              : (error || 'O link pode estar incorreto ou a proposta ter expirado (validade de 15 dias).')}
          </p>
          <button
            onClick={onNavigateHome}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#DE001A] text-white font-bold text-sm shadow-md hover:bg-[#BF0016] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Página Principal
          </button>
        </div>
      </div>
    );
  }

  const subtotalEuros = (proposta.totalSemIvaCentimos / 100).toFixed(2);
  const ivaEuros = ((proposta.totalComIvaCentimos - proposta.totalSemIvaCentimos) / 100).toFixed(2);
  const totalEuros = (proposta.totalComIvaCentimos / 100).toFixed(2);
  const dataCriacao = new Date(proposta.createdAt).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const dataValidade = new Date(proposta.dataValidade).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F4F4F6] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Barra Superior de Navegação */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs border border-neutral-200 dark:border-neutral-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Página Principal Worten
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs border border-neutral-200 dark:border-neutral-800 transition cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copiado!' : 'Copiar Link da Proposta'}
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Cartão Oficial da Proposta (Design Profissional Worten) */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden print:border-none print:shadow-none">
        {/* Cabeçalho da Proposta */}
        <div className="bg-[#DE001A] text-white p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#DE001A] flex items-center justify-center font-black text-2xl tracking-tighter shadow-md shrink-0">
              W
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-red-200">
                Worten Resolve · Assistência Técnica & Instalações
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Proposta Comercial</h1>
              <p className="text-xs text-red-100 font-mono mt-0.5">Ref: {proposta.numeroProposta}</p>
            </div>
          </div>

          <div className="text-right sm:text-right bg-black/20 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10">
            <div className="text-[11px] uppercase font-bold text-red-100">Token de Acesso Único</div>
            <div className="font-mono text-xs font-bold text-white tracking-wider">{proposta.token.slice(0, 18)}...</div>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Proposta Válida (15 Dias)
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8">
          {/* Informações Gerais: Datas e Cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#F8F9FA] dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            {/* Dados do Cliente */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#DE001A]" />
                Dados do Cliente
              </h3>
              <p className="font-bold text-base text-neutral-900 dark:text-white">{proposta.clienteNome}</p>
            </div>

            {/* Prazos da Proposta */}
            <div className="md:border-l md:border-neutral-200 dark:md:border-neutral-700 md:pl-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#DE001A]" />
                Prazos e Validade
              </h3>
              <div className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
                <p><strong>Data de Emissão:</strong> {dataCriacao}</p>
                <p className="text-[#DE001A] font-semibold">
                  <strong>Válida até:</strong> {dataValidade} (15 dias)
                </p>
                <p className="text-neutral-500 text-[11px]">
                  Os preços em cêntimos são garantidos durante o período de vigência da proposta.
                </p>
              </div>
            </div>
          </div>

          {/* Diagnóstico da IA e Observações Técnicas */}
          {proposta.interpretacaoResumo && (
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Enquadramento Técnico Interpretado por IA
              </div>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                {proposta.interpretacaoResumo}
              </p>
            </div>
          )}

          {/* Tabela de Itens Orçamentados */}
          <div>
            <h3 className="text-base font-black text-neutral-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Discriminação de Serviços e Custos</span>
              <span className="text-xs font-normal text-neutral-500">Valores em Euros (€)</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-neutral-800/70 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase text-[11px] font-bold tracking-wider">
                    <th className="py-3 px-4">Serviço / Descrição</th>
                    <th className="py-3 px-3 text-center">Categoria</th>
                    <th className="py-3 px-3 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Preço Unit. (s/ IVA)</th>
                    <th className="py-3 px-4 text-right">Total Linha (s/ IVA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {proposta.itens.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                        <div>{item.nome}</div>
                        {item.evidencia && (
                          <div className="text-[11px] font-normal text-neutral-500 dark:text-neutral-400 italic mt-0.5">
                            Evidência: &ldquo;{item.evidencia}&rdquo;
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold uppercase">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-neutral-900 dark:text-white">
                        {item.quantidade}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-neutral-700 dark:text-neutral-300">
                        {(item.precoUnitarioCentimos / 100).toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-neutral-900 dark:text-white">
                        {(item.totalItemCentimos / 100).toFixed(2)} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo Financeiro Oficial com Destaque do Total sem IVA */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 sm:p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 max-w-md">
              <p className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white text-sm">
                <ShieldCheck className="w-5 h-5 text-[#DE001A]" />
                <span>Garantia Técnica Oficial Worten Resolve</span>
              </p>
              <p>
                Peças com certificação de fabricante, mão-de-obra especializada e garantia legal de conformidade técnica.
              </p>
              <p className="text-[11px] text-neutral-500">
                Condições de pagamento: no ato de conclusão da intervenção (Multibanco, MB WAY ou numerário em loja/domicílio).
              </p>
            </div>

            {/* Caixa com Destaque do Total sem IVA e Total com IVA */}
            <div className="w-full lg:w-80 p-5 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 shadow-md space-y-3">
              {/* DESTAQUE PRINCIPAL: Total sem IVA */}
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  <span>Total sem IVA:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DE001A] text-white">Destaque</span>
                </div>
                <div className="mt-1 text-2xl font-black text-neutral-900 dark:text-white text-right">
                  {subtotalEuros} €
                </div>
              </div>

              <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
                <span>IVA em vigor (23%):</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">{ivaEuros} €</span>
              </div>

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline px-1">
                <span className="text-sm font-bold text-neutral-900 dark:text-white">Total com IVA:</span>
                <span className="text-xl font-black text-[#DE001A]">{totalEuros} €</span>
              </div>
            </div>
          </div>

          {/* Contactos Institucionais Oficiais */}
          <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
            <h4 className="font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#DE001A]" />
              Contactos Institucionais & Apoio ao Cliente Worten Resolve
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-neutral-600 dark:text-neutral-400">
              <div>
                <strong className="text-neutral-900 dark:text-white block">Linha de Apoio Worten Resolve:</strong>
                <span>210 155 222 (Todos os dias das 08h00 às 24h00)</span>
              </div>
              <div>
                <strong className="text-neutral-900 dark:text-white block">Email Institucional:</strong>
                <span>resolve@worten.pt / apoioaocliente@worten.pt</span>
              </div>
              <div>
                <strong className="text-neutral-900 dark:text-white block">Rede Nacional:</strong>
                <span>Mais de 200 lojas Worten em Portugal continental e ilhas</span>
              </div>
            </div>
          </div>

          {/* Ações do Cliente */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 print:hidden">
            {accepted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Proposta Aceite!</strong> A equipa técnica Worten Resolve entrará em contacto para confirmar o agendamento da intervenção.
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAccepted(true)}
                  className="px-8 py-3.5 rounded-2xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-extrabold text-sm shadow-xl shadow-red-500/20 transition-all hover:scale-105 cursor-pointer"
                >
                  Aceitar Proposta & Marcar Visita
                </button>

                {onOpenAssistant && (
                  <button
                    type="button"
                    onClick={onOpenAssistant}
                    className="px-5 py-3.5 rounded-2xl bg-neutral-900 hover:bg-black text-white font-bold text-sm transition cursor-pointer"
                  >
                    Falar com Assistente Worten
                  </button>
                )}
              </div>
            )}

            <div className="text-xs text-neutral-500">
              Linha de Apoio Worten Resolve: <strong className="text-neutral-800 dark:text-neutral-200">210 155 222</strong>
            </div>
          </div>
        </div>

        {/* Rodapé Oficial da Proposta */}
        <div className="bg-[#F8F9FA] dark:bg-neutral-800/80 p-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-xs text-neutral-500 dark:text-neutral-400">
          <p>Worten - Equipamentos para o Lar, S.A. · NIF: 503 630 330 · Centro Comercial Colombo, Loja 0.001, Lisboa</p>
          <p className="mt-1">Proposta gerada eletronicamente através de inteligência artificial sobre o catálogo oficial Worten Resolve.</p>
        </div>
      </div>
    </div>
  );
};
