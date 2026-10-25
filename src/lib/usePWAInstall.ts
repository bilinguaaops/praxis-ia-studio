import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function openPWAInstallPrompt() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('praxis-open-pwa-install'));
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('praxis_pwa_dismissed');
      if (stored) {
        const time = parseInt(stored, 10);
        // Reshow after 7 days if user dismissed
        if (Date.now() - time < 7 * 24 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode (app already installed and running as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect mobile device
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    const isMobileDevice =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
      window.innerWidth <= 768;

    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);

    const handleResize = () => {
      setIsMobile(
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua) ||
        window.innerWidth <= 768
      );
    };
    window.addEventListener('resize', handleResize);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser mini-infobar on mobile so our native-feeling UI can trigger it
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallGuide(false);
      try {
        localStorage.removeItem('praxis_pwa_dismissed');
      } catch {}
    };

    const handleOpenInstallEvent = () => {
      // If native deferred prompt is available, launch it directly!
      if (deferredPrompt) {
        deferredPrompt.prompt().then(() => {
          deferredPrompt.userChoice.then((choice) => {
            if (choice.outcome === 'accepted') {
              setIsInstalled(true);
              setDeferredPrompt(null);
            }
          });
        });
      } else {
        // Otherwise open the guided modal
        setShowInstallGuide(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('praxis-open-pwa-install', handleOpenInstallEvent);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('praxis-open-pwa-install', handleOpenInstallEvent);
    };
  }, [deferredPrompt]);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      setShowInstallGuide(true);
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallGuide(false);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Erreur lors du prompt d’installation:', err);
    }
    return false;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setShowInstallGuide(false);
    try {
      localStorage.setItem('praxis_pwa_dismissed', Date.now().toString());
    } catch {}
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isMobile,
    dismissed,
    showInstallGuide,
    setShowInstallGuide,
    install,
    dismiss,
  };
}
