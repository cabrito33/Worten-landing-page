import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  MapPin,
  Phone,
  FileText,
  Briefcase,
  Store,
  Sparkles,
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Flame,
  Wrench,
  Tag,
  Star,
  Clock,
  Laptop,
  Smartphone as PhoneIcon,
  Tv,
  Gamepad2,
  Coffee,
  Home,
  CheckCircle2,
  Bot,
} from 'lucide-react';
import { WortenStore } from './Modals';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  onNavigateTo: (sectionId: string) => void;
  onOpenSearch: (query: string) => void;
  cartCount: number;
  cartTotal?: number;
  onOpenCartModal: () => void;
  onOpenAccountModal: () => void;
  selectedStore: WortenStore;
  onOpenStoreModal: () => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onOpenChatbot?: () => void;
}

interface MegamenuDept {
  id: string;
  label: string;
  icon: string;
  tag?: string;
  subcategories: { name: string; tag?: string; filterId: string }[];
  promoBanner: {
    title: string;
    description: string;
    cta: string;
    discountTag: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  onNavigateTo,
  onOpenSearch,
  cartCount,
  cartTotal = 0,
  onOpenCartModal,
  onOpenAccountModal,
  selectedStore,
  onOpenStoreModal,
  selectedCategory = 'all',
  onSelectCategory,
  onOpenChatbot,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeDeptIndex, setActiveDeptIndex] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(3);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const megamenuRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        megamenuRef.current &&
        !megamenuRef.current.contains(e.target as Node)
      ) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const departments: MegamenuDept[] = [
    {
      id: 'appliances',
      label: 'Grandes Eletrodomésticos',
      icon: '🧺',
      tag: 'Até -40%',
      subcategories: [
        { name: 'Frigoríficos & Combinados No Frost', tag: 'Até -35%', filterId: 'appliances' },
        { name: 'Máquinas de Lavar Roupa', tag: '20% Talão', filterId: 'appliances' },
        { name: 'Máquinas de Secar Roupa', filterId: 'appliances' },
        { name: 'Máquinas de Lavar Louça', filterId: 'appliances' },
        { name: 'Fornos e Placas de Indução', filterId: 'appliances' },
        { name: 'Exaustores e Micro-ondas', filterId: 'appliances' },
        { name: 'Ar Condicionado & Climatização', tag: 'Instalação Grátis', filterId: 'appliances' },
        { name: 'Termoacumuladores e Esquentadores', filterId: 'appliances' },
      ],
      promoBanner: {
        title: 'Campanha Frio Eficiente',
        description: 'Frigoríficos classe A & B com 20% desconto em talão e recolha do antigo gratuita.',
        cta: 'Ver Eletrodomésticos',
        discountTag: 'Até 20% em Talão',
      },
    },
    {
      id: 'tvs',
      label: 'TV, Áudio e Som',
      icon: '📺',
      tag: 'Até -35%',
      subcategories: [
        { name: 'Smart TVs OLED e Neo QLED', tag: 'Até -35%', filterId: 'tvs' },
        { name: 'Smart TVs 4K Ultra HD (43" a 75")', filterId: 'tvs' },
        { name: 'Soundbars e Home Cinema Dolby Atmos', filterId: 'tvs' },
        { name: 'Auscultadores & Auriculares Bluetooth', tag: 'Top Vendas', filterId: 'tvs' },
        { name: 'Colunas Portáteis JBL e Marshall', filterId: 'tvs' },
        { name: 'Projetores e Telas de Projeção', filterId: 'tvs' },
        { name: 'Suportes e Cabos HDMI 2.1', filterId: 'tvs' },
      ],
      promoBanner: {
        title: 'Festival da Imagem & Som',
        description: 'Traz a experiência de cinema para a tua sala com até 35% de desconto e 10x sem juros.',
        cta: 'Explorar TVs',
        discountTag: 'Até -35% Direto',
      },
    },
    {
      id: 'computing',
      label: 'Informática & Acessórios',
      icon: '💻',
      tag: 'Até -250€',
      subcategories: [
        { name: 'Portáteis Estudante e Profissional', tag: 'Até -250€', filterId: 'computing' },
        { name: 'Apple MacBooks & iPads', tag: 'Cupão UNI10', filterId: 'computing' },
        { name: 'Monitores Curvos e 4K', filterId: 'computing' },
        { name: 'Impressoras e Tinteiros Originais', filterId: 'computing' },
        { name: 'Discos Externos SSD e Pendrives', filterId: 'computing' },
        { name: 'Ratos, Teclados e Hubs USB-C', filterId: 'computing' },
        { name: 'Redes, Routers Wi-Fi 6 e Mesh', filterId: 'computing' },
      ],
      promoBanner: {
        title: 'Regresso ao Trabalho & Estudos',
        description: 'Equipa-te com portáteis de alto desempenho e aproveita o cupão UNI10 no checkout.',
        cta: 'Ver Portáteis',
        discountTag: 'Até 24x s/ Juros',
      },
    },
    {
      id: 'smartphones',
      label: 'Smartphones & Wearables',
      icon: '📱',
      tag: 'Retoma +200€',
      subcategories: [
        { name: 'Apple iPhone (16, 15, 14 e SE)', tag: 'Retoma 1.500€', filterId: 'smartphones' },
        { name: 'Samsung Galaxy Série S e Z Flip/Fold', filterId: 'smartphones' },
        { name: 'Xiaomi, Redmi e POCO', tag: 'Super Preço', filterId: 'smartphones' },
        { name: 'Smartwatches Apple Watch & Galaxy Watch', filterId: 'smartphones' },
        { name: 'Smartbands e Pulseiras de Atividade', filterId: 'smartphones' },
        { name: 'Capas, Películas e Carregadores 65W', filterId: 'smartphones' },
      ],
      promoBanner: {
        title: 'Retoma Worten Resolve',
        description: 'Entrega o teu smartphone usado e recebe até 1.500€ de desconto imediato no novo.',
        cta: 'Simular Retoma',
        discountTag: 'Valor Imediato',
      },
    },
    {
      id: 'gaming',
      label: 'Gaming & Consolas',
      icon: '🎮',
      tag: 'Leva 3 Paga 2',
      subcategories: [
        { name: 'Consolas PlayStation 5 Slim', tag: 'Stock Imediato', filterId: 'gaming' },
        { name: 'Nintendo Switch OLED', filterId: 'gaming' },
        { name: 'Xbox Series X e Series S', filterId: 'gaming' },
        { name: 'Jogos PS5, Switch e Xbox', tag: 'Leva 3 Paga 2', filterId: 'gaming' },
        { name: 'PCs e Portáteis Gaming RTX 4070', filterId: 'gaming' },
        { name: 'Cadeiras e Secretárias Gaming', filterId: 'gaming' },
        { name: 'Comandos, Volantes e Auscultadores', filterId: 'gaming' },
      ],
      promoBanner: {
        title: 'Semana do Gaming',
        description: 'Leva 3 jogos e paga apenas 2 nas plataformas PS5, Switch e Xbox!',
        cta: 'Ver Jogos',
        discountTag: 'Leva 3 Paga 2',
      },
    },
    {
      id: 'coffee-small',
      label: 'Pequenos Eletrodomésticos',
      icon: '☕',
      tag: 'Até -45%',
      subcategories: [
        { name: 'Máquinas de Café Automáticas e Cápsulas', tag: 'Até -45%', filterId: 'appliances' },
        { name: 'Airfryers e Fritadeiras Sem Óleo XXL', tag: 'Top Vendas', filterId: 'appliances' },
        { name: 'Robots de Cozinha Multifunções', filterId: 'appliances' },
        { name: 'Aspiradores Verticais Sem Fios e Robots', filterId: 'appliances' },
        { name: 'Ferros com Caldeira e Verticais', filterId: 'appliances' },
        { name: 'Grelhadores, Tosteiras e Torradeiras', filterId: 'appliances' },
      ],
      promoBanner: {
        title: 'Pausa para Café & Cozinha Saudável',
        description: 'Máquinas de café DeLonghi e Philips com até 45% de desconto e café grátis.',
        cta: 'Ver Ofertas',
        discountTag: 'Até -45%',
      },
    },
    {
      id: 'home',
      label: 'Casa, Jardim & Bricolage',
      icon: '🛋️',
      tag: 'Novidades',
      subcategories: [
        { name: 'Mobiliário de Escritório e Estantes', filterId: 'thematic' },
        { name: 'Ferramentas Elétricas e Berbequins', filterId: 'servicos' },
        { name: 'Iluminação Inteligente Philips Hue', filterId: 'thematic' },
        { name: 'Aquecimento e Desumidificadores', filterId: 'appliances' },
        { name: 'Camping, Tendas e Geleiras', tag: 'Ar Livre', filterId: 'thematic' },
      ],
      promoBanner: {
        title: 'Prepara a tua Casa',
        description: 'Tudo para renovar o teu espaço com entregas grátis e soluções de montagem.',
        cta: 'Explorar Casa',
        discountTag: 'Entrega Grátis',
      },
    },
    {
      id: 'resolve',
      label: 'Worten Resolve (Serviços & Reparação)',
      icon: '🛠️',
      tag: 'Na Hora',
      subcategories: [
        { name: 'Reparação de Ecrã e Bateria de Smartphone', tag: 'Na Hora', filterId: 'resolve-calculator' },
        { name: 'Substituição e Reparação de Eletrodomésticos', filterId: 'servicos' },
        { name: 'Instalação de Ar Condicionado e Placas', filterId: 'servicos' },
        { name: 'Limpeza e Otimização de Computadores', filterId: 'servicos' },
        { name: 'Seguros e Extensões de Garantia', filterId: 'resolve-calculator' },
        { name: 'Retoma de Usados com Avaliação Online', tag: 'Garantido', filterId: 'resolve-calculator' },
      ],
      promoBanner: {
        title: 'A Worten Resolve!',
        description: 'Mais de 1 milhão de reparações com peças originais e garantia técnica de 3 anos.',
        cta: 'Simular Reparação',
        discountTag: 'Garantia 3 Anos',
      },
    },
    {
      id: 'outlet',
      label: 'Recondicionados & Outlet',
      icon: '♻️',
      tag: 'Até -50%',
      subcategories: [
        { name: 'iPhones Recondicionados Grau A+', tag: 'Cupão OFF20', filterId: 'promocoes' },
        { name: 'Portáteis e Monitores Outlet', filterId: 'promocoes' },
        { name: 'Eletrodomésticos Open Box Certificados', filterId: 'promocoes' },
        { name: 'TVs Outlet com 3 Anos de Garantia', filterId: 'promocoes' },
      ],
      promoBanner: {
        title: 'Poupa até 50% no Outlet',
        description: 'Produtos testados por peritos, 100% funcionais e com 3 anos de garantia total.',
        cta: 'Ver Recondicionados',
        discountTag: 'Garantia 3 Anos',
      },
    },
  ];

  const searchTrends = [
    'iPhone 16 Pro',
    'PlayStation 5 Slim',
    'Airfryer XXL',
    'Portáteis Estudante',
    'Smart TV OLED 55"',
    'Frigorífico No Frost',
    'Máquina de Café DeLonghi',
    'Nintendo Switch',
  ];

  const suggestedProducts = [
    {
      title: 'Apple iPhone 15 Pro 128GB Titânio',
      price: '1.099,99€',
      oldPrice: '1.249,99€',
      tag: '-12%',
      category: 'smartphones',
    },
    {
      title: 'Samsung Smart TV OLED 55" 4K 120Hz',
      price: '899,99€',
      oldPrice: '1.399,99€',
      tag: '-35%',
      category: 'tvs',
    },
    {
      title: 'Máquina de Café DeLonghi Magnifica S',
      price: '289,99€',
      oldPrice: '399,99€',
      tag: '-27%',
      category: 'appliances',
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenSearch(searchQuery.trim());
      setIsSearchFocused(false);
    }
  };

  const handleSelectSubcat = (filterId: string) => {
    setCategoriesOpen(false);
    if (filterId === 'resolve-calculator' || filterId === 'servicos' || filterId === 'thematic') {
      onNavigateTo(filterId);
    } else {
      if (onSelectCategory) {
        onSelectCategory(filterId);
      }
      onNavigateTo('promocoes');
    }
  };

  const handleNavCategoryClick = (id: string) => {
    if (id === 'promocoes' || id === 'folhetos') {
      if (onSelectCategory) onSelectCategory('all');
      onNavigateTo('promocoes');
    } else if (id === 'resolve') {
      onNavigateTo('resolve-calculator');
    } else if (id === 'servicos') {
      onNavigateTo('servicos');
    } else {
      if (onSelectCategory) onSelectCategory(id);
      onNavigateTo('promocoes');
    }
  };

  return (
    <header className="sticky top-0 z-50 transition-colors shadow-md">
      {/* 1. TOP UTILITY BAR (Worten.pt Authentic Navigation Strip) */}
      <div className="bg-[#18181C] text-neutral-300 text-[11px] font-medium border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          {/* Left utility items: Menu, Worten Resolve, Worten Life, Cupões */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="flex items-center gap-1.5 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5 text-[#DE001A]" />
              <span className="font-bold">Menu</span>
            </button>
            <button
              onClick={() => onNavigateTo('resolve-calculator')}
              className="flex items-center gap-1.5 text-neutral-200 hover:text-white transition-colors cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
              <span className="font-bold text-white">Worten Resolve</span>
              <span className="hidden sm:inline text-[9px] bg-emerald-950 text-emerald-300 px-1 py-0.2 rounded border border-emerald-800">
                Sustentável
              </span>
            </button>
            <button
              onClick={() => onNavigateTo('thematic')}
              className="hover:text-white transition-colors cursor-pointer hidden md:inline-flex items-center gap-1 font-semibold"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Worten Life</span>
            </button>
            <button
              onClick={() => onNavigateTo('promocoes')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <Tag className="w-3 h-3 text-[#DE001A]" />
              <span>Cupões & Folhetos</span>
            </button>
          </div>

          {/* Right utility items: Lojas, Apoio/Chatbot, Login, Theme */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onOpenStoreModal}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
              title="Mudar Loja"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span className="truncate max-w-[120px] sm:max-w-none">{selectedStore.name}</span>
            </button>
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-emerald-300 font-semibold"
                title="Assistente Virtual & Agendamentos Cal.com"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Apoio ao Cliente</span>
              </button>
            )}
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-bold text-white"
            >
              <User className="w-3.5 h-3.5 text-white" />
              <span>Login</span>
            </button>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Alternar tema escuro/claro"
              className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN RED HEADER BAR (Worten Red #DE001A with White Brand Typography) */}
      <div className="bg-[#DE001A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 lg:gap-5">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-1 rounded-xl lg:hidden text-white hover:bg-white/10 cursor-pointer transition-colors"
              aria-label="Abrir menu de navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>

            {/* Official Worten Logo (White letters on Red Header) */}
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                onNavigateTo('hero');
              }}
              className="flex items-center select-none shrink-0 cursor-pointer group"
              aria-label="Worten.pt Página Inicial"
            >
              <div className="flex items-baseline">
                <span className="font-extrabold text-3xl sm:text-[38px] tracking-tighter text-white leading-none font-sans lowercase">
                  worten
                </span>
                <span className="font-bold text-xl sm:text-2xl text-white tracking-tighter leading-none opacity-90">
                  .pt
                </span>
              </div>
            </a>

            {/* Desktop "Todas as Categorias" Button with Megamenu */}
            <div ref={megamenuRef} className="relative hidden lg:block shrink-0">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-neutral-100 text-neutral-900 transition-all cursor-pointer shadow-xs"
              >
                <Menu className="w-4 h-4 text-[#DE001A]" />
                <span className="font-extrabold text-neutral-900">Todas as Categorias</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-600 transition-transform duration-200 ${
                    categoriesOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

            {/* Comprehensive Worten Megamenu Dropdown */}
            {categoriesOpen && (
              <div className="absolute top-full left-0 mt-2 w-[880px] bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-[#E5E5E7] dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 grid grid-cols-12 divide-x divide-neutral-100 dark:divide-neutral-800">
                {/* Column 1: Macro Departments (4 cols) */}
                <div className="col-span-4 py-3 bg-[#F9F9FB] dark:bg-[#141414] max-h-[480px] overflow-y-auto">
                  <div className="px-4 py-1 text-[11px] font-black uppercase text-neutral-400 tracking-wider">
                    Departamentos Worten
                  </div>
                  {departments.map((dept, idx) => {
                    const isSelected = activeDeptIndex === idx;
                    return (
                      <button
                        key={dept.id}
                        onMouseEnter={() => setActiveDeptIndex(idx)}
                        onClick={() => {
                          if (onSelectCategory) onSelectCategory(dept.id);
                          onNavigateTo('promocoes');
                          setCategoriesOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-[#1E1E22] text-[#DE001A] font-black border-l-4 border-[#DE001A] shadow-xs'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <span className="text-base shrink-0">{dept.icon}</span>
                          <span className="truncate">{dept.label}</span>
                        </span>
                        {dept.tag && (
                          <span className="text-[10px] font-bold bg-red-100 dark:bg-red-950 text-[#DE001A] px-1.5 py-0.5 rounded shrink-0">
                            {dept.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Column 2: Subcategories of selected department (5 cols) */}
                <div className="col-span-5 p-5 max-h-[480px] overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-black uppercase text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>{departments[activeDeptIndex].icon}</span>
                      <span>{departments[activeDeptIndex].label}</span>
                    </span>
                    <button
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(departments[activeDeptIndex].id);
                        onNavigateTo('promocoes');
                        setCategoriesOpen(false);
                      }}
                      className="text-[11px] font-bold text-[#DE001A] hover:underline cursor-pointer"
                    >
                      Ver tudo &gt;
                    </button>
                  </div>

                  <div className="space-y-1">
                    {departments[activeDeptIndex].subcategories.map((sub, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSubcat(sub.filterId)}
                        className="w-full text-left py-1.5 px-2 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-[#DE001A] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">
                          {sub.name}
                        </span>
                        {sub.tag ? (
                          <span className="text-[10px] font-bold bg-[#DE001A] text-white px-1.5 py-0.5 rounded">
                            {sub.tag}
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#DE001A] transition-opacity" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 3: Commercial Promo Banner (3 cols) */}
                <div className="col-span-3 p-5 bg-[#FFF0F2] dark:bg-red-950/20 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <span className="inline-block px-2.5 py-1 bg-[#DE001A] text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                      {departments[activeDeptIndex].promoBanner.discountTag}
                    </span>
                    <h4 className="font-black text-sm text-neutral-900 dark:text-white leading-tight">
                      {departments[activeDeptIndex].promoBanner.title}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
                      {departments[activeDeptIndex].promoBanner.description}
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        if (onSelectCategory) onSelectCategory(departments[activeDeptIndex].id);
                        onNavigateTo('promocoes');
                        setCategoriesOpen(false);
                      }}
                      className="w-full py-2.5 px-3 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{departments[activeDeptIndex].promoBanner.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expanded Search Bar Container */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que procuras hoje? Pesquisa artigos, marcas, referências..."
                className="w-full bg-white text-neutral-900 placeholder-neutral-500 pl-11 pr-24 py-2.5 rounded-full text-xs sm:text-sm shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>Procurar</span>
              </button>
            </form>

            {/* Real-Time Predictive Search & Trends Overlay */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-[#E5E5E7] dark:border-neutral-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 space-y-4">
                {/* Trending tags */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                    <Flame className="w-3.5 h-3.5 text-[#DE001A]" />
                    <span>Tendências de Pesquisa 🔥</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {searchTrends.map((trend) => (
                      <button
                        key={trend}
                        onClick={() => {
                          setSearchQuery(trend);
                          onOpenSearch(trend);
                          setIsSearchFocused(false);
                        }}
                        className="px-3 py-1.5 rounded-full bg-[#F4F4F6] dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-[#DE001A] text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {trend}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular suggested products */}
                <div>
                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    Produtos em Destaque
                  </div>
                  <div className="space-y-1.5">
                    {suggestedProducts.map((prod, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (onSelectCategory) onSelectCategory(prod.category);
                          onNavigateTo('promocoes');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#DE001A] font-bold text-xs">
                            {prod.tag}
                          </span>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            {prod.title}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#DE001A]">
                            {prod.price}
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through block">
                            {prod.oldPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons: Store, Assistant, Account, Wishlist, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Store Indicator */}
            <button
              onClick={onOpenStoreModal}
              className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-white hover:bg-white/15 text-left transition-colors cursor-pointer"
              title="Mudar de Loja Worten"
            >
              <MapPin className="w-4 h-4 text-white" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white/80 font-medium leading-tight">
                  Lojas
                </span>
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                  {selectedStore.name}
                </span>
              </div>
            </button>

            {/* Virtual Assistant Button */}
            {onOpenChatbot && (
              <button
                id="chatbot-header-btn"
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer"
                title="Assistente Virtual Worten (Chat & Agendamento)"
              >
                <div className="relative">
                  <Bot className="w-4 h-4 text-white" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="hidden lg:inline text-xs font-bold text-white">Apoio</span>
              </button>
            )}

            {/* Account Trigger */}
            <button
              id="account-header-btn"
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Aceder à Conta"
            >
              <User className="w-4 h-4 text-white" />
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[10px] text-white/80 font-medium leading-tight">
                  Conta
                </span>
                <span className="text-xs font-bold text-white leading-tight">
                  Iniciar Sessão
                </span>
              </div>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => onNavigateTo('promocoes')}
              className="relative p-2 rounded-xl text-white hover:bg-white/15 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Lista de Favoritos"
              title="Favoritos"
            >
              <Heart className="w-5 h-5 text-white hover:scale-105 transition-transform" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-white text-[#DE001A] text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Worten White Cart Button on Red Header */}
            <button
              id="cart-header-btn"
              onClick={onOpenCartModal}
              className="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-white hover:bg-neutral-100 text-[#DE001A] font-extrabold transition-all shadow-sm cursor-pointer"
              aria-label={`Carrinho com ${cartCount} itens`}
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-[#DE001A]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#DE001A] text-white text-[9px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[11px] font-black text-[#DE001A]">
                  {cartTotal > 0 ? `${cartTotal.toFixed(2)}€` : 'Carrinho'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-2 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que procuras hoje? TV, iPhone, Portáteis..."
              className="w-full bg-white text-neutral-900 placeholder-neutral-500 pl-10 pr-20 py-2 rounded-full text-xs shadow-xs focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#DE001A] text-white text-[11px] font-bold rounded-full cursor-pointer hover:bg-[#BF0016]"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>
    </div>

      {/* 3. HORIZONTAL CATEGORY NAVIGATION BAR (Worten.pt Authentic Departments Strip) */}
      <div className="bg-white dark:bg-[#18181B] border-b border-[#E5E5E7] dark:border-neutral-800 px-4 hidden lg:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
          <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            {/* Promoções Highlight */}
            <button
              onClick={() => handleNavCategoryClick('promocoes')}
              className="text-[#DE001A] hover:text-[#BF0016] flex items-center gap-1.5 cursor-pointer py-1 border-b-2 border-transparent hover:border-[#DE001A] transition-all"
            >
              <Flame className="w-4 h-4 fill-[#DE001A]" />
              <span>Promoções & Talão</span>
            </button>

            <button
              onClick={() => handleNavCategoryClick('appliances')}
              className={`hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 ${
                selectedCategory === 'appliances' ? 'border-[#DE001A] text-[#DE001A]' : 'border-transparent'
              }`}
            >
              Grandes Eletrodomésticos
            </button>

            <button
              onClick={() => handleNavCategoryClick('tvs')}
              className={`hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 ${
                selectedCategory === 'tvs' ? 'border-[#DE001A] text-[#DE001A]' : 'border-transparent'
              }`}
            >
              TV, Áudio & Som
            </button>

            <button
              onClick={() => handleNavCategoryClick('computing')}
              className={`hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 ${
                selectedCategory === 'computing' ? 'border-[#DE001A] text-[#DE001A]' : 'border-transparent'
              }`}
            >
              Informática & Acessórios
            </button>

            <button
              onClick={() => handleNavCategoryClick('smartphones')}
              className={`hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 ${
                selectedCategory === 'smartphones' ? 'border-[#DE001A] text-[#DE001A]' : 'border-transparent'
              }`}
            >
              Smartphones & Wearables
            </button>

            <button
              onClick={() => handleNavCategoryClick('gaming')}
              className={`hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 ${
                selectedCategory === 'gaming' ? 'border-[#DE001A] text-[#DE001A]' : 'border-transparent'
              }`}
            >
              Gaming
            </button>

            <button
              onClick={() => handleNavCategoryClick('appliances')}
              className="hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 border-transparent"
            >
              Pequenos Eletrodomésticos
            </button>

            <button
              onClick={() => handleNavCategoryClick('thematic')}
              className="hover:text-[#DE001A] transition-colors cursor-pointer py-1 border-b-2 border-transparent"
            >
              Casa & Bricolage
            </button>

            {/* Worten Resolve with badge */}
            <button
              onClick={() => onNavigateTo('resolve-calculator')}
              className="text-[#DE001A] hover:text-[#BF0016] font-extrabold flex items-center gap-1.5 cursor-pointer py-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Worten Resolve</span>
            </button>

            {/* Outlet with badge */}
            <button
              onClick={() => handleNavCategoryClick('promocoes')}
              className="hover:text-[#DE001A] transition-colors flex items-center gap-1.5 cursor-pointer py-1"
            >
              <span>Outlet & Recondicionados</span>
              <span className="text-[9px] bg-[#DE001A] text-white px-1.5 py-0.2 rounded font-black">
                -50%
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400 font-semibold shrink-0">
            <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Preço Mínimo Garantido
            </span>
          </div>
        </div>
      </div>

      {/* 4. MOBILE DRAWER NAVIGATION */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#18181B] border-b border-[#E5E5E7] dark:border-neutral-800 px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Store switch in mobile */}
          <div
            onClick={() => {
              onOpenStoreModal();
              setMobileMenuOpen(false);
            }}
            className="p-3 rounded-xl bg-[#F4F4F6] dark:bg-neutral-800 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-[#DE001A]" />
              <div>
                <span className="text-neutral-500 text-[10px] block">A minha loja:</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {selectedStore.name} ({selectedStore.city})
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#DE001A]">Alterar</span>
          </div>

          {/* Department buttons */}
          <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Todas as Categorias
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {departments.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(cat.id);
                  onNavigateTo('promocoes');
                  setMobileMenuOpen(false);
                }}
                className="p-3 rounded-xl bg-[#F4F4F6] dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-left flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer"
              >
                <span className="text-base">{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Fast Navigation links */}
          <div className="pt-3 border-t border-[#E5E5E7] dark:border-neutral-800 space-y-2 text-xs font-bold">
            {onOpenChatbot && (
              <button
                onClick={() => {
                  onOpenChatbot();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#DE001A] font-extrabold flex items-center justify-between cursor-pointer border border-red-200 dark:border-red-900/50"
              >
                <span className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#DE001A]" />
                  <span>Assistente Virtual (Chat & Agendamento)</span>
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => {
                onNavigateTo('resolve-calculator');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 font-black text-[#DE001A] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span>Worten Resolve (Reparações & Retomas)</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                onNavigateTo('urgency-grid');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-neutral-700 dark:text-neutral-300 flex items-center justify-between cursor-pointer"
            >
              <span>Campanhas & Folhetos da Semana</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => {
                onNavigateTo('servicos');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-neutral-700 dark:text-neutral-300 flex items-center justify-between cursor-pointer"
            >
              <span>Serviços de Instalação e Técnicos</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>

            <button
              onClick={() => {
                onNavigateTo('faq');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-neutral-700 dark:text-neutral-300 flex items-center justify-between cursor-pointer"
            >
              <span>Apoio ao Cliente & Perguntas Frequentes</span>
              <ArrowRight className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
