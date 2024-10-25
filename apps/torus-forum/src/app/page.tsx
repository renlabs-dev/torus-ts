import { Filters } from "./components/filters";
import { CreatePostDropdown } from "./components/create-post-dropdown";
import { PostList } from "./components/post-list";
import AppsList from "./components/apps-list";
import { api } from "~/trpc/server";

export default async function HomePage() {
  const categories = await api.forum.getCategories();

  return (
    <main className={`flex flex-col items-center justify-start w-full h-full max-w-screen-2xl px-6 md:px-20 mx-auto text-white  min-h-[calc(100vh-123px)] bg-repeat animate-fade-in-down`}>
      <div className="flex flex-col-reverse items-center justify-between w-full py-8 border-b sm:flex-row border-white/10">
        <Filters categories={categories} />
        <CreatePostDropdown categories={categories} />
      </div>

      <PostList />

      <AppsList />
    </main>
  );
}