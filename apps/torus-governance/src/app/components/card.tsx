interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function CardRoot(props: CardProps): JSX.Element {
  const { children, className = "" } = props;
  return (
    <div className={`border border-white/20 bg-black/50 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader(props: CardProps): JSX.Element {
  const { children, className = "" } = props;
  return (
    <div
      className={`relative flex w-full items-center justify-center border-b border-white/20 bg-[#898989]/5 px-4 py-3 backdrop-blur-md lg:flex-row lg:justify-start ${className}`}
    >
      {children}
    </div>
  );
}

function CardBody(props: CardProps): JSX.Element {
  const { children, className = "" } = props;
  return <div className={`p-4 backdrop-blur-md ${className}`}>{children}</div>;
}

export const Card = {
  Root: CardRoot,
  Body: CardBody,
  Header: CardHeader,
};
