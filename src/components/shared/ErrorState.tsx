/**
 * ErrorState — A user-friendly error placeholder with a retry action.
 *
 * Matches the EmptyState pattern. Used across views when a TanStack Query
 * fetch fails, giving the user a clear message and a way to recover.
 */

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="rounded-[var(--radius-button)] h-10"
        >
          Try again
        </Button>
      )}
    </div>
  );
}
