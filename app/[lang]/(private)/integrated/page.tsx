import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers, FaHome } from "react-icons/fa";
import { redirect } from "next/navigation";

import { getIntegratedData, syncAllPlatformsAction } from "./actions";
import { IntegratedDataProvider } from "./IntegratedDataProvider";

import { SyncButton } from "@/components/dashboard/SyncButton";
import IntegratedTabsClient from "./IntegratedTabsClient";
import { Container } from "@/components/layouts/Container";
import { PageHeader } from "@/components/common/PageHeader";
import { AutoGrid } from "@/components/common/AutoGrid";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function IntegratedDashboard({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  let data;

  try {
    data = await getIntegratedData();
  } catch {
    redirect(`/${lang}/login`);
  }

  const { stats, campaigns } = data;

  return (
    <IntegratedDataProvider initialData={data}>
      <Container className="py-8">
        <PageHeader
          pageTitle={dict.dashboard.title}
          actions={
            <form action={syncAllPlatformsAction}>
              <SyncButton showLabel />
            </form>
          }
        />

        {/* Overview Stats */}
        <AutoGrid minItemWidth={240} className="mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary-100">
                  <FaChartBar className="text-primary-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-small text-default-500">
                    {dict.dashboard.overview.totalCampaigns}
                  </p>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success-100">
                  <FaHome className="text-success-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-small text-default-500">
                    {dict.dashboard.overview.activeCampaigns}
                  </p>
                  <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning-100">
                  <FaKey className="text-warning-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-small text-default-500">
                    {dict.dashboard.overview.connectedPlatforms}
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.connectedPlatforms}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-secondary-100">
                  <FaUsers className="text-secondary-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-small text-default-500">
                    {dict.dashboard.overview.totalBudget}
                  </p>
                  <p className="text-2xl font-bold">
                    ₩{stats.totalBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </AutoGrid>

        <IntegratedTabsClient
          initialCampaigns={campaigns}
          initialStats={stats}
        />
      </Container>
    </IntegratedDataProvider>
  );
}
