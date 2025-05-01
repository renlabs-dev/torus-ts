import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { ShapeNetworkModal } from "./shape-network-modal";

interface PageContainerProps {
  pageHeader: React.ReactNode;
  pageContent: React.ReactNode;
  displayShapeNetworkModal?: boolean;
}

export function PageContainer(props: PageContainerProps) {
  return (
    <main className="flex w-full flex-col gap-2 pb-16 pt-2 animate-fade">
      <div className="flex w-full flex-col justify-between gap-3 pb-2 lg:flex-row">
        {props.pageHeader}
        {props.displayShapeNetworkModal && <ShapeNetworkModal />}
      </div>
      <ScrollArea className="max-h-[calc(100vh-15.9rem)]">
        <div className="flex flex-col gap-4">{props.pageContent}</div>
      </ScrollArea>
    </main>
  );
}
