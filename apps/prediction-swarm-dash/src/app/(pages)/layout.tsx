import { cn } from "@torus-ts/ui/lib/utils";
import { Header } from "~/app/_components/header";
import { SearchInput } from "~/app/_components/search-input";
import SphereAnimation from "~/app/_components/sphere-animation";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header className="bg-background" />
      <div className="fixed left-0 right-0 top-20 z-40">
        <Suspense fallback={<div className="h-18" />}>
          <div className="animate-in fade-in slide-in-from-top fill-mode-both delay-0 duration-1000">
            <SearchInput />
          </div>
        </Suspense>
      </div>
      <div
        className={cn(
          "bg-background relative mt-36 flex h-52 w-full flex-col items-center justify-center",
          "animate-in fade-in fill-mode-both delay-1000 duration-500",
        )}
      >
        <SphereAnimation
          cameraPosition={[0, 0, 2]}
          cameraFov={12}
          size={768}
          focus={1.15}
          fov={70}
        />
      </div>
      {children}
    </div>
  );
}
