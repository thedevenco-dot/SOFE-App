'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/media/videos');
  }, [router]);

  return null;
}
