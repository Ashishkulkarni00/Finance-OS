import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

/** Any address that matches nothing (UI_UX_REVAMP_PLAN §4.16). Inside the shell, so navigation stays. */
export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      headline="This page doesn’t exist."
      body="The link may be old, or the page may have moved. Today is a good place to start again."
      action={
        <Link to="/today" className="text-label text-accent underline-offset-4 hover:underline">
          Go to Today
        </Link>
      }
    />
  );
}
