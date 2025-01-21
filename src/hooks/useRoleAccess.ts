import { Database } from "@/integrations/supabase/types";
import { useRoleStore } from '@/store/roleStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = Database['public']['Enums']['app_role'];

interface RoleState {
  userRole: UserRole | null;
  userRoles: UserRole[] | null;
  isLoading: boolean;
  error: Error | null;
  permissions: {
    canManageUsers: boolean;
    canCollectPayments: boolean;
    canAccessSystem: boolean;
    canViewAudit: boolean;
    canManageCollectors: boolean;
  };
}

export const useRoleAccess = () => {
  const { toast } = useToast();
  const {
    userRole,
    userRoles,
    isLoading: roleLoading,
    error,
    permissions,
    setUserRole,
    setUserRoles,
    setIsLoading,
    setError
  } = useRoleStore();

  useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      console.log('[RoleAccess] Starting role fetch process...');
      setIsLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('[RoleAccess] No authenticated session found');
          setUserRoles(null);
          setUserRole(null);
          return null;
        }

        console.log('[RoleAccess] Fetching roles for user:', {
          userId: session.user.id,
          email: session.user.email,
          timestamp: new Date().toISOString()
        });

        // First check if user is a collector
        console.log('[RoleAccess] Checking collector status...');
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('member_number')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();

        if (memberError && memberError.code !== 'PGRST116') {
          console.error('[RoleAccess] Error checking member status:', memberError);
          throw memberError;
        }

        if (memberData?.member_number) {
          const { data: collectorData, error: collectorError } = await supabase
            .from('members_collectors')
            .select('*')
            .eq('member_number', memberData.member_number)
            .eq('active', true)
            .maybeSingle();

          if (collectorError && collectorError.code !== 'PGRST116') {
            console.error('[RoleAccess] Error checking collector status:', collectorError);
          } else {
            console.log('[RoleAccess] Collector check result:', collectorData);
          }
        }
        
        // Then fetch all roles
        console.log('[RoleAccess] Fetching user roles from database...');
        let roleData = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', session.user.id)
          .then(({ data, error }) => {
            if (error) throw error;
            return data;
          });

        console.log('[RoleAccess] Raw role data from database:', roleData);

        const userRoles = roleData?.map(r => r.role as UserRole) || ['member'];
        console.log('[RoleAccess] Mapped roles:', userRoles);

        // Set primary role (admin > collector > member)
        const primaryRole = userRoles.includes('admin' as UserRole) 
          ? 'admin' as UserRole 
          : userRoles.includes('collector' as UserRole)
            ? 'collector' as UserRole
            : 'member' as UserRole;

        console.log('[RoleAccess] Final role determination:', {
          userRole: primaryRole,
          userRoles,
          timestamp: new Date().toISOString()
        });
        
        setUserRoles(userRoles);
        setUserRole(primaryRole);
        return userRoles;
      } catch (error: any) {
        console.error('[RoleAccess] Role fetch error:', error);
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const hasRole = (role: UserRole): boolean => {
    console.log('[RoleAccess] Checking role:', { 
      role, 
      userRole, 
      userRoles,
      timestamp: new Date().toISOString()
    });
    if (!userRoles) return false;
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    if (!userRoles) return false;

    const result = (() => {
      switch (tab) {
        case 'dashboard':
          return true;
        case 'users':
          return hasRole('admin') || hasRole('collector');
        case 'financials':
          return hasRole('admin') || hasRole('collector');
        case 'system':
          return hasRole('admin');
        default:
          return false;
      }
    })();

    console.log('[RoleAccess] Tab access check:', {
      tab,
      hasAccess: result,
      userRoles,
      timestamp: new Date().toISOString()
    });

    return result;
  };

  return {
    userRole,
    userRoles,
    roleLoading,
    error,
    permissions,
    hasRole,
    hasAnyRole,
    canAccessTab
  };
};