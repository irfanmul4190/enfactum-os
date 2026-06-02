import { TeamMember } from "@/hooks/useTeamMembers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Mail, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const isLinked = !!member.user_id;
  const initials = member.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isLinked ? "border-green-500/20 bg-green-500/5" : "border-border"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className={cn(
              "text-sm font-medium",
              isLinked 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : "bg-muted text-muted-foreground"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-foreground truncate">
                {member.full_name}
              </h3>
              {isLinked ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{member.email}</span>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                {member.role}
              </Badge>
              <Badge 
                variant={isLinked ? "default" : "outline"} 
                className={cn(
                  "text-xs",
                  isLinked 
                    ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" 
                    : ""
                )}
              >
                {isLinked ? "Active" : "Pending Signup"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
