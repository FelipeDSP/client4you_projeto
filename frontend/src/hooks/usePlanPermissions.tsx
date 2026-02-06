import { useMemo } from "react";
import { useQuotas } from "./useQuotas";

export type PlanType = 'demo' | 'basico' | 'intermediario' | 'avancado';

export interface PlanPermissions {
  // Funcionalidades
  canSearchLeads: boolean;
  canExportLeads: boolean;
  canUseDisparador: boolean;
  canUseAgenteIA: boolean;
  
  // Limites
  leadsLimit: number; // -1 = ilimitado
  campaignsLimit: number; // -1 = ilimitado, 0 = bloqueado
  messagesLimit: number;
  
  // Status
  planType: PlanType;
  planName: string;
  isPlanExpired: boolean;
  isActive: boolean;
  expiresAt: string | null;
  daysUntilExpiration: number | null;
}

// Configuração de permissões por plano
const PLAN_PERMISSIONS: Record<PlanType, Omit<PlanPermissions, 'isPlanExpired' | 'isActive' | 'expiresAt' | 'daysUntilExpiration' | 'planName'>> = {
  demo: {
    canSearchLeads: true,
    canExportLeads: true,
    canUseDisparador: false,
    canUseAgenteIA: false,
    leadsLimit: 5,
    campaignsLimit: 0,
    messagesLimit: 0,
    planType: 'demo',
  },
  basico: {
    canSearchLeads: true,
    canExportLeads: true,
    canUseDisparador: false,
    canUseAgenteIA: false,
    leadsLimit: -1,
    campaignsLimit: 0,
    messagesLimit: 0,
    planType: 'basico',
  },
  intermediario: {
    canSearchLeads: true,
    canExportLeads: true,
    canUseDisparador: true,
    canUseAgenteIA: false,
    leadsLimit: -1,
    campaignsLimit: -1,
    messagesLimit: -1,
    planType: 'intermediario',
  },
  avancado: {
    canSearchLeads: true,
    canExportLeads: true,
    canUseDisparador: true,
    canUseAgenteIA: true,
    leadsLimit: -1,
    campaignsLimit: -1,
    messagesLimit: -1,
    planType: 'avancado',
  },
};

export function usePlanPermissions() {
  const { quota, isLoading, error, refresh } = useQuotas();

  const permissions = useMemo<PlanPermissions>(() => {
    // Valores default para quando não tem quota
    if (!quota) {
      return {
        ...PLAN_PERMISSIONS.demo,
        planName: 'Demo',
        isPlanExpired: false,
        isActive: false,
        expiresAt: null,
        daysUntilExpiration: null,
      };
    }

    const planType = (quota.plan_type?.toLowerCase() || 'demo') as PlanType;
    const basePlan = PLAN_PERMISSIONS[planType] || PLAN_PERMISSIONS.demo;
    
    // Calcular expiração
    const expiresAt = quota.plan_expires_at || null;
    let isPlanExpired = false;
    let daysUntilExpiration: number | null = null;

    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      isPlanExpired = expirationDate < now;
      
      if (!isPlanExpired) {
        const diffTime = expirationDate.getTime() - now.getTime();
        daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    // Se o plano expirou, bloqueia TUDO
    if (isPlanExpired) {
      return {
        canSearchLeads: false,
        canExportLeads: false,
        canUseDisparador: false,
        canUseAgenteIA: false,
        leadsLimit: 0,
        campaignsLimit: 0,
        messagesLimit: 0,
        planType,
        planName: quota.plan_name || 'Expirado',
        isPlanExpired: true,
        isActive: false,
        expiresAt,
        daysUntilExpiration: 0,
      };
    }

    return {
      ...basePlan,
      planName: quota.plan_name || basePlan.planType,
      isPlanExpired,
      isActive: true,
      expiresAt,
      daysUntilExpiration,
    };
  }, [quota]);

  return {
    permissions,
    isLoading,
    error,
    refresh,
    // Atalhos úteis
    canUseFeature: (feature: 'leads' | 'disparador' | 'agente') => {
      if (permissions.isPlanExpired) return false;
      switch (feature) {
        case 'leads': return permissions.canSearchLeads;
        case 'disparador': return permissions.canUseDisparador;
        case 'agente': return permissions.canUseAgenteIA;
        default: return false;
      }
    },
    // Verificar se precisa upgrade para uma feature
    needsUpgradeFor: (feature: 'disparador' | 'agente'): PlanType | null => {
      if (permissions.isPlanExpired) return 'basico'; // Qualquer plano serve
      switch (feature) {
        case 'disparador':
          if (!permissions.canUseDisparador) return 'intermediario';
          break;
        case 'agente':
          if (!permissions.canUseAgenteIA) return 'avancado';
          break;
      }
      return null;
    },
  };
}
