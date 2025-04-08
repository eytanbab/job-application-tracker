'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { migrateGuestData } from '@/app/actions/migrate-user-data';

export function GuestDataMigrator() {
  const { userId, isSignedIn } = useAuth();
  const [hasMigrated, setHasMigrated] = useState(false);

  useEffect(() => {
    if (isSignedIn && !hasMigrated) {
      migrateGuestData().then(() => {
        setHasMigrated(true);
      });
    }
  }, [isSignedIn, userId, hasMigrated]);

  return null;
}
