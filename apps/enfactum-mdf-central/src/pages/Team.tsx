import { AppLayout } from "@/components/layout/AppLayout";
import { useTeamMembers, groupTeamMembersByTeam } from "@/hooks/useTeamMembers";
import { TeamSection } from "@/components/team/TeamSection";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, Shield } from "lucide-react";

export default function Team() {
  const { data: members = [], isLoading } = useTeamMembers();
  const groupedMembers = groupTeamMembersByTeam(members);
  
  const totalMembers = members.length;
  // Lovable originally used `user_id` here to mean "has linked auth account"
  // — the linking flow was removed in the monorepo integration, so user_id
  // is always null. is_active is the right signal post-integration.
  const activeMembers = members.filter(m => m.is_active).length;
  const pendingMembers = totalMembers - activeMembers;

  const stats = [
    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-500' },
    { label: 'Active', value: activeMembers, icon: UserCheck, color: 'text-green-500' },
    { label: 'Pending Signup', value: pendingMembers, icon: Clock, color: 'text-amber-500' },
    { label: 'Teams', value: Object.keys(groupedMembers).length, icon: Shield, color: 'text-purple-500' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="page-header">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage team members across all departments
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? <Skeleton className="h-8 w-12" /> : stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map(j => (
                    <Skeleton key={j} className="h-32" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Sections */}
        {!isLoading && (
          <div className="space-y-8">
            {Object.entries(groupedMembers).map(([teamName, teamMembers]) => (
              <TeamSection 
                key={teamName} 
                teamName={teamName} 
                members={teamMembers} 
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && members.length === 0 && (
          <Card>
            <CardContent className="p-12 flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold text-foreground">No Team Members</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Team members will appear here once they're added to the system.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
