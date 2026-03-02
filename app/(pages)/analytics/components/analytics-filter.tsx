'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const months = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function AnalyticsFilter({ years }: { years: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedMonth = searchParams.get('month') || 'all';
  const selectedYear = searchParams.get('year') || 'all';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('?');
  };

  return (
    <div className='flex flex-wrap items-center gap-4 mb-2'>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>Month:</span>
        <Select
          value={selectedMonth}
          onValueChange={(value) => updateFilter('month', value)}
        >
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='All Months' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Months</SelectItem>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>Year:</span>
        <Select
          value={selectedYear}
          onValueChange={(value) => updateFilter('year', value)}
        >
          <SelectTrigger className='w-[120px]'>
            <SelectValue placeholder='All Years' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(selectedMonth !== 'all' || selectedYear !== 'all') && (
        <Button
          variant='ghost'
          size='sm'
          onClick={clearFilters}
          className='h-8 px-2 lg:px-3'
        >
          Reset
          <X className='ml-2 h-4 w-4' />
        </Button>
      )}
    </div>
  );
}
