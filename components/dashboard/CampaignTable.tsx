"use client";

import { useState } from "react";
import { FaSearch, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Tooltip } from "@heroui/tooltip";
import { SortDescriptor } from "@react-types/shared";

import { Campaign } from "@/types";

interface CampaignTableProps {
  campaigns: Campaign[];
  onUpdateBudget: (
    campaignId: string,
    platform: Campaign["platform"],
    platformCampaignId: string,
    budget: number,
  ) => Promise<void>;
  onUpdateStatus: (
    campaignId: string,
    platform: Campaign["platform"],
    platformCampaignId: string,
    isActive: boolean,
  ) => Promise<void>;
}

const platformColors = {
  facebook: "primary",
  google: "danger",
  kakao: "warning",
  naver: "success",
  coupang: "secondary",
} as const;

export function CampaignTable({
  campaigns,
  onUpdateBudget,
  onUpdateStatus,
}: CampaignTableProps) {
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState<number>(0);

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(filterValue.toLowerCase()),
  );

  const pages = Math.ceil(filteredCampaigns.length / rowsPerPage);

  const items = filteredCampaigns.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const sortedItems = [...items].sort((a, b) => {
    const first = a[sortDescriptor.column as keyof Campaign];
    const second = b[sortDescriptor.column as keyof Campaign];

    if (first === undefined || second === undefined) {
      return 0; // Handle cases where the value is undefined
    }
    const cmp = first < second ? -1 : first > second ? 1 : 0;

    return sortDescriptor.direction === "descending" ? -cmp : cmp;
  });

  const handleEditBudget = (campaignId: string, currentBudget: number) => {
    setEditingBudget(campaignId);
    setBudgetValue(currentBudget || 0);
  };

  const handleSaveBudget = async (campaign: Campaign) => {
    await onUpdateBudget(
      campaign.id,
      campaign.platform,
      campaign.platformCampaignId,
      budgetValue,
    );
    setEditingBudget(null);
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
    setBudgetValue(0);
  };

  const handleStatusChange = async (campaign: Campaign, isActive: boolean) => {
    await onUpdateStatus(
      campaign.id,
      campaign.platform,
      campaign.platformCampaignId,
      isActive,
    );
  };

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between gap-3 items-end">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="캠페인 검색..."
          startContent={<FaSearch />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-default-400 text-small">
          총 {campaigns.length}개의 캠페인
        </span>
        <label className="flex items-center text-default-400 text-small">
          페이지당 행 수:
          <select
            className="bg-transparent outline-none text-default-400 text-small"
            onChange={(e) => setRowsPerPage(Number(e.target.value))}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
          </select>
        </label>
      </div>
    </div>
  );

  const bottomContent =
    pages > 1 ? (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    ) : null;

  return (
    <Table
      isHeaderSticky
      aria-label="캠페인 테이블"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[600px]",
      }}
      selectedKeys={selectedKeys}
      selectionMode="multiple"
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        <TableColumn key="platform" allowsSorting>
          플랫폼
        </TableColumn>
        <TableColumn key="name" allowsSorting>
          캠페인명
        </TableColumn>
        <TableColumn key="status" allowsSorting>
          상태
        </TableColumn>
        <TableColumn key="budget" allowsSorting>
          예산
        </TableColumn>
        <TableColumn key="is_active" allowsSorting>
          활성화
        </TableColumn>
        <TableColumn key="synced_at" allowsSorting>
          마지막 동기화
        </TableColumn>
      </TableHeader>
      <TableBody emptyContent="캠페인이 없습니다" items={sortedItems}>
        {(campaign) => (
          <TableRow key={campaign.id}>
            <TableCell>
              <Chip
                className="capitalize"
                color={platformColors[campaign.platform]}
                size="sm"
                variant="flat"
              >
                {campaign.platform}
              </Chip>
            </TableCell>
            <TableCell>{campaign.name}</TableCell>
            <TableCell>{campaign.status || "-"}</TableCell>
            <TableCell>
              {editingBudget === campaign.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    className="w-32"
                    size="sm"
                    type="number"
                    value={budgetValue.toString()}
                    onValueChange={(value) => setBudgetValue(Number(value))}
                  />
                  <Button
                    isIconOnly
                    color="success"
                    size="sm"
                    variant="flat"
                    onPress={() => handleSaveBudget(campaign)}
                  >
                    <FaSave />
                  </Button>
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="flat"
                    onPress={handleCancelEdit}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>₩{campaign.budget?.toLocaleString() || 0}</span>
                  <Tooltip content="예산 수정">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() =>
                        handleEditBudget(campaign.id, campaign.budget || 0)
                      }
                    >
                      <FaEdit />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </TableCell>
            <TableCell>
              <Switch
                isSelected={campaign.isActive}
                onValueChange={(isActive) =>
                  handleStatusChange(campaign, isActive)
                }
              />
            </TableCell>
            <TableCell>
              {campaign.updatedAt
                ? new Date(campaign.updatedAt).toLocaleString()
                : "동기화 필요"}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
