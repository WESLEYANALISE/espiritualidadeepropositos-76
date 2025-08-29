import { Crown, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SubscriptionStatusProps {
  className?: string;
}

export const SubscriptionStatus = ({ className }: SubscriptionStatusProps) => {
  const { user, subscription, loading } = useAuth();

  if (!user || loading) {
    return (
      <Card className={cn("mx-4 mb-4 bg-gradient-surface border-border/50", className)}>
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:200%_100%] h-4 w-32 rounded" />
        </CardContent>
      </Card>
    );
  }

  const isPremium = subscription.subscribed;
  const planName = subscription.subscription_tier || 'Gratuito';
  const expirationDate = subscription.subscription_end 
    ? new Date(subscription.subscription_end).toLocaleDateString('pt-BR')
    : null;

  return (
    <Card className={cn(
      "mx-4 mb-4 border-border/50 transition-all duration-300 animate-fade-in",
      isPremium 
        ? "bg-gradient-luxury border-primary/30 shadow-luxury" 
        : "bg-gradient-surface",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
              isPremium 
                ? "bg-gradient-primary shadow-glow" 
                : "bg-secondary"
            )}>
              {isPremium ? (
                <Crown className="h-5 w-5 text-primary-foreground animate-pulse-glow" />
              ) : (
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Plano {planName}
                </span>
                {isPremium && (
                  <CheckCircle className="h-4 w-4 text-primary animate-success-bounce" />
                )}
              </div>
              {isPremium && expirationDate && (
                <p className="text-xs text-muted-foreground">
                  Válido até {expirationDate}
                </p>
              )}
              {!isPremium && (
                <p className="text-xs text-muted-foreground">
                  Acesso limitado - Considere fazer upgrade
                </p>
              )}
            </div>
          </div>
          
          {!isPremium && (
            <Button 
              size="sm" 
              variant="premium"
              onClick={() => window.location.href = '/assinaturas'}
              className="animate-pulse-glow"
            >
              <Crown className="h-4 w-4 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};