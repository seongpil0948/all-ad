import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";
import { redirect } from "next/navigation";

import {
  getTeamCredentials,
  savePlatformCredentials,
  deletePlatformCredentialById,
  togglePlatformCredentialById,
} from "./actions";

import { createClient } from "@/utils/supabase/server";
import { MultiAccountPlatformManager } from "@/components/features/platform/MultiAccountPlatformManager";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";
import { Container } from "@/components/layouts/Container";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;
const CONTAINER_MAX_4XL = "4xl" as const;

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
  }

  // Get user's team
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  if (!teamMember) {
    redirect(`/${lang}/error?message=no_team`);
  }

  const credentials = await getTeamCredentials();

  return (
    <Container className="py-8" max={CONTAINER_MAX_4XL}>
      <h1 className="text-3xl font-bold mb-8">{dict.settings.title}</h1>

      <div className="space-y-6">
        {/* Platform Credentials Section */}
        <MultiAccountPlatformManager
          credentials={credentials}
          teamId={teamMember.team_id}
          userId={user.id}
          onDelete={deletePlatformCredentialById}
          onSave={savePlatformCredentials}
          onToggle={togglePlatformCredentialById}
        />

        {/* Notification Settings */}
        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">
                {dict.settings.sections.notifications.title}
              </p>
              <p className="text-small text-default-500">
                {dict.settings.sections.notifications.subtitle}
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.notifications.email.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.notifications.email.description}
                </p>
              </div>
              <Switch defaultSelected />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.notifications.browser.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.notifications.browser.description}
                </p>
              </div>
              <Switch />
            </div>
          </CardBody>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">
                {dict.settings.sections.security.title}
              </p>
              <p className="text-small text-default-500">
                {dict.settings.sections.security.subtitle}
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.security.twoFactor.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.security.twoFactor.description}
                </p>
              </div>
              <Switch />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.security.loginAlerts.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.security.loginAlerts.description}
                </p>
              </div>
              <Switch defaultSelected />
            </div>
          </CardBody>
        </Card>

        {/* Data & Privacy Settings */}
        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">
                {dict.settings.sections.privacy.title}
              </p>
              <p className="text-small text-default-500">
                {dict.settings.sections.privacy.subtitle}
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.privacy.dataCollection.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.privacy.dataCollection.description}
                </p>
              </div>
              <Switch defaultSelected />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">
                  {dict.settings.sections.privacy.marketing.title}
                </p>
                <p className="text-small text-default-500">
                  {dict.settings.sections.privacy.marketing.description}
                </p>
              </div>
              <Switch />
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
