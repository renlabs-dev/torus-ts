import Link from "next/link";

import { Post } from "./_components/post";
import { ArrowLeft } from "lucide-react";

export default function ViewPostPage({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  if (!params.id) {
    return <div>Not Found</div>;
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl flex-col px-4 min-h-[calc(100vh-123px)]">
      <Link
        className="my-6 ml-2 flex w-fit animate-fade-down items-center justify-center gap-2 border border-white/20 bg-[#898989]/5 px-5 py-3 text-gray-400 backdrop-blur-md transition duration-200 hover:border-green-500 hover:bg-green-500/20 hover:text-green-500"
        href="/"
      >
        <ArrowLeft className="h-6 text-green-500" />
        Go Back to Posts List
      </Link>
      <div className="flex flex-col justify-between w-full h-full mb-6 text-white divide-gray-500 md:mb-12 lg:flex-row">
        <Post postId={params.id} />
      </div>
    </div>
  );
}
