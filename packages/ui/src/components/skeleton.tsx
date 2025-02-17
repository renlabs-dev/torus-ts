interface SkeletonProps {
  className: string;
}
export function Skeleton(props: Readonly<SkeletonProps>): JSX.Element {
  const { className } = props;
  return (
    <span
      className={`rounded-radius animate-pulse bg-primary/10 ${className}`}
    />
  );
}
