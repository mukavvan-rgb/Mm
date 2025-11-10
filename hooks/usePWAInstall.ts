import { useState, useEffect, useCallback } from 'react';

// TypeScript interface for the BeforeInstallPromptEvent, which is not a standard lib type.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const checkInstalled = () => {
      // Checks if the app is installed
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
        setIsAppInstalled(true);
        setInstallPrompt(null); // Hide button if already installed
      }
    };

    checkInstalled();

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
        setIsAppInstalled(true);
        setInstallPrompt(null);
    });
    
    // Check on visibility change in case the user installs via browser menu
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            checkInstalled();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  const triggerInstallPrompt = useCallback(async () => {
    if (!installPrompt) {
      return;
    }
    // Show the install prompt
    await installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, so clear it.
    setInstallPrompt(null);
  }, [installPrompt]);
  
  const canInstall = !!installPrompt && !isAppInstalled;

  return { canInstall, triggerInstallPrompt };
}
