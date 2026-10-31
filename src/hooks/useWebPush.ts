import { useState, useEffect, useCallback } from 'react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface UseWebPushReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  loading: boolean;
  error: string | null;
  subscribe: (userEmail?: string, userName?: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestPush: () => Promise<boolean>;
}

export function useWebPush(): UseWebPushReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support and current subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Register /sw.js
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          const existingSub = await registration.pushManager.getSubscription();
          setIsSubscribed(!!existingSub);
        })
        .catch((err) => {
          console.warn('[WebPush] Erreur enregistrement SW :', err);
        });
    }
  }, []);

  const subscribe = useCallback(
    async (userEmail?: string, userName?: string): Promise<boolean> => {
      if (!isSupported) {
        setError('Les notifications push ne sont pas prises en charge par ce navigateur.');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Demande de permission au navigateur
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          setError('Permission de notification refusée.');
          return false;
        }

        // 2. Récupérer la clé publique VAPID du serveur
        const keyRes = await fetch('/api/push/vapid-public-key');
        const keyData = await keyRes.json();
        if (!keyData.success || !keyData.publicKey) {
          throw new Error('Impossible de récupérer la clé VAPID publique.');
        }

        const registration = await navigator.serviceWorker.ready;

        // 3. Abonnement PushManager
        const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });

        // 4. Envoi de l'abonnement au backend
        const subRes = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            userEmail: userEmail || localStorage.getItem('praxis_auth_email') || '',
            userName: userName || localStorage.getItem('praxis_auth_name') || '',
            userAgent: navigator.userAgent,
          }),
        });

        const subResult = await subRes.json();
        if (!subResult.success) {
          throw new Error(subResult.error || 'Erreur lors de l’enregistrement de l’abonnement.');
        }

        setIsSubscribed(true);
        return true;
      } catch (err: any) {
        console.error('[WebPush] Erreur inscription :', err);
        setError(err.message || 'Erreur lors de l’activation des notifications.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isSupported]
  );

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }
      setIsSubscribed(false);
      return true;
    } catch (err: any) {
      console.error('[WebPush] Erreur désabonnement :', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const sendTestPush = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        throw new Error('Aucun abonnement push actif sur cet appareil.');
      }

      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe,
    sendTestPush,
  };
}
