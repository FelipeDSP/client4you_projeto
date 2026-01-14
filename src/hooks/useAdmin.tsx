import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  companyId: string | null;
  companyName: string | null;
  roles: string[];
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  membersCount: number;
  subscription: {
    planId: string;
    status: string;
    demoUsed: boolean;
  } | null;
}

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Check if current user is admin
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "super_admin",
      });

      if (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } else {
        setIsAdmin(data || false);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  // Fetch all users (admin only)
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          company_id,
          created_at,
          companies:company_id (name)
        `);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return;
      }

      // Map roles by user_id
      const rolesByUser: Record<string, string[]> = {};
      roles?.forEach((r) => {
        if (!rolesByUser[r.user_id]) {
          rolesByUser[r.user_id] = [];
        }
        rolesByUser[r.user_id].push(r.role);
      });

      const mappedUsers: AdminUser[] = (profiles || []).map((p) => ({
        id: p.id,
        email: p.email,
        fullName: p.full_name,
        companyId: p.company_id,
        companyName: (p.companies as { name: string } | null)?.name || null,
        roles: rolesByUser[p.id] || [],
        createdAt: p.created_at,
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [isAdmin]);

  // Fetch all companies (admin only)
  const fetchCompanies = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select(`
          id,
          name,
          slug,
          created_at,
          subscriptions (plan_id, status, demo_used)
        `);

      if (companiesError) {
        console.error("Error fetching companies:", companiesError);
        return;
      }

      // Count members per company
      const { data: profileCounts, error: countsError } = await supabase
        .from("profiles")
        .select("company_id");

      if (countsError) {
        console.error("Error fetching profile counts:", countsError);
        return;
      }

      const memberCounts: Record<string, number> = {};
      profileCounts?.forEach((p) => {
        if (p.company_id) {
          memberCounts[p.company_id] = (memberCounts[p.company_id] || 0) + 1;
        }
      });

      const mappedCompanies: Company[] = (companiesData || []).map((c) => {
        const sub = Array.isArray(c.subscriptions) ? c.subscriptions[0] : c.subscriptions;
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          createdAt: c.created_at,
          membersCount: memberCounts[c.id] || 0,
          subscription: sub
            ? {
                planId: sub.plan_id,
                status: sub.status,
                demoUsed: sub.demo_used || false,
              }
            : null,
        };
      });

      setCompanies(mappedCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchCompanies();
    }
  }, [isAdmin, fetchUsers, fetchCompanies]);

  // Add admin role to a user
  const addAdminRole = async (userId: string): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "super_admin",
      });

      if (error) {
        console.error("Error adding admin role:", error);
        return false;
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error adding admin role:", error);
      return false;
    }
  };

  // Remove admin role from a user
  const removeAdminRole = async (userId: string): Promise<boolean> => {
    if (!isAdmin) return false;

    // Prevent removing own admin role
    if (userId === user?.id) return false;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "super_admin");

      if (error) {
        console.error("Error removing admin role:", error);
        return false;
      }

      await fetchUsers();
      return true;
    } catch (error) {
      console.error("Error removing admin role:", error);
      return false;
    }
  };

  // Update subscription plan for a company
  const updateCompanyPlan = async (
    companyId: string,
    planId: string,
    resetDemo: boolean = false
  ): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      const updateData: Record<string, unknown> = {
        plan_id: planId,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      if (resetDemo) {
        updateData.demo_used = false;
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("company_id", companyId);

      if (error) {
        console.error("Error updating company plan:", error);
        return false;
      }

      await fetchCompanies();
      return true;
    } catch (error) {
      console.error("Error updating company plan:", error);
      return false;
    }
  };

  // Reset demo usage for a company
  const resetDemoUsage = async (companyId: string): Promise<boolean> => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ demo_used: false })
        .eq("company_id", companyId);

      if (error) {
        console.error("Error resetting demo:", error);
        return false;
      }

      await fetchCompanies();
      return true;
    } catch (error) {
      console.error("Error resetting demo:", error);
      return false;
    }
  };

  return {
    isAdmin,
    isLoading,
    users,
    companies,
    addAdminRole,
    removeAdminRole,
    updateCompanyPlan,
    resetDemoUsage,
    refreshData: () => {
      fetchUsers();
      fetchCompanies();
    },
  };
}
