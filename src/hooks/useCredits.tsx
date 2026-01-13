import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  isDemo?: boolean;
  features: {
    name: string;
    included: boolean;
    limit?: string;
  }[];
}

interface SubscriptionContextType {
  currentPlan: SubscriptionPlan;
  demoUsed: boolean;
  setDemoUsed: () => void;
  changePlan: (planId: string) => void;
}

const STORAGE_KEY = "leadextractor_subscription";

const plans: SubscriptionPlan[] = [
  {
    id: "demo",
    name: "Demo",
    description: "Experimente gratuitamente",
    price: 0,
    isDemo: true,
    features: [
      { name: "Extrator de Leads", included: true, limit: "10 leads únicos" },
      { name: "Exportar para Excel", included: true },
      { name: "Disparador de Campanhas WhatsApp", included: false },
      { name: "Suporte por email", included: true },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para pequenos negócios",
    price: 97,
    features: [
      { name: "Extrator de Leads", included: true, limit: "500 leads/mês" },
      { name: "Exportar para Excel/CSV", included: true },
      { name: "Disparador de Campanhas WhatsApp", included: false },
      { name: "Suporte prioritário", included: true },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Para profissionais de marketing",
    price: 197,
    features: [
      { name: "Extrator de Leads", included: true, limit: "2.000 leads/mês" },
      { name: "Exportar para Excel/CSV", included: true },
      { name: "Disparador de Campanhas WhatsApp", included: true, limit: "Em breve" },
      { name: "Suporte prioritário", included: true },
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Para empresas e agências",
    price: 397,
    features: [
      { name: "Extrator de Leads", included: true, limit: "Ilimitado" },
      { name: "Exportar para Excel/CSV", included: true },
      { name: "Disparador de Campanhas WhatsApp", included: true, limit: "Ilimitado" },
      { name: "API de integração", included: true },
      { name: "Multi-usuários", included: true },
      { name: "Suporte dedicado", included: true },
    ],
  },
];

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [planId, setPlanId] = useState("demo");
  const [demoUsed, setDemoUsedState] = useState(false);

  const currentPlan = plans.find((p) => p.id === planId) || plans[0];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setPlanId(data.planId);
      setDemoUsedState(data.demoUsed || false);
    }
  }, []);

  const saveSubscription = (newPlanId: string, newDemoUsed: boolean) => {
    setPlanId(newPlanId);
    setDemoUsedState(newDemoUsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ planId: newPlanId, demoUsed: newDemoUsed }));
  };

  const setDemoUsed = () => {
    saveSubscription(planId, true);
  };

  const changePlan = (newPlanId: string) => {
    saveSubscription(newPlanId, demoUsed);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        demoUsed,
        setDemoUsed,
        changePlan,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

export { plans };
export type { SubscriptionPlan };
