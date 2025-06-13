"use client";

import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";
import {
  FaFacebook,
  FaGoogle,
  FaFilter,
  FaDollarSign,
  FaPowerOff,
  FaCheck,
  FaChartBar,
} from "react-icons/fa";
import { SiNaver, SiKakaotalk } from "react-icons/si";
import { MdStorefront } from "react-icons/md";

import { useCampaignStore } from "@/stores";
import { Campaign } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import log from "@/utils/logger";
import { LoadingState } from "@/components/common";

const platformIcons = {
  facebook: FaFacebook,
  google: FaGoogle,
  kakao: SiKakaotalk,
  naver: SiNaver,
  coupang: MdStorefront,
};

const platformColors = {
  facebook: "primary",
  google: "danger",
  kakao: "warning",
  naver: "success",
  coupang: "secondary",
} as const;

export function CampaignDashboard() {
  const campaigns = useCampaignStore((state) => state.campaigns) || [];
  const isLoading = useCampaignStore((state) => state.isLoading);
  const fetchCampaigns = useCampaignStore((state) => state.fetchCampaigns);
  const updateCampaignBudget = useCampaignStore(
    (state) => state.updateCampaignBudget,
  );
  const updateCampaignStatus = useCampaignStore(
    (state) => state.updateCampaignStatus,
  );
  const setFilters = useCampaignStore((state) => state.setFilters);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [newBudget, setNewBudget] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    PlatformType | "all"
  >("all");

  useEffect(() => {
    fetchCampaigns().catch((err) => {
      log.error("Failed to fetch campaigns", err);
    });
  }, [fetchCampaigns]);

  const handlePlatformFilter = (platform: PlatformType | "all") => {
    setSelectedPlatform(platform);
    if (platform === "all") {
      setFilters({});
    } else {
      setFilters({ platform });
    }
  };

  const handleBudgetEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setNewBudget(campaign.budget?.toString() || "");
    onOpen();
  };

  const handleBudgetUpdate = async () => {
    if (!selectedCampaign || !newBudget) return;

    try {
      await updateCampaignBudget(selectedCampaign.id, parseFloat(newBudget));
      addToast({
        title: "예산 업데이트",
        description: `캠페인 "${selectedCampaign.name}"의 예산이 ₩${newBudget}로 업데이트되었습니다.`,
        color: "success",
      });
      onClose();
    } catch (error) {
      log.error(
        `예산 업데이트 중 오류가 발생했습니다 : ${JSON.stringify(error)}`,
      );
      addToast({
        title: "오류",
        description: "예산 업데이트 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  };

  const handleStatusToggle = async (campaign: Campaign) => {
    try {
      await updateCampaignStatus(
        campaign.id,
        campaign.isActive ? "PAUSED" : "ENABLED",
      );
      addToast({
        title: "성공",
        description: `캠페인이 ${campaign.isActive ? "비활성화" : "활성화"}되었습니다`,
        color: "success",
      });
    } catch (error) {
      log.error(`상태 변경 중 오류가 발생했습니다 : ${JSON.stringify(error)}`);
      addToast({
        title: "오류",
        description: "상태 변경 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  };

  const handleViewMetrics = (campaignId: string) => {
    // TODO: Implement metrics view when metrics API is available
    log.info("View metrics for campaign:", { campaignId });
  };

  // 플랫폼별 캠페인 수 계산
  const campaignCounts = campaigns.reduce(
    (acc, campaign) => {
      acc[campaign.platform] = (acc[campaign.platform] || 0) + 1;

      return acc;
    },
    {} as Record<PlatformType, number>,
  );

  // 전체 통계 계산
  const totalStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.isActive).length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
  };

  if (isLoading && campaigns.length === 0) {
    return <LoadingState message="캠페인 데이터를 불러오는 중..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">캠페인 대시보드</h2>
        <Button size="sm" startContent={<FaFilter />} variant="flat">
          필터
        </Button>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">전체 캠페인</p>
            <p className="text-2xl font-bold">{totalStats.totalCampaigns}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">활성 캠페인</p>
            <p className="text-2xl font-bold text-success">
              {totalStats.activeCampaigns}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">총 예산</p>
            <p className="text-2xl font-bold">
              ₩{totalStats.totalBudget.toLocaleString()}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* 플랫폼 탭 */}
      <Tabs
        selectedKey={selectedPlatform}
        onSelectionChange={(key) =>
          handlePlatformFilter(key as PlatformType | "all")
        }
      >
        <Tab key="all" title={`전체 (${campaigns.length})`} />
        {Object.entries(platformIcons).map(([platform, Icon]) => (
          <Tab
            key={platform}
            title={
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>
                  {platform} ({campaignCounts[platform as PlatformType] || 0})
                </span>
              </div>
            }
          />
        ))}
      </Tabs>

      {/* 캠페인 테이블 */}
      <Table aria-label="캠페인 목록">
        <TableHeader>
          <TableColumn>플랫폼</TableColumn>
          <TableColumn>캠페인명</TableColumn>
          <TableColumn>상태</TableColumn>
          <TableColumn>예산</TableColumn>
          <TableColumn>활성화</TableColumn>
          <TableColumn>액션</TableColumn>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const Icon = platformIcons[campaign.platform];
            const color = platformColors[campaign.platform];

            return (
              <TableRow key={campaign.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-${color}-100`}>
                      <Icon className={`w-4 h-4 text-${color}`} />
                    </div>
                    <span className="text-sm">{campaign.platform}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-xs text-default-500">
                      ID: {campaign.platformCampaignId}
                    </p>
                  </div>
                </TableCell>

                <TableCell>
                  <Chip
                    color={campaign.isActive ? "success" : "default"}
                    size="sm"
                    variant="flat"
                  >
                    {campaign.status || "Unknown"}
                  </Chip>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <span>₩{campaign.budget?.toLocaleString() || "0"}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => handleBudgetEdit(campaign)}
                    >
                      <FaDollarSign className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>

                <TableCell>
                  <Button
                    color={campaign.isActive ? "success" : "default"}
                    size="sm"
                    startContent={
                      campaign.isActive ? <FaCheck /> : <FaPowerOff />
                    }
                    variant="flat"
                    onPress={() => handleStatusToggle(campaign)}
                  >
                    {campaign.isActive ? "활성" : "비활성"}
                  </Button>
                </TableCell>

                <TableCell>
                  <Button
                    size="sm"
                    startContent={<FaChartBar />}
                    variant="flat"
                    onPress={() => handleViewMetrics(campaign.id)}
                  >
                    통계
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* 예산 수정 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>예산 수정</ModalHeader>
          <ModalBody>
            {selectedCampaign && (
              <div className="space-y-4">
                <p className="text-sm text-default-600">
                  캠페인: {selectedCampaign.name}
                </p>
                <Input
                  label="새 예산"
                  placeholder="예산을 입력하세요"
                  startContent={<span className="text-default-400">₩</span>}
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              취소
            </Button>
            <Button color="primary" onPress={handleBudgetUpdate}>
              수정
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {campaigns.length === 0 && !isLoading && (
        <Card>
          <CardBody className="text-center py-10">
            <p className="text-default-500">
              캠페인이 없습니다. 플랫폼을 연동하고 동기화를 진행하세요.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
