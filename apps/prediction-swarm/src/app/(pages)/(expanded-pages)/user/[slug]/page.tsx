import { FeedLegend } from "~/app/_components/user-profile/feed-legend";
import ProfileContent from "~/app/_components/user-profile/profile-content";
import ProfileHeader from "~/app/_components/user-profile/profile-header";
import { api } from "~/trpc/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  const user = await api.twitterUser.getByUsername({ username: slug });

  if (!user) {
    notFound();
  }

  const predictions = await api.prediction.getByUsername({
    username: slug,
  });

  return (
    <div className="relative py-4">
      <div className="border-border pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-screen-lg -translate-x-1/2 border-x" />
      <div className="relative mx-auto max-w-screen-lg px-4">
        <ProfileHeader user={user} predictions={predictions} />
      </div>
      <div className="border-border relative my-4 border-t" />
      <div className="relative mx-auto max-w-screen-lg px-4">
        <FeedLegend />
      </div>
      <div className="border-border relative my-4 border-t" />
      <div className="relative mx-auto max-w-screen-lg px-4">
        <ProfileContent predictions={predictions} />
      </div>
      <div className="border-border relative my-4 border-t" />
    </div>
  );
}
