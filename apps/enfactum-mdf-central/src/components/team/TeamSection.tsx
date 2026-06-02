import { TeamMember } from "@/hooks/useTeamMembers";
import { TeamMemberCard } from "./TeamMemberCard";
import { 
  Users, 
  Briefcase, 
  Cog, 
  Palette, 
  Globe,
  Sparkles
} from "lucide-react";

interface TeamSectionProps {
  teamName: string;
  members: TeamMember[];
}

const teamIcons: Record<string, React.ReactNode> = {
  'Director Team': <Briefcase className="h-5 w-5" />,
  'Project Team': <Users className="h-5 w-5" />,
  'Project Team/AI Team': <Sparkles className="h-5 w-5" />,
  'Operations Team': <Cog className="h-5 w-5" />,
  'Design Team': <Palette className="h-5 w-5" />,
  'Digital Team': <Globe className="h-5 w-5" />,
};

const teamColors: Record<string, string> = {
  'Director Team': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  'Project Team': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  'Project Team/AI Team': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  'Operations Team': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  'Design Team': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  'Digital Team': 'bg-green-500/10 text-green-600 dark:text-green-400',
};

export function TeamSection({ teamName, members }: TeamSectionProps) {
  const linkedCount = members.filter(m => m.user_id).length;
  const icon = teamIcons[teamName] || <Users className="h-5 w-5" />;
  const colorClass = teamColors[teamName] || 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{teamName}</h2>
            <p className="text-sm text-muted-foreground">
              {linkedCount} of {members.length} members active
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(member => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
