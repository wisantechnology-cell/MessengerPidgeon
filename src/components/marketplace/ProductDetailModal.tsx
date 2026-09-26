import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  Check,
  Tag,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Phone,
  Trash2,
} from 'lucide-react';
import { MarketplaceProduct, UserProfile } from '../../types';

interface ProductDetailModalProps {
  product: MarketplaceProduct | null;
  currentUser: UserProfile;
  isNightMode?: boolean;
  onClose: () => void;
  onAskAboutProduct: (product: MarketplaceProduct, inquiryMessage: string) => void;
  onDeleteProduct?: (productId: string) => void;
}

const PRESET_QUESTIONS = [
  '¿Hola! Sigue disponible el producto?',
  '¿Cuál es tu último precio o haces rebaja?',
  '¿Haces entregas en punto medio o envíos?',
  '¿Tiene algún detalle o viene con su caja original?',
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currentUser,
  isNightMode = false,
  onClose,
  onAskAboutProduct,
  onDeleteProduct,
}) => {
  const [customMessage, setCustomMessage] = useState<string>(
    product ? `¡Hola ${product.sellerName.split(' ')[0]}! Me interesa tu publicación "${product.title}" por $${product.price}. ¿Sigue disponible?` : ''
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [product?.id]);

  if (!product) return null;

  const isOwner =
    product.sellerId === currentUser.id ||
    product.sellerUsername === currentUser.username ||
    product.sellerId === 'current_user' ||
    product.sellerName === currentUser.name ||
    Boolean(currentUser.username && product.sellerUsername?.toLowerCase() === currentUser.username.toLowerCase()) ||
    Boolean(currentUser.name && product.sellerName?.toLowerCase() === currentUser.name.toLowerCase());

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMessage.trim()) return;

    onAskAboutProduct(product, customMessage.trim());
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 600);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const conditionLabels: Record<string, { label: string; color: string }> = {
    new: { label: 'Nuevo sellado', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    like_new: { label: 'Como nuevo', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
    good: { label: 'Buen estado', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    fair: { label: 'Usado funcional', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  };

  const condInfo = conditionLabels[product.condition] || conditionLabels.good;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[92vh] border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-auto ${
          isNightMode
            ? 'bg-[#141822] border-white/10 text-[#dfe2ee]'
            : 'bg-white border-sky-200 text-[#0c2340] shadow-sky-950/20'
        }`}
      >
        {/* Header Bar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isNightMode ? 'bg-[#10141c] border-white/10' : 'bg-sky-50/90 border-sky-100'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              isNightMode
                ? 'bg-[#0084ff]/20 text-[#7bd0ff] border-[#0084ff]/30'
                : 'bg-sky-100 text-[#0284c7] border-sky-200'
            }`}>
              MessengerPidgeon Market
            </span>
            <span className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
              Detalles del artículo
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLink}
              title="Copiar enlace"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white'
                  : 'bg-sky-100/70 hover:bg-sky-200 text-sky-800'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isNightMode
                  ? 'bg-white/5 hover:bg-white/10 text-[#8d90a0] hover:text-white'
                  : 'bg-sky-100/70 hover:bg-sky-200 text-sky-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Main Product Image */}
          <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-900">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
            />
            {/* Price Badge Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-white font-extrabold text-lg shadow-xl flex items-center gap-1">
              <span className="text-emerald-400">$</span>
              <span>{product.price.toLocaleString()}</span>
            </div>
            {/* Condition Tag */}
            <div
              className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-md ${condInfo.color}`}
            >
              {condInfo.label}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            {/* Title & Metadata */}
            <div className="flex flex-col gap-1.5">
              <h2 className={`text-lg sm:text-xl font-bold leading-snug ${
                isNightMode ? 'text-white' : 'text-[#0c2340]'
              }`}>
                {product.title}
              </h2>

              <div className={`flex flex-wrap items-center gap-3 text-xs ${
                isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
              }`}>
                <span className={`flex items-center gap-1 ${
                  isNightMode ? 'text-[#dfe2ee]' : 'text-[#0c2340]'
                }`}>
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {product.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {product.createdAt}
                </span>
              </div>
            </div>

            {/* Seller Card */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${
              isNightMode ? 'bg-[#1c2230]/80 border-white/5' : 'bg-sky-50/70 border-sky-200/80 shadow-xs'
            }`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={product.sellerAvatarUrl}
                    alt={product.sellerName}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-400/50"
                  />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ${
                    isNightMode ? 'ring-[#1c2230]' : 'ring-white'
                  }`} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-sm ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>
                      {product.sellerName}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-sky-500" />
                  </div>
                  <span className="text-xs text-sky-600 dark:text-sky-400 font-mono">{product.sellerUsername}</span>
                  {product.sellerPhone && (
                    <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                      isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
                    }`}>
                      <Phone className="w-3 h-3 text-sky-600" />
                      {product.sellerPhone}
                    </span>
                  )}
                </div>
              </div>

              {isOwner ? (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isNightMode ? 'bg-white/10 text-white' : 'bg-sky-100 text-sky-900 border border-sky-200'
                }`}>
                  Tu publicación
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Vendedor verificado
                </span>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'
              }`}>
                Descripción
              </h4>
              <p className={`text-xs leading-relaxed whitespace-pre-line p-3.5 rounded-xl border ${
                isNightMode
                  ? 'bg-[#181d28] border-white/5 text-[#dfe2ee]'
                  : 'bg-sky-50/50 border-sky-200/70 text-[#0c2340]'
              }`}>
                {product.description}
              </p>
            </div>

            {/* Delete Confirmation Box */}
            {isConfirmingDelete && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>¿Deseas eliminar permanentemente este artículo?</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isNightMode ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-sky-100 hover:bg-sky-200 text-[#0c2340]'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteProduct) {
                        onDeleteProduct(product.id);
                      }
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold shadow-md shadow-rose-600/30 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, eliminar</span>
                  </button>
                </div>
              </div>
            )}

            {/* "Preguntar por el producto" Section (Facebook Marketplace style) */}
            {!isOwner ? (
              <div className="flex flex-col gap-2">
                <section className={`flex flex-col gap-3 p-4 rounded-xl border shadow-sm ${
                  isNightMode
                    ? 'bg-gradient-to-br from-[#182236] to-[#121926] border-[#0084ff]/30 shadow-lg'
                    : 'bg-gradient-to-br from-sky-50 to-cyan-50/70 border-sky-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#0084ff]/20 text-[#0084ff] flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <h4 className={`font-bold text-sm ${isNightMode ? 'text-white' : 'text-[#0c2340]'}`}>
                      Preguntar por el producto
                    </h4>
                  </div>

                  {/* Preset Fast Inquiry Questions */}
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCustomMessage(q)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors text-left cursor-pointer ${
                          isNightMode
                            ? 'bg-white/5 hover:bg-white/15 text-[#dfe2ee] border-white/10'
                            : 'bg-white hover:bg-sky-100 text-[#0c2340] border-sky-200 shadow-xs'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  {/* Message input and Send button */}
                  <form onSubmit={handleSendInquiry} className="flex flex-col gap-2 pt-1">
                    <textarea
                      rows={2}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Escribe tu mensaje o pregunta al vendedor..."
                      className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors resize-none ${
                        isNightMode
                          ? 'bg-[#0f131c] border-white/15 text-white placeholder-[#686c7d] focus:border-[#0084ff]'
                          : 'bg-white border-sky-200 text-[#0c2340] placeholder-slate-400 focus:border-[#0084ff] shadow-inner'
                      }`}
                    />

                    <button
                      type="submit"
                      disabled={!customMessage.trim() || sentSuccess}
                      className="w-full py-2.5 rounded-xl bg-[#0084ff] hover:bg-[#0070db] active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {sentSuccess ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>¡Mensaje enviado al chat!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar mensaje al vendedor en MessengerPidgeon</span>
                        </>
                      )}
                    </button>
                  </form>
                </section>

                {onDeleteProduct && !isConfirmingDelete && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-md hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar este artículo</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              !isConfirmingDelete && (
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isNightMode ? 'bg-white/5 border-white/5' : 'bg-sky-50/70 border-sky-200/70'
                }`}>
                  <span className={`text-xs ${isNightMode ? 'text-[#8d90a0]' : 'text-[#476788]'}`}>
                    Opciones de tu artículo:
                  </span>
                  {onDeleteProduct && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar publicación</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
