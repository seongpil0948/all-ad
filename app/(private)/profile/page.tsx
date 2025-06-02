import { redirect } from "next/navigation";
import { Card, CardBody } from "@heroui/card";

import { getProfileData, updateProfileAction } from "./actions";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  let data;

  try {
    data = await getProfileData();
  } catch {
    redirect("/login");
  }

  const { user, profile } = data;

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">프로필 설정</h1>
        <Card>
          <CardBody className="p-8">
            <p>프로필을 찾을 수 없습니다.</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">프로필 설정</h1>

      <Card>
        <CardBody className="p-8">
          <ProfileForm
            profile={profile}
            updateProfileAction={updateProfileAction}
            user={user}
          />
        </CardBody>
      </Card>
    </div>
  );
}
