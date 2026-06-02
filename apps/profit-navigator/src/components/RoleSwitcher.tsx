import { useAuth, ROLE_LABELS, ROLE_COLORS, type UserRole } from "@/hooks/useAuth";
import { Shield, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function RoleSwitcher() {
  const { user, switchRole, allUsers } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors hover:bg-white/5"
          style={{ border: "1px solid var(--glass-border)" }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: ROLE_COLORS[user.role] }}
          >
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{user.name}</div>
            <div className="text-[10px]" style={{ color: ROLE_COLORS[user.role] }}>{ROLE_LABELS[user.role]}</div>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
          <Shield className="w-3 h-3" /> Switch Role (Demo)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allUsers.map(u => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => switchRole(u.role as UserRole)}
            className={u.id === user.id ? "bg-accent/10" : ""}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white mr-2"
              style={{ background: ROLE_COLORS[u.role] }}
            >
              {u.name.charAt(0)}
            </div>
            <div>
              <div className="text-sm">{u.name}</div>
              <div className="text-[10px] text-muted-foreground">{ROLE_LABELS[u.role]}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
