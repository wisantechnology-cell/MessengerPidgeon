import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Tablet,
  Download,
  Share2,
  PlusSquare,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import { BirdLogo } from './BirdLogo';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  isNightMode?: boolean;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  isNightMode = true,
}) => {
  const [deviceTab, setDeviceTab] = useState<'android' | 'ios' | 'tablet'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(Boolean(isStandalone));

    // Detect device automatically for default tab
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
      setDeviceTab('tablet');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setDeviceTab('ios');
    } else {
      setDeviceTab('android');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard?.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'PidgeX - Mensajería Privada & Juegos',
        text: '¡Instala PidgeX en tu celular o tablet para hablar y jugar en tiempo real!',
        url: window.location.origin,
      }).catch(() => {});
    } else {
      handleCopyAppUrl();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200 ${
          isNightMode
            ? 'bg-[#141822] border-white/10 text-[#dfe2ee]'
            : 'bg-white border-sky-200 text-[#0c2340]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isNightMode ? 'border-white/10 bg-[#0f131c]' : 'border-sky-100 bg-sky-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] p-1.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <BirdLogo className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                <span>Instalar PidgeX</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  App Real
                </span>
              </h2>
              <p className="text-xs text-[#8d90a0]">Para tu celular y tablet (Sin descargas pesadas)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isNightMode ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Switcher Tabs */}
        <div className={`grid grid-cols-3 p-1.5 m-4 rounded-2xl border ${
          isNightMode ? 'bg-[#0a0e16] border-white/5' : 'bg-sky-100/70 border-sky-200'
        }`}>
          <button
            onClick={() => setDeviceTab('android')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'android'
                ? 'bg-[#0284c7] text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setDeviceTab('ios')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'ios'
                ? 'bg-[#0284c7] text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>iPhone</span>
          </button>
          <button
            onClick={() => setDeviceTab('tablet')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              deviceTab === 'tablet'
                ? 'bg-[#0284c7] text-white shadow-md'
                : 'text-[#8d90a0] hover:text-white'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Tablets</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          {/* Quick Install Banner if browser supports beforeinstallprompt */}
          {deferredPrompt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-600/30 to-blue-600/30 border border-sky-400/40 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  ¡Tu navegador permite instalación directa!
                </span>
                <span className="text-[11px] text-sky-200/80">Toca para agregar a tu pantalla principal</span>
              </div>
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Ya</span>
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>¡PidgeX ya está instalado en modo pantalla completa en este dispositivo!</span>
            </div>
          )}

          {/* Tab 1: Android (Samsung, Xiaomi, Motorola, etc.) */}
          {deviceTab === 'android' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-sky-400">Cómo instalar en Celulares Android (Chrome / Samsung):</h3>
              
              <div className="flex flex-col gap-2.5">
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="text-xs leading-relaxed">
                    Abre el enlace de PidgeX en <strong>Google Chrome</strong> o <strong>Samsung Internet</strong> en tu teléfono.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="text-xs leading-relaxed">
                    Toca los <strong>3 puntos verticales (⋮)</strong> en la esquina superior derecha del navegador.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div className="text-xs leading-relaxed">
                    Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">✓</span>
                  <div className="text-xs leading-relaxed text-emerald-400 font-semibold">
                    ¡Listo! PidgeX aparecerá en el menú de aplicaciones de tu teléfono con su icono azul de la paloma, sin barra de direcciones, como una app nativa.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iPhone (iOS Safari) */}
          {deviceTab === 'ios' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-sky-400">Cómo instalar en iPhone (Safari):</h3>

              <div className="flex flex-col gap-2.5">
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">1</span>
                  <div className="text-xs leading-relaxed">
                    Abre el enlace de PidgeX en el navegador <strong>Safari</strong> de tu iPhone.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">2</span>
                  <div className="text-xs leading-relaxed">
                    Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> (el cuadrado con la flecha hacia arriba en la barra inferior).
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0">3</span>
                  <div className="text-xs leading-relaxed">
                    Baja en las opciones y presiona <strong>"Añadir a la pantalla de inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-sky-400" />.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">✓</span>
                  <div className="text-xs leading-relaxed text-emerald-400 font-semibold">
                    Toca <strong>"Añadir"</strong> arriba a la derecha. PidgeX se guardará en tu inicio con su icono y abrirá en pantalla completa sin interfaz de Safari.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Tablets (iPad / Galaxy Tab / etc.) */}
          {deviceTab === 'tablet' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-sky-400">Cómo usar PidgeX en Tablets (iPad y Android):</h3>

              <div className="flex flex-col gap-2.5">
                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Tablet className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong>Pantalla ancha optimizada:</strong> En tablets, PidgeX se adapta automáticamente tanto en modo vertical como horizontal (landscape), con botones grandes y teclado cómodo.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Monitor className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong>En iPad:</strong> Toca el botón <strong>Compartir</strong> en Safari y luego <strong>"Añadir a pantalla de inicio"</strong>.
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  isNightMode ? 'bg-[#0f131c] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong>En Tablet Samsung / Lenovo / etc:</strong> Toca los <strong>3 puntos (⋮)</strong> en Chrome y pulsa <strong>"Instalar aplicación"</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share & Copy Link Section */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 mt-1 ${
            isNightMode ? 'bg-[#0a0e16] border-white/10' : 'bg-sky-50 border-sky-200'
          }`}>
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              Enviar el enlace a tu celular o al de tu hermano:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAppUrl}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar Enlace'}</span>
              </button>

              <button
                onClick={handleShareApp}
                className="flex-1 py-2 px-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartir App</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
