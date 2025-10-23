import { notFound } from "next/navigation";
import ProfileContent from "~/app/_components/user-profile/profile-content";
import ProfileHeader from "~/app/_components/user-profile/profile-header";
import { api } from "~/trpc/server";

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

  return (
    <div className="mx-auto max-w-screen-lg space-y-6 px-4 py-10">
      <ProfileHeader user={user} />
      <ProfileContent />
    </div>
  );
}
