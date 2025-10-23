import ProfileContent from "~/app/_components/user-profile/profile-content";
import ProfileHeader from "~/app/_components/user-profile/profile-header";

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <ProfileHeader />
      <ProfileContent />
    </div>
  );
}
