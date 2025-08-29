import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Globe, Lock, ExternalLink } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface StripeCheckoutProps {
  checkoutUrl: string;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
}

const isInWebView = () => {
  // Detect if running in a webview
  const userAgent = navigator.userAgent.toLowerCase();
  const isStandalone = (window.navigator as any)?.standalone === true;
  
  return (
    userAgent.includes('wv') || // Android WebView
    userAgent.includes('webview') ||
    (userAgent.includes('mobile') && !userAgent.includes('safari')) ||
    isStandalone // iOS standalone mode
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  checkoutUrl,
  onClose,
  onSuccess,
  title = 'Finalizando Pagamento'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(false);

  useEffect(() => {
    const handleCheckout = async () => {
      // Determine the best way to open checkout
      if (Capacitor.isNativePlatform()) {
        // Native app - use Capacitor Browser (custom tabs/SafariViewController)
        try {
          await Browser.open({ 
            url: checkoutUrl,
            presentationStyle: 'popover'
          });
          onClose(); // Close the modal since we opened external browser
        } catch (error) {
          console.error('Failed to open native browser:', error);
          setUseIframe(true); // Fallback to iframe
        }
      } else if (isInWebView()) {
        // WebView environment - use iframe
        setUseIframe(true);
      } else {
        // Regular web browser - open in new tab
        window.open(checkoutUrl, '_blank');
        onClose();
      }
    };

    handleCheckout();
  }, [checkoutUrl, onClose]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleExternalOpen = () => {
    window.open(checkoutUrl, '_blank');
    onClose();
  };

  if (!useIframe) {
    return null; // External browser handling
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[90vh] bg-background border-primary/30 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExternalOpen}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Abrir Externo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
              {new URL(checkoutUrl).hostname}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <div className="relative w-full h-full">
            {isLoading && (
              <div className="absolute inset-0 bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-muted-foreground">Carregando checkout seguro...</p>
                </div>
              </div>
            )}
            <iframe
              src={checkoutUrl}
              className="w-full h-full border-0 rounded-b-lg"
              title="Stripe Checkout"
              onLoad={handleIframeLoad}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
              allow="payment; microphone; camera"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};