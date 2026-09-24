import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  Star,
  Smartphone,
  Mail,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  Phone,
  Store,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && consent) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 3000);
    }
  };

  const trustAwards = [
    {
      title: 'Escolha do Consumidor',
      badge: 'N.º 1 Eletrónica',
      year: '2024 - 2026',
      icon: Award,
    },
    {
      title: 'Marca de Confiança',
      badge: 'Reader’s Digest',
      year: '15º ano consecutivo',
      icon: ShieldCheck,
    },
    {
      title: 'Great Place to Work',
      badge: 'Certificação Oficial',
      year: 'Ambiente de Excelência',
      icon: Star,
    },
    {
      title: 'Prémios ACEPI Navegantes XXI',
      badge: 'Melhor Site/App Retalho',
      year: 'Comércio Eletrónico',
      icon: Award,
    },
  ];

  return (
    <footer className="bg-[#F4F4F6] text-neutral-700 pt-16 pb-12 border-t border-[#E5E5E7]">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Top Strip: Newsletter Lead Capture & App Micro-Proof */}
        <div className="bg-[#DE001A] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden">
          {/* Newsletter Form (Left) */}
          <div className="lg:col-span-7 space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <Mail className="w-3.5 h-3.5" />
              Ofertas em 1ª mão
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Recebe todas as novidades e promoções no teu email
            </h3>
            <p className="text-xs sm:text-sm text-red-100 font-medium">
              Sê o primeiro a saber de campanhas com 20% em talão, códigos de cupão exclusivos e lançamentos com retoma prioritária.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Insere o teu endereço de email..."
                  className="flex-1 bg-white text-neutral-900 placeholder-neutral-500 px-4 py-3 rounded-xl text-xs sm:text-sm border border-white focus:outline-none focus:ring-2 focus:ring-red-300 font-medium shadow-sm"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-black rounded-xl transition-colors shrink-0 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Subscrever</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <label className="flex items-start gap-2 text-[11px] text-red-100 cursor-pointer select-none font-medium">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded accent-neutral-900 cursor-pointer"
                />
                <span>
                  Li e tomei conhecimento sobre a informação relativa ao Tratamento de Dados Pessoais. Posso cancelar a subscrição a qualquer momento.
                </span>
              </label>

              {subscribed && (
                <div className="p-3 rounded-xl bg-white text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Subscrição efetuada com sucesso! Bem-vindo à família Worten.</span>
                </div>
              )}
            </form>
          </div>

          {/* App Micro-Proof (Right) - Crisp White Card */}
          <div className="lg:col-span-5 bg-white text-neutral-900 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-4 relative z-10 border border-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#DE001A] flex items-center justify-center text-white font-black text-2xl shadow-md">
                  W
                </div>
                <div>
                  <div className="font-black text-neutral-900 text-sm">App Worten</div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-neutral-900 font-bold">4.8</span>
                    <span>•</span>
                    <strong className="text-neutral-700">47 mil avaliações</strong>
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                Grátis
              </span>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              Consulta talões digitais, segue encomendas em direto e tem sempre o teu cartão de fidelização no bolso.
            </p>

            <button
              onClick={() => alert('A redirecionar para a App Store / Google Play...')}
              className="w-full py-2.5 bg-[#F4F4F6] hover:bg-[#EAEAEA] text-neutral-900 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#E5E5E7]"
            >
              <Smartphone className="w-4 h-4 text-[#DE001A]" />
              <span>ABRIR NA APP STORE & GOOGLE PLAY</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Third-Party Trust Seals & Institutional Proof */}
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-neutral-500 text-center mb-6">
            Selos de Confiança Independente & Reconhecimento do Consumidor
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustAwards.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-[#E5E5E7] p-4 rounded-2xl flex items-center gap-3.5 text-left shadow-xs hover:border-[#DE001A] transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-red-50 text-[#DE001A] shrink-0 border border-red-100">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-neutral-900 truncate">{item.title}</div>
                    <div className="text-[11px] text-[#DE001A] font-bold">{item.badge}</div>
                    <div className="text-[10px] text-neutral-500">{item.year}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs text-neutral-600 pt-6 border-t border-[#E5E5E7]">
          <div className="space-y-3">
            <h4 className="font-black text-neutral-900 text-sm uppercase tracking-wider">
              Apoio ao Cliente
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="hover:text-[#DE001A] transition-colors font-medium">
                  Perguntas Frequentes (FAQ)
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Contactos e Apoio 210 155 222
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Devoluções e Reembolsos em Loja
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Livro de Reclamações Online
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-neutral-900 text-sm uppercase tracking-wider">
              Worten Resolve
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#resolve-calculator" className="hover:text-[#DE001A] transition-colors font-medium">
                  Reparar ou Comprar Novo
                </a>
              </li>
              <li>
                <a href="#resolve-calculator" className="hover:text-[#DE001A] transition-colors font-medium">
                  Simulador de Retoma de Usados
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-[#DE001A] transition-colors font-medium">
                  Instalação de Eletrodomésticos
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-[#DE001A] transition-colors font-medium">
                  Seguros Danos e Roubo
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-neutral-900 text-sm uppercase tracking-wider">
              Vantagens Worten
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Preço Mínimo Garantido
                </a>
              </li>
              <li>
                <a href="#urgency-grid" className="hover:text-[#DE001A] transition-colors font-medium">
                  Cartão Continente e Vales
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Financiamento 10x e 24x s/juros
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Click & Collect em 15 min
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-neutral-900 text-sm uppercase tracking-wider">
              Sobre a Worten
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="#thematic" className="hover:text-[#DE001A] transition-colors font-medium">
                  Rede de +250 Lojas em Portugal
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Sustentabilidade & Economia Circular
                </a>
              </li>
              <li>
                <a href="#servicos" className="hover:text-[#DE001A] transition-colors font-medium">
                  Junta-te à rede de Técnicos
                </a>
              </li>
              <li>
                <a href="#hero" className="hover:text-[#DE001A] transition-colors font-medium">
                  Grupo Sonae
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Transparency & Credit Intermediary Regulatory Notice */}
        <div className="pt-8 border-t border-[#E5E5E7] text-[11px] text-neutral-500 space-y-3 leading-relaxed">
          <div className="p-4 rounded-xl bg-white border border-[#E5E5E7] text-neutral-600 space-y-2">
            <p>
              <strong className="text-neutral-900">Aviso Legal de Intermediário de Crédito:</strong> A Worten - Equipamentos para o Lar, S.A., com sede na Rua João Mendonça, n.º 505, 4464-503 Senhora da Hora, NIPC 503 630 330, encontra-se registada como Intermediário de Crédito a título acessório no Banco de Portugal sob o n.º 0000078. Intervenção exclusiva na apresentação e proposta de contratos de crédito a consumidores concedidos pelas instituições mutuantes parceiras (ex: Universo, IME, S.A., BNP Paribas Personal Finance S.A. / Cetelem).
            </p>
            <p>
              * <strong>Campanhas de Crédito sem Juros:</strong> Financiamento em 10x ou 24x sem juros válido para produtos assinalados, em compras de valor igual ou superior a 185€. Sujeito a aprovação de crédito pelas entidades financeiras parceiras. Exemplo: para uma compra de 600€ a 10 meses sem juros, TAN 0,00%, TAEG 0,00%, prestação mensal de 60,00€.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E5E7] text-neutral-500 text-xs">
            <div>© {new Date().getFullYear()} Worten - Equipamentos para o Lar, S.A. Todos os direitos reservados.</div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
              <a href="#" className="hover:text-[#DE001A]">Termos e Condições</a>
              <span>•</span>
              <a href="#" className="hover:text-[#DE001A]">Política de Privacidade</a>
              <span>•</span>
              <a href="#" className="hover:text-[#DE001A]">Gestão de Cookies</a>
              <span>•</span>
              <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer" className="hover:text-[#DE001A] font-bold">Livro de Reclamações</a>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <Lock className="w-3 h-3 text-emerald-600" />
                Pagamentos 100% Seguros (3D Secure)
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
