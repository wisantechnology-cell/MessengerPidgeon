import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Plus,
  Filter,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  Tag,
  ShieldCheck,
  MessageSquare,
  DollarSign,
  ArrowUpDown,
  CheckCircle2,
  Trash2,
  Camera,
  X,
  Moon,
} from 'lucide-react';
import {
  MarketplaceCategory,
  MarketplaceProduct,
  UserProfile,
  Chat,
} from '../../types';
import { INITIAL_MARKETPLACE_PRODUCTS } from '../../data/marketplaceData';
import { PublishProductModal } from './PublishProductModal';
import { ProductDetailModal } from './ProductDetailModal';
import { db, doc, deleteDoc, setDoc } from '../../firebase';

const STORAGE_KEY = 'birdmessage_marketplace_products_v3';

interface MarketplaceViewProps {
  user: UserProfile;
  chats: Chat[];
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onStartChatWithSeller: (product: MarketplaceProduct, initialMessage: string) => void;
}

const CATEGORIES: { id: MarketplaceCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos', icon: '✨' },
  { id: 'tech', label: 'Tecnología', icon: '💻' },
  { id: 'gaming', label: 'Videojuegos', icon: '🎮' },
  { id: 'fashion', label: 'Moda', icon: '👕' },
  { id: 'home', label: 'Hogar', icon: '🛋️' },
  { id: 'sports', label: 'Deportes', icon: '🚲' },
  { id: 'vehicles', label: 'Vehículos', icon: '🚗' },
  { id: 'food', label: 'Comida', icon: '🍔' },
  { id: 'books', label: 'Libros', icon: '📚' },
];

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  user,
  chats,
  isNightMode = false,
  onToggleNightMode,
  onStartChatWithSeller,
}) => {
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => {
    try {
      // Limpiar versiones viejas que contenían productos ficticios
      localStorage.removeItem('birdmessage_marketplace_products');
      localStorage.removeItem('birdmessage_marketplace_products_v2');

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filtrar cualquier producto demo antiguo
          return parsed.filter((p: MarketplaceProduct) => !['prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5', 'prod_6'].includes(p.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MARKETPLACE_PRODUCTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceCategory>('all');
  const [activeTab, setActiveTab] = useState<'explore' | 'my_listings'>('explore');
  const [sortOrder, setSortOrder] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<MarketplaceProduct | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to determine if current user owns a listing
  const isUserOwner = (item: MarketplaceProduct) => {
    return (
      item.sellerId === user.id ||
      item.sellerUsername === user.username ||
      item.sellerId === 'current_user' ||
      item.sellerName === user.name ||
      Boolean(user.username && item.sellerUsername?.toLowerCase() === user.username?.toLowerCase()) ||
      Boolean(user.name && item.sellerName?.toLowerCase() === user.name?.toLowerCase())
    );
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  const handlePublishProduct = async (newProductData: Omit<MarketplaceProduct, 'id' | 'createdAt'>) => {
    const newProduct: MarketplaceProduct = {
      ...newProductData,
      id: `prod_${Date.now()}`,
      createdAt: 'Hace un momento',
    };
    setProducts((prev) => [newProduct, ...prev]);
    setToastMessage('¡Artículo publicado en MessengerPidgeon Market!');
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);

    try {
      if (db) {
        await setDoc(doc(db, 'marketplaceProducts', newProduct.id), newProduct);
      }
    } catch (err) {
      console.warn('Could not sync to firestore:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }
    setProductToDelete(null);

    setToastMessage('Artículo eliminado con éxito');
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);

    try {
      if (db) {
        await deleteDoc(doc(db, 'marketplaceProducts', productId));
      }
    } catch (err) {
      console.warn('Could not delete from firestore:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Tab filter
      if (activeTab === 'my_listings') {
        if (!isUserOwner(item)) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        const matchLocation = item.location.toLowerCase().includes(query);
        const matchSeller = item.sellerName.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchLocation && !matchSeller) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price;
      if (sortOrder === 'price_desc') return b.price - a.price;
      return 0; // recent default
    });
  }, [products, activeTab, selectedCategory, searchQuery, sortOrder, user]);

  const myListingsCount = useMemo(() => {
    return products.filter((p) => isUserOwner(p)).length;
  }, [products, user]);

  return (
    <div className={`flex-1 flex flex-col min-h-screen pb-24 transition-colors duration-300 ${
      isNightMode ? 'bg-[#0a0e16]/80 text-[#dfe2ee]' : 'bg-transparent text-[#0c2340]'
    }`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b px-4 py-3 flex flex-col gap-3 transition-colors duration-300 ${
        isNightMode
          ? 'bg-[#0f131c]/90 border-white/5 text-[#dfe2ee]'
          : 'bg-white/85 border-sky-200/80 shadow-xs text-[#0c2340]'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0084ff] to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-[#0084ff]/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className={`font-extrabold text-base tracking-tight ${
                  isNightMode ? 'text-white' : 'text-[#0c2340]'
                }`}>
                  MessengerPidgeon Market
                </h1>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                  isNightMode
                    ? 'bg-[#0084ff]/20 text-[#7bd0ff] border-[#0084ff]/30'
                    : 'bg-sky-100 text-[#0284c7] border-sky-200'
                }`}>
                  Compra & Venta
                </span>
              </div>
              <p className={`text-[11px] ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                Artículos de tus amigos y contactos verificados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleNightMode && (
              <button
                type="button"
                onClick={onToggleNightMode}
                title={
                  isNightMode
                    ? 'Modo Nocturno ACTIVO (clic para volver al modo claro)'
                    : 'Activar Modo Nocturno (tonos más oscuros)'
                }
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isNightMode
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-950/40'
                    : 'bg-white/90 text-sky-700 hover:text-sky-900 border border-sky-200 shadow-sm hover:bg-sky-100/90'
                }`}
              >
                <Moon className={`w-4 h-4 ${isNightMode ? 'fill-blue-300 text-blue-300' : 'text-sky-600'}`} />
              </button>
            )}

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0084ff] to-cyan-500 hover:opacity-90 text-white text-xs font-bold transition-all shadow-md shadow-[#0084ff]/25 active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>+ Vender</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className={`w-4 h-4 absolute left-3 ${isNightMode ? 'text-[#8d90a0]' : 'text-sky-600'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artículos en venta, ropa, consolas, móviles..."
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs transition-colors focus:outline-none ${
              isNightMode
                ? 'bg-[#141822] border border-white/10 text-white placeholder-[#686c7d] focus:border-[#0084ff]'
                : 'bg-white/95 border border-sky-200 text-[#0c2340] placeholder-slate-400 focus:border-[#0084ff] shadow-xs'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                isNightMode ? 'bg-white/10 text-[#8d90a0] hover:text-white' : 'bg-sky-100 text-sky-700 hover:text-sky-950'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tab & Sorting Controls */}
        <div className={`flex items-center justify-between gap-2 pt-1 border-t ${
          isNightMode ? 'border-white/5' : 'border-sky-100'
        }`}>
          <div className={`flex items-center gap-1.5 p-0.5 rounded-xl border ${
            isNightMode ? 'bg-[#141822] border-white/5' : 'bg-sky-100/70 border-sky-200/60'
          }`}>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#0084ff] text-white shadow-sm'
                  : isNightMode
                  ? 'text-[#8d90a0] hover:text-white'
                  : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Explorar ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('my_listings')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'my_listings'
                  ? 'bg-[#0084ff] text-white shadow-sm'
                  : isNightMode
                  ? 'text-[#8d90a0] hover:text-white'
                  : 'text-sky-800 hover:text-sky-950'
              }`}
            >
              Mis ventas ({myListingsCount})
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setSortOrder((prev) =>
                  prev === 'recent' ? 'price_asc' : prev === 'price_asc' ? 'price_desc' : 'recent'
                )
              }
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-[#141822] hover:bg-[#1a202d] text-[#8d90a0] hover:text-white border-white/5'
                  : 'bg-white hover:bg-sky-50 text-sky-800 hover:text-sky-950 border-sky-200 shadow-xs'
              }`}
            >
              <ArrowUpDown className={`w-3 h-3 ${isNightMode ? 'text-[#7bd0ff]' : 'text-[#0284c7]'}`} />
              <span>
                {sortOrder === 'recent'
                  ? 'Recientes'
                  : sortOrder === 'price_asc'
                  ? 'Menor precio'
                  : 'Mayor precio'}
              </span>
            </button>
          </div>
        </div>

        {/* Category Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? isNightMode
                    ? 'bg-[#0084ff]/20 text-[#7bd0ff] border-[#0084ff]/40 font-bold'
                    : 'bg-[#0084ff] text-white border-[#0084ff] font-bold shadow-xs'
                  : isNightMode
                  ? 'bg-[#141822] text-[#8d90a0] border-white/5 hover:bg-[#1c2230] hover:text-white'
                  : 'bg-white/85 text-sky-900 border-sky-200/80 hover:bg-sky-50 hover:text-sky-950 shadow-xs'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Product Grid Body */}
      <main className="flex-1 p-3 sm:p-4 max-w-5xl mx-auto w-full">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const isOwner = isUserOwner(product);

              return (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`group flex flex-col rounded-2xl border shadow-sm hover:shadow-md overflow-hidden transition-all cursor-pointer active:scale-[0.99] ${
                    isNightMode
                      ? 'bg-[#141822]/90 hover:bg-[#191f2c] border-white/10 hover:border-sky-500/40'
                      : 'bg-white/95 hover:bg-white border-sky-200/80 hover:border-sky-400 shadow-sky-900/5'
                  }`}
                >
                  {/* Image Container with Price Badge */}
                  <div className="relative aspect-square bg-slate-900 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Price Overlay */}
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-white font-extrabold text-sm shadow-md flex items-center gap-0.5">
                      <span className="text-emerald-400">$</span>
                      <span>{product.price.toLocaleString()}</span>
                    </div>

                    {/* Top right badges & delete action */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                      {isOwner && (
                        <div className="px-2 py-0.5 rounded-md bg-[#0084ff] text-white text-[10px] font-bold shadow-md">
                          Tú
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductToDelete(product);
                        }}
                        className="p-1.5 rounded-lg bg-black/70 hover:bg-rose-600 text-rose-300 hover:text-white backdrop-blur-md border border-white/15 transition-all shadow-md cursor-pointer"
                        title="Borrar artículo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info Card Body */}
                  <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                    <div className="flex flex-col gap-1">
                      <h3 className={`font-bold text-xs sm:text-sm line-clamp-2 leading-tight transition-colors ${
                        isNightMode ? 'text-white group-hover:text-sky-300' : 'text-[#0c2340] group-hover:text-[#0084ff]'
                      }`}>
                        {product.title}
                      </h3>
                      <span className={`text-[11px] flex items-center gap-1 truncate ${
                        isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
                      }`}>
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="truncate">{product.location}</span>
                      </span>
                    </div>

                    {/* Seller row & Ask/Delete action */}
                    <div className={`pt-2 border-t flex items-center justify-between gap-1.5 ${
                      isNightMode ? 'border-white/5' : 'border-sky-100'
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <img
                          src={product.sellerAvatarUrl}
                          alt={product.sellerName}
                          className={`w-5 h-5 rounded-full object-cover ring-1 shrink-0 ${
                            isNightMode ? 'ring-white/10' : 'ring-sky-200'
                          }`}
                        />
                        <span className={`text-[10px] font-medium truncate ${
                          isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
                        }`}>
                          {product.sellerName.split(' ')[0]}
                        </span>
                      </div>

                      {isOwner ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                            isNightMode
                              ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200'
                          }`}
                          title="Borrar artículo"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Borrar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                            isNightMode
                              ? 'bg-[#0084ff]/15 hover:bg-[#0084ff] text-[#7bd0ff] hover:text-white'
                              : 'bg-sky-50 hover:bg-[#0084ff] text-[#0084ff] hover:text-white border border-sky-200 hover:border-transparent'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Preguntar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border text-center gap-3 my-8 ${
            isNightMode ? 'bg-[#141822]/60 border-white/5' : 'bg-white/85 border-sky-200 shadow-sm'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isNightMode ? 'bg-[#0084ff]/10 text-sky-400' : 'bg-sky-100 text-[#0284c7]'
            }`}>
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className={`font-bold text-sm ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>
                {activeTab === 'my_listings'
                  ? 'No tienes artículos publicados'
                  : 'No se encontraron publicaciones'}
              </h3>
              <p className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                {activeTab === 'my_listings'
                  ? 'Toma una foto a tus productos, ponles precio y publícalos para que tus contactos los vean.'
                  : 'Intenta con otros términos de búsqueda o cambia la categoría seleccionada.'}
              </p>
            </div>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0084ff] hover:bg-[#0070db] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Publicar mi primer producto</span>
            </button>
          </div>
        )}
      </main>

      {/* Publish Modal */}
      <PublishProductModal
        isOpen={isPublishModalOpen}
        user={user}
        isNightMode={isNightMode}
        onClose={() => setIsPublishModalOpen(false)}
        onPublish={handlePublishProduct}
      />

      {/* Product Detail Modal (With "Preguntar por el producto" Facebook Marketplace style) */}
      <ProductDetailModal
        product={selectedProduct}
        currentUser={user}
        isNightMode={isNightMode}
        onClose={() => setSelectedProduct(null)}
        onAskAboutProduct={onStartChatWithSeller}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* In-App Delete Confirmation Modal (Reliable in iframes, replaces window.confirm) */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setProductToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-center items-center animate-in zoom-in-95 duration-150 ${
              isNightMode ? 'bg-[#141822] border-white/15' : 'bg-white border-sky-200'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className={`text-base font-bold ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>¿Borrar este artículo?</h3>
              <p className={`text-xs leading-relaxed ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                ¿Seguro que deseas eliminar <span className={`font-semibold ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>"{productToDelete.title}"</span> de MessengerPidgeon Market? Se retirará permanentemente de la venta.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full pt-1">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                  isNightMode
                    ? 'bg-white/10 hover:bg-white/15 text-white'
                    : 'bg-sky-100 hover:bg-sky-200 text-[#0c2340]'
                }`}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteProduct(productToDelete.id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, borrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none ${
          isNightMode
            ? 'bg-[#1c2230] border-white/15 text-white'
            : 'bg-white border-sky-200 text-[#0c2340] shadow-sky-950/15'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
