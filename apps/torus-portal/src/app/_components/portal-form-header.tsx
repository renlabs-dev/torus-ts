interface PortalFormHeaderProps {
  title: string;
  description: string;
}
export default function PortalFormHeader(props: PortalFormHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-xl font-bold">{props.title}</h1>
      <p className="text-muted-foreground text-sm text-balance">
        {props.description}
      </p>
    </div>
  );
}
