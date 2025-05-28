export function parseSearchParams(searchParams: {
  page?: string;
  search?: string;
}) {
  const pageParam = searchParams.page;
  const page = pageParam ? parseInt(pageParam) : 1;
  const search = searchParams.search ?? null;

  return { page, search };
}
