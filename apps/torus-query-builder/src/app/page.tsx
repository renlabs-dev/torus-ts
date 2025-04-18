import { QueryCard } from "./_components/query-card";

export default function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Torus Query Builder</h1>
      <QueryCard />
    </main>
  );
}
