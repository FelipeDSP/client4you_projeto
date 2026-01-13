import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface CreditsPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
}

interface CreditsContextType {
  credits: number;
  totalCredits: number;
  plan: CreditsPlan;
  useCredits: (amount: number) => boolean;
  resetCredits: () => void;
}

const STORAGE_KEY = "leadextractor_credits";

const plans: CreditsPlan[] = [
  {
    id: "free",
    name: "Free",
    credits: 50,
    price: 0,
    features: ["50 leads/mês", "Exportar para Excel", "Suporte por email"],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 500,
    price: 97,
    features: ["500 leads/mês", "Exportar para Excel/CSV", "Validação WhatsApp", "Suporte prioritário"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 5000,
    price: 297,
    features: ["5.000 leads/mês", "API de integração", "Multi-usuários", "Suporte dedicado", "Personalização"],
  },
];

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState(50);
  const [planId, setPlanId] = useState("free");

  const plan = plans.find((p) => p.id === planId) || plans[0];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      setCredits(data.credits);
      setPlanId(data.planId);
    }
  }, []);

  const saveCredits = (newCredits: number, newPlanId: string) => {
    setCredits(newCredits);
    setPlanId(newPlanId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ credits: newCredits, planId: newPlanId }));
  };

  const useCreditsFunc = (amount: number): boolean => {
    if (credits >= amount) {
      saveCredits(credits - amount, planId);
      return true;
    }
    return false;
  };

  const resetCredits = () => {
    saveCredits(plan.credits, planId);
  };

  return (
    <CreditsContext.Provider
      value={{
        credits,
        totalCredits: plan.credits,
        plan,
        useCredits: useCreditsFunc,
        resetCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}

export { plans };
export type { CreditsPlan };
