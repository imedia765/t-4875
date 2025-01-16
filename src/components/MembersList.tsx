import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import CollectorPaymentSummary from './CollectorPaymentSummary';
import CollectorMemberPayments from './members/CollectorMemberPayments';
import PaymentDialog from './members/PaymentDialog';
import EditProfileDialog from './members/EditProfileDialog';
import { Member } from "@/types/member";
import { useToast } from "@/components/ui/use-toast";
import MembersListHeader from './members/MembersListHeader';
import MembersListContent from './members/MembersListContent';
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent } from "@/components/ui/dashboard-tabs";

interface MembersListProps {
  searchTerm: string;
  userRole: string | null;
}

const ITEMS_PER_PAGE = 20;

const MembersList = ({ searchTerm, userRole }: MembersListProps) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data: collectorInfo } = useQuery({
    queryKey: ['collector-info'],
    queryFn: async () => {
      if (userRole !== 'collector') return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: collectorData } = await supabase
        .from('members_collectors')
        .select('id, name, phone, prefix, number, email, active, created_at, updated_at')
        .eq('member_number', user.user_metadata.member_number)
        .single();

      return collectorData;
    },
    enabled: userRole === 'collector',
    staleTime: 5 * 60 * 1000,
  });

  const { data: membersData, isLoading, refetch } = useQuery({
    queryKey: ['members', searchTerm, userRole, page],
    queryFn: async () => {
      console.log('Fetching members with search term:', searchTerm);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('members')
        .select('*', { count: 'exact' });
      
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%,collector.ilike.%${searchTerm}%`);
      }

      if (userRole === 'collector') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: collectorData } = await supabase
            .from('members_collectors')
            .select('name')
            .eq('member_number', user.user_metadata.member_number)
            .single();

          if (collectorData?.name) {
            console.log('Filtering members for collector:', collectorData.name);
            query = query.eq('collector', collectorData.name);
          }
        }
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      return {
        members: data as Member[],
        totalCount: count || 0
      };
    },
    staleTime: 30 * 1000,
  });

  const members = membersData?.members || [];
  const totalPages = Math.ceil((membersData?.totalCount || 0) / ITEMS_PER_PAGE);
  const selectedMember = members?.find(m => m.id === selectedMemberId);

  const handleProfileUpdated = () => {
    refetch();
    setSelectedMemberId(null);
    setIsEditProfileDialogOpen(false);
  };

  const handlePaymentClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsPaymentDialogOpen(true);
  };

  const handleEditClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setIsEditProfileDialogOpen(true);
  };

  return (
    <div className="w-full px-2 sm:px-0 space-y-4 sm:space-y-6">
      <MembersListHeader 
        userRole={userRole}
        hasMembers={members.length > 0}
        collectorInfo={collectorInfo}
        selectedMember={selectedMember}
        onProfileUpdated={handleProfileUpdated}
        onPrint={() => {}}
        members={members}
      />

      <DashboardTabs defaultValue="summary" className="w-full">
        <DashboardTabsList className="w-full grid grid-cols-1 sm:grid-cols-3 gap-0">
          {userRole === 'collector' && (
            <>
              <DashboardTabsTrigger value="summary" className="w-full">
                Summary
              </DashboardTabsTrigger>
              <DashboardTabsTrigger value="payments" className="w-full">
                Payments
              </DashboardTabsTrigger>
            </>
          )}
          <DashboardTabsTrigger value="members" className="w-full">
            Members List
          </DashboardTabsTrigger>
        </DashboardTabsList>

        {userRole === 'collector' && collectorInfo && (
          <>
            <DashboardTabsContent value="summary">
              <div className="overflow-hidden">
                <CollectorPaymentSummary collectorName={collectorInfo.name} />
              </div>
            </DashboardTabsContent>

            <DashboardTabsContent value="payments">
              <div className="overflow-hidden">
                <CollectorMemberPayments collectorName={collectorInfo.name} />
              </div>
            </DashboardTabsContent>
          </>
        )}

        <DashboardTabsContent value="members">
          <div className="overflow-hidden">
            <MembersListContent
              members={members}
              isLoading={isLoading}
              userRole={userRole}
              onPaymentClick={handlePaymentClick}
              onEditClick={handleEditClick}
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </DashboardTabsContent>
      </DashboardTabs>

      {selectedMember && isPaymentDialogOpen && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedMemberId(null);
          }}
          memberId={selectedMember.id}
          memberNumber={selectedMember.member_number}
          memberName={selectedMember.full_name}
          collectorInfo={collectorInfo}
        />
      )}

      {selectedMember && isEditProfileDialogOpen && (
        <EditProfileDialog
          member={selectedMember}
          open={isEditProfileDialogOpen}
          onOpenChange={(open) => {
            setIsEditProfileDialogOpen(open);
            if (!open) setSelectedMemberId(null);
          }}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </div>
  );
};

export default MembersList;
