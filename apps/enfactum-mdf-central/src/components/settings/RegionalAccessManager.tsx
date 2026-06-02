import { useState, useMemo } from "react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useUpdateTeamMemberRegions, AVAILABLE_REGIONS } from "@/hooks/useRegionalAccess";
import { MultiSelect } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMemberWithRegions extends TeamMember {
  accessible_regions?: string[];
}

export function RegionalAccessManager() {
  const { data: teamMembers, isLoading, error } = useTeamMembers();
  const updateRegions = useUpdateTeamMemberRegions();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(() => {
    if (!teamMembers) return [];
    if (!searchQuery) return teamMembers;
    
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(
      (m) =>
        m.full_name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.team.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberId || !teamMembers) return null;
    return teamMembers.find((m) => m.id === selectedMemberId) as TeamMemberWithRegions | undefined;
  }, [selectedMemberId, teamMembers]);

  const handleRegionChange = (regions: string[]) => {
    if (!selectedMemberId) return;
    updateRegions.mutate({ memberId: selectedMemberId, regions });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <p className="font-medium">Error loading team members</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Individual Market Access</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Override regional access for specific team members. This allows staff to access activities from markets outside their default assignment.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Member Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Select Team Member
            </CardTitle>
            <CardDescription>Choose a team member to manage their regional access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md z-50 max-h-60">
                {filteredMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex flex-col">
                      <span>{member.full_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.team} • {member.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Region Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Assign Regions
            </CardTitle>
            <CardDescription>
              {selectedMember
                ? `Managing access for ${selectedMember.full_name}`
                : "Select a team member first"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMember ? (
              <>
                <MultiSelect
                  options={AVAILABLE_REGIONS.map((r) => ({ value: r.value, label: r.label }))}
                  selected={(selectedMember.accessible_regions as string[]) || []}
                  onChange={handleRegionChange}
                  placeholder="Select regions..."
                  disabled={updateRegions.isPending}
                />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-2">Current Access:</p>
                  <div className="flex flex-wrap gap-1">
                    {((selectedMember.accessible_regions as string[]) || []).length > 0 ? (
                      ((selectedMember.accessible_regions as string[]) || []).map((region) => (
                        <Badge key={region} variant="secondary" className="text-xs">
                          {AVAILABLE_REGIONS.find((r) => r.value === region)?.label || region}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic">No custom regional access assigned</span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a team member to manage their regional access</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
