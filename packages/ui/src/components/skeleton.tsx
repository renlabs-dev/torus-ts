interface SkeletonProps {
  className: string;
}
export function Skeleton(props: SkeletonProps): JSX.Element {
  const { className } = props;
  return (
    <span className={`animate-pulse rounded-md bg-primary/10 ${className}`} />
  );
}
