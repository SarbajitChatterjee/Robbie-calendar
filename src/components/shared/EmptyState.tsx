/**
 * EmptyState — A friendly placeholder for empty views.
 *
 * Shows an emoji, a title, and an optional subtitle.
 * Used across TodayView (no events), InboxView (no invitations), etc.
 */

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-6xl mb-4">{emoji}</span>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-muted-foreground max-w-xs">{subtitle}</p>}
    </div>
  );
}
