type Props = {
  children: React.ReactNode;
};

export function Section({ children }: Props) {
  return (
    <div className='w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 3xl:grid-cols-5 gap-4'>
      {children}
    </div>
  );
}
