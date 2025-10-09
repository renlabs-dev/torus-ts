import { Suspense } from "react";
import { Header } from "@/components/header";
import { SearchInput } from "@/components/search-input";
import SphereAnimation from "@/components/sphere-animation";
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <Header className="bg-background" />
      <div className="fixed top-20 left-0 right-0 z-40">
        <Suspense fallback={<div className="h-18" />}>
          <div className="animate-in fade-in slide-in-from-top duration-1000 delay-0 fill-mode-both">
            <SearchInput />
          </div>
        </Suspense>
      </div>
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full relative h-52 bg-background mt-36",
          "animate-in fade-in duration-500 delay-1000 fill-mode-both"
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
