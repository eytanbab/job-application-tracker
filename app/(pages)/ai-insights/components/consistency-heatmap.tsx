'use client';

interface HeatmapProps {
  data: {
    date: string;
    count: number;
  }[];
}

export function ConsistencyHeatmap({ data }: HeatmapProps) {
  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-200';
    if (count < 2) return 'bg-green-200';
    if (count < 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  return (
    <div className='flex flex-wrap gap-1'>
      {data.map(({ date, count }) => (
        <div
          key={date}
          className={`w-4 h-4 rounded-sm ${getColor(count)}`}
          title={`${count} applications on ${date}`}
        />
      ))}
    </div>
  );
}
