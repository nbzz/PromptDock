'use client';

import { UpdateBanner } from '@/components/update-banner';

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UpdateBanner />
      {children}
    </>
  );
}
