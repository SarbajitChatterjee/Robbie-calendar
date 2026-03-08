import { Video, Users, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JoinButtonProps {
  meetingLink: string;
  platform?: "zoom" | "teams" | "meet" | "other";
  compact?: boolean;
}

const platformConfig = {
  zoom: { label: "Zoom", icon: Video, color: "bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)]" },
  teams: { label: "Teams", icon: Users, color: "bg-[hsl(262,52%,47%)] hover:bg-[hsl(262,52%,40%)]" },
  meet: { label: "Meet", icon: MonitorSmartphone, color: "bg-[hsl(142,55%,45%)] hover:bg-[hsl(142,55%,38%)]" },
  other: { label: "Join", icon: Video, color: "bg-primary hover:bg-primary/90" },
};

export function JoinButton({ meetingLink, platform = "other", compact = false }: JoinButtonProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  if (compact) {
    return (
      <a href={meetingLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" className={`${config.color} text-white rounded-[var(--radius-button)] h-8 px-3 text-xs gap-1.5`}>
          <Icon className="w-3.5 h-3.5" />
          Join
        </Button>
      </a>
    );
  }

  return (
    <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="block w-full">
      <Button className={`${config.color} text-white rounded-[var(--radius-button)] w-full h-14 text-base gap-2`}>
        <Icon className="w-5 h-5" />
        Join {config.label} Meeting
      </Button>
    </a>
  );
}
