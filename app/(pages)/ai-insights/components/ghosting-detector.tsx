'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface GhostingDetectorProps {
  count: number;
}

export function GhostingDetector({ count }: GhostingDetectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ghosting Detector</CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-2xl font-bold'>{count}</p>
        <p className='text-sm text-gray-500'>
          Applications with status &apos;Applied&apos; for more than 30 days.
        </p>
      </CardContent>
    </Card>
  );
}
