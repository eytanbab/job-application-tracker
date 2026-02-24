'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ActionableNudgeProps {
  message: string;
}

export function ActionableNudge({ message }: ActionableNudgeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your AI Analyst</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{message}</p>
      </CardContent>
    </Card>
  );
}
