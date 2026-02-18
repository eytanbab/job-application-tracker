type Props = {
  children: React.ReactNode;
};

export function Section({ children }: Props) {
  return (
    <div className='grid w-full grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4 3xl:grid-cols-5'>
      {children}
    </div>
  );
}
