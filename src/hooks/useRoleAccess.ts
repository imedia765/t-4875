import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { BaseUserRole, UserRole, UserRoles } from '@/types/member';

const ROLE_STALE_TIME = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const useRoleAccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: sessionData, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        console.log('Checking session status...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session) {
          console.log('Found session for user:', session.user.id);
          const { error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
        }
        
        return session;
      } catch (error: any) {
        console.error('Session error:', error);
        await supabase.auth.signOut();
        localStorage.clear();
        throw error;
      }
    },
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
  });

  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [sessionError, navigate, toast]);

  const { 
    data: roleData, 
    isLoading: roleLoading, 
    error: roleError 
  } = useQuery({
    queryKey: ['userRoles', sessionData?.user?.id],
    queryFn: async () => {
      if (!sessionData?.user) {
        console.log('No session found in role check');
        return { userRole: null, userRoles: null };
      }

      console.log('Fetching roles for user:', sessionData.user.id);
      
      try {
        console.log('Querying user_roles table...');
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', sessionData.user.id)
          .order('created_at', { ascending: false });

        if (roleError) {
          console.error('Error fetching roles:', roleError);
          throw roleError;
        }

        console.log('Raw role data from database:', roleData);

        if (roleData && roleData.length > 0) {
          console.log('Found roles in database:', roleData);
          const roles = roleData.map(r => r.role as BaseUserRole);
          console.log('Mapped roles:', roles);
          
          // Store all roles
          const userRoles = roles as UserRoles;
          
          // Determine highest priority role
          let userRole: UserRole = null;
          if (roles.includes('admin')) {
            userRole = 'admin';
            console.log('User has admin role');
          } else if (roles.includes('collector')) {
            userRole = 'collector';
            console.log('User has collector role');
          } else if (roles.includes('member')) {
            userRole = 'member';
            console.log('User has member role');
          }
          
          console.log('Final role determination:', { userRole, userRoles });
          return { userRole, userRoles };
        }

        // Fallback checks for collector and member status
        if (sessionData.user.user_metadata.member_number) {
          console.log('Checking collector status...');
          const { data: collectorData } = await supabase
            .from('members_collectors')
            .select('name')
            .eq('member_number', sessionData.user.user_metadata.member_number)
            .maybeSingle();

          if (collectorData) {
            console.log('User is a collector');
            return { 
              userRole: 'collector' as UserRole, 
              userRoles: ['collector'] as UserRoles 
            };
          }

          console.log('User is a regular member');
          return { 
            userRole: 'member' as UserRole, 
            userRoles: ['member'] as UserRoles 
          };
        }

        console.log('No role found, defaulting to member');
        return { 
          userRole: 'member' as UserRole, 
          userRoles: ['member'] as UserRoles 
        };
      } catch (error) {
        console.error('Error in role check:', error);
        throw error;
      }
    },
    enabled: !!sessionData?.user?.id,
    staleTime: ROLE_STALE_TIME,
    cacheTime: ROLE_STALE_TIME,
    retry: MAX_RETRIES,
    retryDelay: RETRY_DELAY,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const hasRole = (role: BaseUserRole): boolean => {
    return roleData?.userRoles?.includes(role) || false;
  };

  const hasAnyRole = (roles: BaseUserRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User roles:', roleData?.userRoles);
    
    if (!roleData?.userRoles) return false;

    if (hasRole('admin')) {
      return ['dashboard', 'users', 'collectors', 'audit', 'system', 'financials'].includes(tab);
    }
    
    if (hasRole('collector')) {
      return ['dashboard', 'users'].includes(tab);
    }
    
    if (hasRole('member')) {
      return tab === 'dashboard';
    }

    return false;
  };

  return {
    userRole: roleData?.userRole ?? null,
    userRoles: roleData?.userRoles ?? null,
    roleLoading: roleLoading || !sessionData,
    error: roleError,
    canAccessTab,
    hasRole,
    hasAnyRole
  };
};