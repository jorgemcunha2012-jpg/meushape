import { useState, useEffect } from "react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { Download, Share, Plus, Check, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const AppInstall = () => {
  const s = useSolar();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <SolarPage>
        <SolarHeader title="Instalar App" showBack />
        <div className="px-5 pt-12 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${s.orange}20` }}>
            <Check size={32} style={{ color: s.orange }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: s.text }}>App já instalado!</h2>
          <p style={{ color: s.textSub }}>O Meu Shape já está na sua tela inicial.</p>
        </div>
      </SolarPage>
    );
  }

  return (
    <SolarPage>
      <SolarHeader title="Instalar App" showBack />
      <div className="px-5 pt-8 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${s.orange}20` }}>
            <Smartphone size={40} style={{ color: s.orange }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: s.text, fontFamily: "'Montserrat', sans-serif" }}>
            Instale o Meu Shape
          </h2>
          <p className="text-sm max-w-xs" style={{ color: s.textSub }}>
            Acesse seus treinos direto da tela inicial, sem abrir o navegador. Rápido, offline e leve.
          </p>
        </div>

        {/* Android / Desktop — native prompt */}
        {deferredPrompt && (
          <Button
            onClick={handleInstall}
            className="w-full max-w-xs rounded-2xl py-6 text-base font-bold"
            style={{ backgroundColor: s.orange, color: "#fff" }}
          >
            <Download size={20} className="mr-2" />
            Instalar agora
          </Button>
        )}

        {/* iOS instructions */}
        {isIOS && !deferredPrompt && (
          <div className="w-full max-w-xs rounded-2xl p-5 space-y-4" style={{ backgroundColor: s.card, border: `1px solid ${s.cardBorder}` }}>
            <p className="text-sm font-semibold" style={{ color: s.text }}>No Safari, siga os passos:</p>
            {[
              { icon: Share, text: 'Toque no botão "Compartilhar"' },
              { icon: Plus, text: '"Adicionar à Tela de Início"' },
              { icon: Check, text: 'Confirme tocando em "Adicionar"' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${s.orange}15` }}>
                  <Icon size={16} style={{ color: s.orange }} />
                </div>
                <span className="text-sm" style={{ color: s.textSub }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Fallback for desktop without prompt */}
        {!isIOS && !deferredPrompt && (
          <p className="text-sm text-center max-w-xs" style={{ color: s.textMuted }}>
            Abra este site no Chrome do celular para instalar o app na sua tela inicial.
          </p>
        )}
      </div>
    </SolarPage>
  );
};

export default AppInstall;
