import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** A plain sentence plus the fix. Never a code, never a stack trace. DESIGN_SYSTEM §7. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-space-4 px-space-6 py-space-8 text-center">
      <AlertCircle size={28} strokeWidth={1.5} className="text-critical" />
      <p className="max-w-[42ch] text-body text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
