import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { UrgencyCountdownGrid } from './components/UrgencyCountdownGrid';
import { CircularEconomyCalculator } from './components/CircularEconomyCalculator';
import { DiscountMatrix } from './components/DiscountMatrix';
import { EditorialGuides } from './components/EditorialGuides';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import {
  ProductModal,
  CartModal,
  AccountModal,
  ArticleModal,
  StoreModal,
  WORTEN_STORES,
  WortenStore,
} from './components/Modals';
import { WortenVirtualAssistant } from './components/WortenVirtualAssistant';
import { PromoProduct, EditorialArticle } from './types';
import { CheckCircle2, ArrowUp } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<PromoProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<PromoProduct | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<EditorialArticle | null>(null);
  const [cartModalOpen, setCartModalOpen] = useState<boolean>(false);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [storeModalOpen, setStoreModalOpen] = useState<boolean>(false);
  const [chatbotOpen, setChatbotOpen] = useState<boolean>(false);
  const [selectedStore, setSelectedStore] = useState<WortenStore>(WORTEN_STORES[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Sync dark class on root document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Track scroll position for Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleNavigateTo = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: PromoProduct) => {
    setCartItems((prev) => [...prev, product]);
    triggerToast(`"${product.title}" adicionado ao carrinho!`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    triggerToast('Encomenda finalizada com sucesso!');
  };

  const handleSearch = (query: string) => {
    triggerToast(`Pesquisa por "${query}": a filtrar ofertas relevantes...`);
    setSelectedCategory('all');
    handleNavigateTo('promocoes');
  };

  const handleSelectDeal = (dealTitle: string) => {
    triggerToast(`Campanha selecionada: ${dealTitle}`);
    handleNavigateTo('promocoes');
  };

  const handleSelectTag = (tag: string) => {
    triggerToast(`Filtro aplicado: ${tag}`);
    handleNavigateTo('promocoes');
  };

  const handleBookService = (serviceDetail: string) => {
    setChatbotOpen(true);
    triggerToast(`A abrir agendamento com a Worten Resolve para ${serviceDetail}...`);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors selection:bg-[#DE001A] selection:text-white font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Global Navigation & Top Utility Bar (Menu, Worten Resolve, Worten Life, Cupões, Lojas, Login) */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigateTo={handleNavigateTo}
        onOpenSearch={handleSearch}
        cartCount={cartItems.length}
        cartTotal={cartItems.reduce((acc, item) => acc + item.promoPrice, 0)}
        onOpenCartModal={() => setCartModalOpen(true)}
        onOpenAccountModal={() => setAccountModalOpen(true)}
        selectedStore={selectedStore}
        onOpenStoreModal={() => setStoreModalOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* 2 & 3. Hero Carousel Principal + Barra de Confiança e Reversão de Risco */}
      <HeroSection
        onNavigateTo={handleNavigateTo}
        onSelectDeal={handleSelectDeal}
      />

      {/* 4. Acesso Rápido a Categorias & Campanha 20% em Talão */}
      <UrgencyCountdownGrid
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigateTo('promocoes');
        }}
        onNavigateTo={handleNavigateTo}
      />

      {/* 5. Grelha de Descontos e Destaques Comerciais (Smartphones, TVs, Grandes Eletrodomésticos, Informática) */}
      <DiscountMatrix
        selectedCategoryFilter={selectedCategory}
        onAddToCart={handleAddToCart}
        onOpenProductModal={(product) => setSelectedProduct(product)}
      />

      {/* 6. Bloco de Economia Circular e Serviços ("Worten Resolve: Reparar ou comprar novo?") */}
      <CircularEconomyCalculator
        onBookService={handleBookService}
        onOpenChatbot={() => setChatbotOpen(true)}
      />

      {/* 7. Guias de Compra e Tendências ("Tendências do Momento 🔥" e "Dicas e Novidades") */}
      <EditorialGuides
        onOpenArticle={(art) => setSelectedArticle(art)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigateTo('promocoes');
        }}
      />

      {/* FAQ Section */}
      <FAQSection onOpenChatbot={() => setChatbotOpen(true)} />

      {/* 8. Footer Completo: Selos oficiais, links institucionais e aviso legal de intermediário de crédito */}
      <Footer />

      {/* Interactive Modals */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartModal
        isOpen={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      <StoreModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        selectedStore={selectedStore}
        onSelectStore={(store) => {
          setSelectedStore(store);
          triggerToast(`Loja alterada para ${store.name} (${store.city})`);
        }}
      />

      {/* Worten Virtual Assistant (FAQ Chatbot + Google Calendar Integration) */}
      <WortenVirtualAssistant
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onOpen={() => setChatbotOpen(true)}
      />

      {/* Scroll to Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar ao topo"
          className="fixed bottom-24 right-7 z-40 p-3 rounded-full bg-[#DE001A] hover:bg-[#BF0016] text-white shadow-xl transition-all hover:scale-110 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
