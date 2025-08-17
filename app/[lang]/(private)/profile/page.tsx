import { redirect } from "next/navigation";
import { Card, CardBody } from "@heroui/card";

import { getProfileData, updateProfileAction } from "./actions";
import { ProfileForm } from "./ProfileForm";
import { Container } from "@/components/layouts/Container";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

const CONTAINER_MAX_2XL = "2xl" as const;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  let data;

  try {
    data = await getProfileData();
  } catch {
    redirect(`/${lang}/login`);
  }

  const { user, profile } = data;

  if (!profile) {
    return (
      <Container className="py-8" max={CONTAINER_MAX_2XL}>
        <h1 className="text-3xl font-bold mb-8">{dict.profile.title}</h1>
        <Card>
          <CardBody className="p-8">
            <p>{dict.profile.notFound}</p>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8" max={CONTAINER_MAX_2XL}>
      <h1 className="text-3xl font-bold mb-8">{dict.profile.title}</h1>

      <Card>
        <CardBody className="p-8">
          <ProfileForm
            profile={profile}
            updateProfileAction={updateProfileAction}
            user={user}
          />
        </CardBody>
      </Card>
    </Container>
  );
}
