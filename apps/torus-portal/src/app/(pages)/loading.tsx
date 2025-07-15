import { Loading } from "@torus-ts/ui/components/loading";

export default function LoadingPage() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center text-sm justify-center animate-pulse
        gap-2"
    >
      <span className="flex items-center gap-2">
        <Loading />
      </span>
    </div>
  );
}
