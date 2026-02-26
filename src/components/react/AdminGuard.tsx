import { useEffect, useState } from 'react';
import { isAuthenticated } from '../../lib/auth';

export default function AdminGuard({ children }: { children?: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
