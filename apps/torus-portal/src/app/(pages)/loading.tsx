import { Loading } from "@torus-ts/ui/components/loading";

export default function LoadingPage() {
  return (
    <div className="fixed inset-0 flex animate-pulse flex-col items-center justify-center gap-2 text-sm">
      <span className="flex items-center gap-2">
        <Loading />
      </span>
    </div>
  );
}
