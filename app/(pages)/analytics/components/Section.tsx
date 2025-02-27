type Props = {
  children: React.ReactNode;
};

export function Section({ children }: Props) {
  return <div className='w-full flex gap-4'>{children}</div>;
}
