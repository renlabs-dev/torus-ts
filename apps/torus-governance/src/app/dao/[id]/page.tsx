import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@torus-ts/ui";

import { DaoExpandedView } from "./_components/dao-expanded-view";

export default async function DaoView({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;

  if (!id) {
    return <div>Not Found</div>;
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col px-4">
      <Breadcrumb className="pb-8 pt-12">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/?view=proposals">
              Proposals List
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-muted-foreground">
              Proposal {id}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mb-6 flex h-full w-full flex-col justify-between divide-gray-500 text-white md:mb-12 lg:flex-row">
        <DaoExpandedView paramId={Number(id)} />
      </div>
    </div>
  );
}
