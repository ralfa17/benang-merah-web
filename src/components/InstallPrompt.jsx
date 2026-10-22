import React, { useState, useEffect } from 'react';
import { DownloadIcon, CloseIcon } from './icons';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan dalam mode standalone (sudah diinstal)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Deteksi iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|firefox|fxios/.test(ua);
    if (isAppleDevice && isSafari && !window.navigator.standalone) {
      setIsIOS(true);
    }

    // Tangani event PWA sebelum instal (Android Chrome, Edge, PC)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isInstalled || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* FLOATING PROMPT BANNER ELEGAN MAROON */}
      <aside aria-label="Instal Aplikasi PWA" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-fade-up">
        <div className="bg-[#701A24] text-white p-4 rounded-2xl shadow-2xl border border-red-900/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Benang Merah"
              className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 shrink-0 shadow-xs"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
            <div>
              <p className="font-serif font-bold text-xs leading-tight">
                Instal Aplikasi Benang Merah
              </p>
              <p className="text-[11px] text-red-100/90 font-light mt-0.5">
                {isIOS
                  ? 'Pasang di iPhone / iPad Anda via Safari'
                  : 'Akses cepat & rekam medis langsung dari layar HP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-white text-[#701A24] hover:bg-red-50 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <DownloadIcon className="w-3.5 h-3.5 text-[#701A24]" />
              <span>{isIOS ? 'Petunjuk iOS' : 'Instal'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label="Tutup petunjuk instalasi"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MODAL PANDUAN INSTAL UNTUK PENGGUNA IPHONE / SAFARI */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-up">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#EADFD5] text-[#1E293B]">
            <div className="flex justify-between items-center pb-3 border-b border-[#EADFD5]">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain rounded-lg" />
                <h3 className="font-serif font-bold text-sm text-[#701A24]">
                  Instal di iOS (Safari)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-gray-700">
              <p className="font-medium">
                Untuk memasang aplikasi Klinik Benang Merah di iPhone / iPad Anda:
              </p>
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EADFD5] space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#701A24] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Buka browser <strong>Safari</strong> dan ketuk tombol <strong>Bagikan (Share)</strong> berbentuk kotak dengan panah ke atas di bilah bawah browser Safari.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#701A24] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Gulir ke bawah pada menu opsi lalu pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#701A24] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Ketuk <strong>"Tambah" (Add)</strong> di pojok kanan atas. Ikon aplikasi Benang Merah akan muncul di layar utama iPhone Anda!
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#701A24] text-white font-semibold rounded-xl hover:bg-[#54121B] transition text-xs shadow-md"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
