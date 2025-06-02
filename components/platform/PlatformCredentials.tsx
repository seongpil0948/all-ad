"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import {
  FaFacebook,
  FaGoogle,
  FaPlus,
  FaSync,
  FaTrash,
  FaEdit,
  FaPowerOff,
  FaCheck,
} from "react-icons/fa";
import { SiNaver, SiKakaotalk } from "react-icons/si";
import { MdStorefront } from "react-icons/md";

import { usePlatformStore } from "@/stores";
import { PlatformType } from "@/types/database.types";

const platformConfig = {
  facebook: {
    name: "Facebook",
    icon: FaFacebook,
    color: "primary",
    fields: ["app_id", "app_secret", "access_token"],
  },
  google: {
    name: "Google Ads",
    icon: FaGoogle,
    color: "danger",
    fields: [
      "client_id",
      "client_secret",
      "refresh_token",
      "developer_token",
      "customer_id",
    ],
  },
  kakao: {
    name: "Kakao Moment",
    icon: SiKakaotalk,
    color: "warning",
    fields: ["app_key", "admin_key", "account_id"],
  },
  naver: {
    name: "Naver Search AD",
    icon: SiNaver,
    color: "success",
    fields: ["api_key", "secret_key", "customer_id"],
  },
  coupang: {
    name: "Coupang Ads",
    icon: MdStorefront,
    color: "secondary",
    fields: ["client_id", "client_secret", "account_id"],
  },
} as const;

export function PlatformCredentials() {
  const {
    credentials,
    isLoading,
    error,
    syncProgress,
    fetchCredentials,
    addCredential,
    updateCredential,
    toggleCredentialStatus,
    deleteCredential,
    syncPlatform,
    syncAllPlatforms,
  } = usePlatformStore();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [credentialData, setCredentialData] = useState<Record<string, string>>(
    {},
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleOpenModal = (platform?: PlatformType, credential?: any) => {
    if (credential) {
      setEditingId(credential.id);
      setSelectedPlatform(credential.platform);
      setCredentialData(credential.credentials);
    } else if (platform) {
      setEditingId(null);
      setSelectedPlatform(platform);
      setCredentialData({});
    }
    onOpen();
  };

  const handleSaveCredential = async () => {
    if (!selectedPlatform) return;

    try {
      if (editingId) {
        await updateCredential(editingId, credentialData);
        addToast({
          title: "인증 정보 업데이트",
          description: `${platformConfig[selectedPlatform].name} 인증 정보가 업데이트되었습니다.`,
          color: "success",
        });
      } else {
        await addCredential(selectedPlatform, credentialData);
        addToast({
          title: "인증 정보 추가",
          description: `${platformConfig[selectedPlatform].name} 인증 정보가 추가되었습니다.`,
          color: "success",
        });
      }
      onClose();
      setCredentialData({});
    } catch (error) {
      addToast({
        title: "오류",
        description:
          error instanceof Error
            ? error.message
            : "인증 정보 추가 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말로 삭제하시겠습니까?")) {
      try {
        await deleteCredential(id);
        addToast({
          title: "삭제 완료",
          description: "인증 정보가 삭제되었습니다",
          color: "success",
        });
      } catch {
        addToast({
          title: "오류",
          description: "삭제 중 오류가 발생했습니다",
          color: "danger",
        });
      }
    }
  };

  const handleSyncAll = async () => {
    await syncAllPlatforms();
    addToast({
      title: "동기화 시작",
      description: "모든 플랫폼 동기화가 시작되었습니다",
      color: "success",
    });
  };

  const getPlatformIcon = (platform: PlatformType) => {
    const Icon = platformConfig[platform].icon;

    return <Icon className="w-5 h-5" />;
  };

  // 이미 추가된 플랫폼 확인
  const addedPlatforms = credentials.map((c) => c.platform);
  const availablePlatforms = Object.keys(platformConfig).filter(
    (platform) => !addedPlatforms.includes(platform as PlatformType),
  ) as PlatformType[];

  if (isLoading && credentials.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">플랫폼 인증 관리</h2>
        <div className="flex gap-2">
          {credentials.length > 0 && (
            <Button
              color="primary"
              isDisabled={credentials.filter((c) => c.is_active).length === 0}
              startContent={<FaSync />}
              variant="flat"
              onPress={handleSyncAll}
            >
              전체 동기화
            </Button>
          )}
          {availablePlatforms.length > 0 && (
            <Select
              className="w-48"
              placeholder="플랫폼 추가"
              startContent={<FaPlus />}
              onChange={(e) => handleOpenModal(e.target.value as PlatformType)}
            >
              {availablePlatforms.map((platform) => (
                <SelectItem
                  key={platform}
                  startContent={getPlatformIcon(platform)}
                >
                  {platformConfig[platform].name}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>
      </div>

      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials.map((credential) => {
          const config = platformConfig[credential.platform];
          const progress = syncProgress[credential.platform];

          return (
            <Card key={credential.id} className="relative">
              <CardHeader className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                    {getPlatformIcon(credential.platform)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{config.name}</h3>
                    <Chip
                      color={credential.is_active ? "success" : "default"}
                      size="sm"
                      variant="dot"
                    >
                      {credential.is_active ? "활성" : "비활성"}
                    </Chip>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    startContent={
                      credential.is_active ? <FaPowerOff /> : <FaCheck />
                    }
                    variant="flat"
                    onPress={() => toggleCredentialStatus(credential.id)}
                  >
                    {credential.is_active ? "비활성화" : "활성화"}
                  </Button>

                  <Button
                    size="sm"
                    startContent={<FaEdit />}
                    variant="flat"
                    onPress={() => handleOpenModal(undefined, credential)}
                  >
                    수정
                  </Button>

                  <Button
                    color="danger"
                    size="sm"
                    startContent={<FaTrash />}
                    variant="flat"
                    onPress={() => handleDelete(credential.id)}
                  >
                    삭제
                  </Button>

                  {credential.is_active && (
                    <Button
                      color="primary"
                      isDisabled={progress > 0}
                      size="sm"
                      startContent={
                        <FaSync
                          className={progress > 0 ? "animate-spin" : ""}
                        />
                      }
                      variant="flat"
                      onPress={() => syncPlatform(credential.platform)}
                    >
                      {progress > 0 ? `${progress}%` : "동기화"}
                    </Button>
                  )}
                </div>

                {credential.synced_at && (
                  <p className="text-xs text-default-500 mt-2">
                    마지막 동기화:{" "}
                    {new Date(credential.synced_at).toLocaleString()}
                  </p>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          {selectedPlatform && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  {getPlatformIcon(selectedPlatform)}
                  <span>
                    {platformConfig[selectedPlatform].name}{" "}
                    {editingId ? "수정" : "추가"}
                  </span>
                </div>
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {platformConfig[selectedPlatform].fields.map((field) => (
                    <Input
                      key={field}
                      label={field.replace(/_/g, " ").toUpperCase()}
                      placeholder={`${field}를 입력하세요`}
                      type={
                        field.includes("secret") || field.includes("token")
                          ? "password"
                          : "text"
                      }
                      value={credentialData[field] || ""}
                      onChange={(e) =>
                        setCredentialData({
                          ...credentialData,
                          [field]: e.target.value,
                        })
                      }
                    />
                  ))}
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button color="primary" onPress={handleSaveCredential}>
                  {editingId ? "수정" : "추가"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
