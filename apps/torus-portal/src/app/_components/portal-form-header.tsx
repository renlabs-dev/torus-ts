interface PortalFormHeaderProps {
  title: string;
  description: string;
  extraInfo?: React.ReactNode;
}
export default function PortalFormHeader(props: PortalFormHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="text-xl font-bold flex items-center gap-0.5">
        {props.title} {props.extraInfo && <span>{props.extraInfo}</span>}
      </span>
      <p className="text-muted-foreground text-sm text-balance">
        {props.description}
      </p>
    </div>
  );
}
