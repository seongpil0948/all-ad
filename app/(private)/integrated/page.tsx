import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers, FaHome } from "react-icons/fa";
import { redirect } from "next/navigation";

import { getIntegratedData, syncAllPlatformsAction } from "./actions";
import { IntegratedDataProvider } from "./IntegratedDataProvider";

import { SyncButton } from "@/components/dashboard/SyncButton";

export default async function IntegratedDashboard() {
  let data;

  try {
    data = await getIntegratedData();
  } catch {
    redirect("/login");
  }

  const { stats } = data;

  return (
    <IntegratedDataProvider initialData={data}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">통합 대시보드</h1>
          <form
            action={async () => {
              await syncAllPlatformsAction();
            }}
          >
            <SyncButton />
          </form>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary-100">
                  <FaChartBar className="text-primary-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-small text-default-500">전체 캠페인</p>
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
                  <p className="text-small text-default-500">활성 캠페인</p>
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
                  <p className="text-small text-default-500">연동 플랫폼</p>
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
                  <p className="text-small text-default-500">총 예산</p>
                  <p className="text-2xl font-bold">
                    ₩{stats.totalBudget.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <IntegratedTabs />
      </div>
    </IntegratedDataProvider>
  );
}

// Client component for tabs (need interactivity)
async function IntegratedTabs() {
  const { default: IntegratedTabsClient } = await import(
    "./IntegratedTabsClient"
  );

  return <IntegratedTabsClient />;
}
