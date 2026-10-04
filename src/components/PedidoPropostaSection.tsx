import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Wrench,
  Cpu,
  Wind,
  Refrigerator,
  Tv,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface PedidoPropostaSectionProps {
  onOpenProposalModal?: (token: string) => void;
  onNavigateToProposal?: (token: string) => void;
}

export const PedidoPropostaSection: React.FC<PedidoPropostaSectionProps> = ({
  onNavigateToProposal,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pedido, setPedido] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    token?: string | null;
    propostaUrl?: string | null;
    numeroProposta?: string | null;
    resumo?: string | null;
    totalSemIva?: number;
    totalComIva?: number;
  } | null>(null);

  // Exemplo de cenários reais para teste rápido
  const quickExamples = [
    {
      label: 'Ar Condicionado',
      icon: Wind,
      text: 'Preciso de instalar um ar condicionado split novo de 12000 BTU na sala do meu apartamento no 2º andar.',
    },
    {
      label: 'Ecrã Smartphone',
      icon: Wrench,
      text: 'O ecrã do meu iPhone 13 estalou após uma queda no chão. O touch funciona mas o vidro está todo rachado.',
    },
    {
      label: 'Diagnóstico PC',
      icon: Cpu,
      text: 'O meu computador portátil Asus aquece imenso, a ventoinha faz muito barulho e o Windows fica lento a bloquear.',
    },
    {
      label: 'Frigorífico',
      icon: Refrigerator,
      text: 'O meu frigorífico combinado parou de fazer frio na parte de baixo, embora o congelador continue a funcionar.',
    },
    {
      label: 'TV na Parede',
      icon: Tv,
      text: 'Comprei uma TV OLED de 65 polegadas na Worten e preciso de fixação segura na parede da sala com calha para cabos.',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validações
    if (!nome.trim() || !email.trim() || !pedido.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios: Nome, Email e Pedido.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMsg('Por favor, insira um endereço de email válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          textoOriginal: pedido.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Não foi possível gerar a proposta.');
      }

      setSuccessData({
        token: data.token || null,
        propostaUrl: data.propostaUrl || (data.token ? `/proposta/${data.token}` : null),
        numeroProposta: data.proposta?.numeroProposta || null,
        resumo: data.proposta?.interpretacaoResumo || data.pedido?.interpretacaoIA?.resumo || null,
        totalSemIva: data.proposta?.totalSemIvaCentimos
          ? data.proposta.totalSemIvaCentimos / 100
          : undefined,
        totalComIva: data.proposta?.totalComIvaCentimos
          ? data.proposta.totalComIvaCentimos / 100
          : undefined,
      });

      // Limpar formulário
      setNome('');
      setEmail('');
      setPedido('');
    } catch (err: any) {
      console.error('Erro ao submeter pedido de proposta:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao submeter o seu pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProposal = (token: string) => {
    if (onNavigateToProposal) {
      onNavigateToProposal(token);
    } else {
      window.history.pushState({}, '', `/proposta/${token}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <section id="pedido-proposta" className="py-16 bg-white dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Secção */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-[#DE001A] text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#DE001A]" />
            Worten Resolve · Orçamentação Inteligente com IA
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            Pedido de proposta
          </h2>
          <p className="mt-3 text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            Descreva a avaria ou serviço técnico pretendido. O nosso motor de IA cruza o seu pedido com o catálogo oficial Worten Resolve e emite uma proposta instantânea com preços tabelados.
          </p>
        </div>

        {/* Mensagem de Sucesso (Requisito 1: "O seu pedido foi recebido com sucesso.") */}
        {successData && (
          <div className="mb-10 max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-xl animate-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                    O seu pedido foi recebido com sucesso.
                  </h3>
                  {successData.numeroProposta && (
                    <span className="px-3 py-1 bg-emerald-200/60 dark:bg-emerald-800/50 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-200">
                      {successData.numeroProposta}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                  {successData.token
                    ? 'A nossa inteligência artificial analisou o seu pedido e gerou a sua proposta técnica oficial Worten Resolve com base no catálogo do Firestore.'
                    : 'O seu pedido foi recebido e encaminhado para revisão técnica da nossa equipa especializada Worten Resolve para análise detalhada.'}
                  {successData.resumo && (
                    <span className="block mt-2 font-medium italic bg-emerald-100/60 dark:bg-emerald-900/40 p-2.5 rounded-xl border border-emerald-300/40 dark:border-emerald-800/40">
                      &ldquo;{successData.resumo}&rdquo;
                    </span>
                  )}
                </p>

                {successData.totalSemIva !== undefined && (
                  <div className="mt-4 flex flex-wrap items-baseline gap-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40">
                    <div>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">Total sem IVA:</span>
                      <p className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                        {successData.totalSemIva.toFixed(2)} €
                      </p>
                    </div>
                    {successData.totalComIva !== undefined && (
                      <div>
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">Total com IVA (23%):</span>
                        <p className="text-2xl font-black text-[#DE001A]">
                          {successData.totalComIva.toFixed(2)} €
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {successData.token && (
                    <button
                      type="button"
                      onClick={() => handleOpenProposal(successData.token!)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all hover:scale-105 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Proposta Detalhada
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSuccessData(null)}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-xs border border-neutral-200 dark:border-neutral-700 transition cursor-pointer"
                  >
                    Fazer Novo Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Formulário Principal (Requisito 1: 3 campos obrigatórios) */}
          <div className="lg:col-span-7 bg-[#F8F9FA] dark:bg-neutral-800/60 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-800 dark:text-red-200 text-sm">
                  <AlertCircle className="w-5 h-5 text-[#DE001A] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Campo Nome */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Nome <span className="text-[#DE001A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#DE001A] focus:border-transparent transition text-sm font-medium"
                />
              </div>

              {/* 2. Campo Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  Email <span className="text-[#DE001A]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: cliente@exemplo.pt"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#DE001A] focus:border-transparent transition text-sm font-medium"
                />
              </div>

              {/* 3. Campo Pedido (Textarea livre) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Pedido <span className="text-[#DE001A]">*</span>
                  </label>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Texto livre adaptado</span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={pedido}
                  onChange={(e) => setPedido(e.target.value)}
                  placeholder="Descreva a sua avaria ou necessidade técnica (ex: ecrã de telemóvel partido, instalação de ar condicionado, diagnóstico de computador portátil, reparação de frigorífico, montagem de TV na parede)..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#DE001A] focus:border-transparent transition text-sm font-medium resize-y"
                />
              </div>

              {/* Botão Pedir Proposta com Loading */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-[#DE001A] hover:bg-[#BF0016] text-white font-extrabold text-base shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>A analisar pedido e gerar proposta com IA...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Pedir proposta</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Coluna Lateral: Exemplos Rápidos e Garantias Worten Resolve */}
          <div className="lg:col-span-5 space-y-6">
            {/* Atalhos com 1 clique */}
            <div className="bg-[#F8F9FA] dark:bg-neutral-800/60 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#DE001A]" />
                Testar com Cenários Típicos Worten Resolve:
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4">
                Clique num dos cenários para preencher o formulário automaticamente:
              </p>

              <div className="space-y-2">
                {quickExamples.map((ex, idx) => {
                  const Icon = ex.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPedido(ex.text);
                        if (!nome) setNome('Cliente Worten');
                        if (!email) setEmail('cliente.worten@exemplo.pt');
                      }}
                      className="w-full text-left p-3 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-red-50 dark:hover:bg-red-950/30 border border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-900/60 transition group flex items-start gap-3 cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:bg-[#DE001A] group-hover:text-white transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-neutral-900 dark:text-white group-hover:text-[#DE001A] transition">
                          {ex.label}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {ex.text}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Garantias Worten Resolve */}
            <div className="bg-neutral-900 text-white rounded-3xl p-6 border border-neutral-800 shadow-md">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#DE001A]" />
                Compromissos Worten Resolve
              </h3>
              <ul className="space-y-3 text-xs text-neutral-300">
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DE001A]" />
                  <span><strong>Preços Oficiais em Cêntimos:</strong> Calculados com rigor pelo Firestore.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DE001A]" />
                  <span><strong>Validade de 15 Dias:</strong> Proposta garantida com token único e seguro.</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DE001A]" />
                  <span><strong>Técnicos Certificados:</strong> Reparação na hora ou visita ao domicílio.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
