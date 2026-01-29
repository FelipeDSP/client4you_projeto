import { TrendingUp, Zap, MessageCircle, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuotas } from "@/hooks/useQuotas";
import { Link } from "react-router-dom";

export function QuotaBar() {
  const { quota, isLoading, hasUnlimitedLeads, leadsPercentage, isPlanExpired } = useQuotas();

  if (isLoading || !quota) {
    return null;
  }

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'demo': return 'bg-gray-500';
      case 'pro': return 'bg-primary';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'demo': return <Zap className="h-4 w-4" />;
      case 'pro': return <MessageCircle className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const shouldShowUpgrade = quota.plan_type === 'demo';
  const isNearLimit = !hasUnlimitedLeads && leadsPercentage >= 80;

  return (
    <Card className="p-4 border-l-4 border-primary">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={`${getPlanColor(quota.plan_type)} text-white`}>
            <span className="flex items-center gap-1">
              {getPlanIcon(quota.plan_type)}
              {quota.plan_name || 'Plano Demo'}
            </span>
          </Badge>
          
          {isPlanExpired && (
            <Badge variant="destructive" className="animate-pulse">
              Expirado
            </Badge>
          )}
        </div>

        {shouldShowUpgrade && (
          <Link to="/plans">
            <Button size="sm" className="h-7">
              Fazer Upgrade
            </Button>
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {/* Lead Searches */}
        <div>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="text-muted-foreground">Buscas de Leads</span>
            <span className="font-medium">
              {hasUnlimitedLeads ? (
                <span className="flex items-center gap-1">
                  <span className="text-primary">{quota.leads_used}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-primary">∞</span>
                </span>
              ) : (
                <>
                  <span className={isNearLimit ? "text-orange-500" : ""}>{quota.leads_used}</span>
                  <span className="text-muted-foreground"> / {quota.leads_limit}</span>
                </>
              )}
            </span>
          </div>
          {!hasUnlimitedLeads && (
            <Progress 
              value={leadsPercentage} 
              className="h-2"
              indicatorClassName={isNearLimit ? "bg-orange-500" : ""}
            />
          )}
        </div>

        {/* Campaigns */}
        {quota.campaigns_limit !== 0 && (
          <div>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-muted-foreground">Campanhas</span>
              <span className="font-medium">
                {quota.campaigns_limit === -1 ? (
                  <span className="flex items-center gap-1">
                    <span className="text-primary">{quota.campaigns_used}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-primary">∞</span>
                  </span>
                ) : (
                  <>
                    <span>{quota.campaigns_used}</span>
                    <span className="text-muted-foreground"> / {quota.campaigns_limit}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Reset Info */}
        {quota.plan_type === 'free' && (
          <p className="text-xs text-muted-foreground">
            Reset: {new Date(quota.reset_date).toLocaleDateString('pt-BR')}
          </p>
        )}

        {/* Expires Info */}
        {quota.plan_expires_at && !isPlanExpired && (
          <p className="text-xs text-muted-foreground">
            Expira em: {new Date(quota.plan_expires_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </Card>
  );
}
