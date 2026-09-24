import React, { useState } from 'react';
import {
  X,
  ShoppingCart,
  CreditCard,
  Truck,
  ShieldCheck,
  Check,
  ArrowRight,
  Gift,
  Tag,
  Star,
  User,
  Sparkles,
  Lock,
  BookOpen,
} from 'lucide-react';
import { PromoProduct, EditorialArticle } from '../types';

interface ProductModalProps {
  product: PromoProduct | null;
  onClose: () => void;
  onAddToCart: (product: PromoProduct) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  if (!product) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'OFF20' || couponCode.trim().toUpperCase() === 'UNI10') {
      setCouponApplied(true);
    } else {
      alert('Cupão não reconhecido. Experimenta "OFF20" ou "UNI10"!');
    }
  };

  const finalPrice = couponApplied
    ? couponCode.trim().toUpperCase() === 'OFF20'
      ? product.promoPrice * 0.8
      : product.promoPrice * 0.9
    : product.promoPrice;

  const handleAdd = () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          {/* Real Product Image Showcase */}
          {product.imageUrl && (
            <div className="w-full h-52 sm:h-60 bg-[#F9F9FB] dark:bg-neutral-800/80 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 flex items-center justify-center p-3 relative">
              <img
                src={product.imageUrl}
                alt={product.imageAlt}
                className="w-full h-full object-cover object-center rounded-xl"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-[#DE001A] text-white text-xs font-black uppercase tracking-wider rounded-md shadow-md">
                {product.discountBadge}
              </span>
              <span className="absolute top-3 right-3 text-[10px] font-bold text-emerald-800 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs border border-emerald-200">
                {product.deliveryTag}
              </span>
            </div>
          )}

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {product.title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {product.subtitle}
            </p>
          </div>

          {/* Pricing & Installments */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-neutral-900 dark:text-white">
                {finalPrice.toFixed(2)}€
              </span>
              <span className="text-sm text-neutral-400 line-through">
                {product.originalPrice.toFixed(2)}€
              </span>
              {couponApplied && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  Cupão Ativo!
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span>{product.financingInfo} (Cartão Universo / TAEG 18,5%)</span>
            </div>

            <div className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50">
              🎁 {product.secondaryIncentive}
            </div>
          </div>

          {/* Coupon input */}
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Tens cupão? (ex: OFF20 ou UNI10)"
              className="flex-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 px-3.5 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500 uppercase"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-red-600 dark:hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Aplicar Cupão
            </button>
          </form>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300 pt-1">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-600" />
              <span>Entregas Grátis &gt; 35€</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Preço Mínimo Garantido</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              onClick={handleAdd}
              className={`flex-1 py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/30'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Adicionado ao Carrinho!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Adicionar ao Carrinho</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: PromoProduct[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + item.promoPrice, 0);
  const freeShippingThreshold = 35;
  const isFreeShipping = total >= freeShippingThreshold;
  const missingForFree = Math.max(0, freeShippingThreshold - total);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-red-600" />
              O teu Carrinho ({cartItems.length})
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress bar */}
          <div className="mb-4 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs">
            {isFreeShipping ? (
              <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>Parabéns! Tens Entregas Grátis na tua encomenda.</span>
              </div>
            ) : (
              <div className="text-neutral-600 dark:text-neutral-300 font-medium">
                Faltam <strong>{missingForFree.toFixed(2)}€</strong> para teres Entregas Grátis!
              </div>
            )}
          </div>

          {/* Item list */}
          {cartItems.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-sm space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600" />
              <p>O teu carrinho ainda está vazio.</p>
              <p className="text-xs text-neutral-500">
                Aproveita as promoções até 20% em talão e adiciona os teus favoritos!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cartItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700/60 gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-11 h-11 object-cover rounded-lg shrink-0 border border-neutral-200"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-neutral-200 rounded-lg shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className="text-xs font-black text-[#DE001A]">
                        {item.promoPrice.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-xs text-neutral-400 hover:text-red-600 cursor-pointer p-1 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3 mt-4">
            <div className="flex items-center justify-between text-sm font-bold text-neutral-900 dark:text-white">
              <span>Total Estimado:</span>
              <span className="text-xl font-black text-red-600 dark:text-red-400">
                {total.toFixed(2)}€
              </span>
            </div>

            <button
              onClick={() => {
                alert('A avançar para o checkout seguro Worten com 3D Secure...');
                onClearCart();
                onClose();
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Finalizar Compra Segura</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto font-black text-xl shadow-md">
              W
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white">
              {mode === 'login' ? 'Iniciar Sessão' : 'Criar Conta Worten'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Acede aos teus cupões, talões digitais e segue encomendas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Endereço de Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.pt"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">
                Palavra-passe
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors shadow-md cursor-pointer"
            >
              {mode === 'login' ? 'ENTRAR NA MINHA CONTA' : 'CRIAR CONTA GRÁTIS'}
            </button>

            {submitted && (
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold text-center">
                ✓ Sessão iniciada! Bem-vindo(a) de volta.
              </div>
            )}
          </form>

          <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {mode === 'login' ? (
              <p>
                Ainda não tens conta?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Regista-te grátis
                </button>
              </p>
            ) : (
              <p>
                Já tens conta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Iniciar Sessão
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ArticleModalProps {
  article: EditorialArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-red-600/10 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-bold uppercase rounded-md">
              {article.type}
            </span>
            <span className="text-xs text-neutral-400">{article.readTime}</span>
          </div>

          <h3 className="text-2xl font-black text-neutral-900 dark:text-white leading-tight">
            {article.title}
          </h3>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
            {article.excerpt}
          </p>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
            <div className="font-bold text-neutral-900 dark:text-white">
              💡 Recomendações dos Especialistas Worten:
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Avalia sempre a autonomia e o custo por utilização antes de decidir.</li>
              <li>Aproveita as campanhas de 20% em talão para reinvestir nos acessórios indispensáveis.</li>
              <li>Usa o simulador Worten Resolve se ainda tiveres um equipamento usado para retoma imediata.</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#DE001A] hover:bg-[#BF0016] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fechar Artigo
          </button>
        </div>
      </div>
    </div>
  );
};

export interface WortenStore {
  id: string;
  name: string;
  city: string;
  address: string;
  schedule: string;
  phone: string;
  expressReady: boolean;
}

export const WORTEN_STORES: WortenStore[] = [
  {
    id: 'colombo',
    name: 'Centro Colombo',
    city: 'Lisboa',
    address: 'Av. Lusíada, Loja 0.001, 1500-392 Lisboa',
    schedule: 'Aberta hoje até às 23:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'norteshopping',
    name: 'NorteShopping',
    city: 'Matosinhos (Porto)',
    address: 'R. Sara Afonso, Loja 114, 4460-841 Senhora da Hora',
    schedule: 'Aberta hoje até às 23:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'almada',
    name: 'Almada Forum',
    city: 'Almada',
    address: 'R. Sérgio Malpique, Loja 1.02, 2810-500 Almada',
    schedule: 'Aberta hoje até às 23:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'braga',
    name: 'Braga Parque',
    city: 'Braga',
    address: 'Quinta dos Congregados, 4710-427 Braga',
    schedule: 'Aberta hoje até às 22:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'coimbra',
    name: 'CoimbraShopping',
    city: 'Coimbra',
    address: 'Av. Mendes Silva, 3030-386 Coimbra',
    schedule: 'Aberta hoje até às 22:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'faro',
    name: 'MAR Shopping Algarve',
    city: 'Loulé / Faro',
    address: 'Av. Alm. Gago Coutinho, 8135-014 Loulé',
    schedule: 'Aberta hoje até às 23:00',
    phone: '210 155 222',
    expressReady: true,
  },
  {
    id: 'cascais',
    name: 'CascaiShopping',
    city: 'Cascais',
    address: 'Estrada Nacional 9, 2645-543 Alcabideche',
    schedule: 'Aberta hoje até às 23:00',
    phone: '210 155 222',
    expressReady: true,
  },
];

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStore: WortenStore;
  onSelectStore: (store: WortenStore) => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  selectedStore,
  onSelectStore,
}) => {
  const [filterCity, setFilterCity] = useState('');

  if (!isOpen) return null;

  const filtered = WORTEN_STORES.filter(
    (s) =>
      s.name.toLowerCase().includes(filterCity.toLowerCase()) ||
      s.city.toLowerCase().includes(filterCity.toLowerCase()) ||
      s.address.toLowerCase().includes(filterCity.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DE001A]" />
              Escolhe a tua Loja Worten
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Consulta stock imediato e levanta encomendas em 15 minutos (Click & Collect grátis).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <input
            type="text"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder="Pesquisar por cidade ou nome do centro comercial..."
            className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-500 px-3.5 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#DE001A]"
          />
        </div>

        {/* Stores list */}
        <div className="space-y-2.5 overflow-y-auto pr-1 max-h-80 flex-1">
          {filtered.map((store) => {
            const isSelected = selectedStore.id === store.id;
            return (
              <div
                key={store.id}
                onClick={() => {
                  onSelectStore(store);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-[#DE001A] bg-red-50/50 dark:bg-red-950/20'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40'
                }`}
              >
                <div className="space-y-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                      {store.name}
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                      {store.city}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-[#DE001A] bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded">
                        Selecionada
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {store.address}
                  </p>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {store.schedule}
                    </span>
                    <span className="text-neutral-400">•</span>
                    <span className="text-neutral-600 dark:text-neutral-300">
                      Pronto em 15 min ⚡
                    </span>
                  </div>
                </div>

                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#DE001A] text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-[#DE001A] hover:text-white'
                  }`}
                >
                  {isSelected ? 'Escolhida' : 'Selecionar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

