import { ProposalExpandedView } from "./_components/proposal-expanded-view";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@torus-ts/ui"

export default async function CardView({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;

  if (!id) {
    return <div>Not Found</div>;
  }

  return (
    <div className="flex flex-col w-full max-w-screen-xl pt-12 mx-auto px-4">
      <Breadcrumb className="pt-12 pb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/?view=proposals">Proposals List</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-muted-foreground">Proposal ID: {id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col justify-between w-full h-full mb-6 text-white divide-gray-500 md:mb-12 lg:flex-row">
        <ProposalExpandedView paramId={Number(id)} />
      </div>
    </div>
  );
}
