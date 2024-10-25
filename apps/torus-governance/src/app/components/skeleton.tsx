interface SkeletonProps {
  className: string;
}
export function Skeleton(props: SkeletonProps): JSX.Element {
  const { className } = props;
  return <span className={`block animate-pulse bg-gray-700 ${className}`} />;
}
