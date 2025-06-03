"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import {
  FaFacebook,
  FaGoogle,
  FaComment,
  FaShoppingCart,
} from "react-icons/fa";
import { SiNaver } from "react-icons/si";

import { PlatformCredentialForm } from "./PlatformCredentialForm";

import { PlatformCredential, PlatformType } from "@/types/database.types";

interface PlatformCredentialsManagerProps {
  credentials: PlatformCredential[];
  onSave: (
    platform: PlatformType,
    credentials: Record<string, any>,
  ) => Promise<void>;
  onDelete: (platform: PlatformType) => Promise<void>;
  onToggle: (platform: PlatformType, isActive: boolean) => Promise<void>;
}

const platformConfig = {
  facebook: {
    name: "Facebook",
    icon: FaFacebook,
    color: "primary" as const,
    bgColor: "bg-blue-500",
  },
  google: {
    name: "Google",
    icon: FaGoogle,
    color: "danger" as const,
    bgColor: "bg-red-500",
  },
  kakao: {
    name: "Kakao",
    icon: FaComment,
    color: "warning" as const,
    bgColor: "bg-yellow-400",
  },
  naver: {
    name: "Naver",
    icon: SiNaver,
    color: "success" as const,
    bgColor: "bg-green-500",
  },
  coupang: {
    name: "Coupang",
    icon: FaShoppingCart,
    color: "secondary" as const,
    bgColor: "bg-purple-500",
  },
};

export function PlatformCredentialsManager({
  credentials,
  onSave,
  onDelete,
  onToggle,
}: PlatformCredentialsManagerProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAddOrEdit = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    onOpen();
  };

  const handleSave = async (credentials: Record<string, any>) => {
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      await onSave(selectedPlatform, credentials);
      onOpenChange();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (platform: PlatformType, isActive: boolean) => {
    await onToggle(platform, isActive);
  };

  const getCredentialForPlatform = (platform: PlatformType) => {
    return credentials.find((c) => c.platform === platform);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">플랫폼 인증 관리</h3>
        </CardHeader>
        <CardBody className="gap-4">
          {(Object.keys(platformConfig) as PlatformType[]).map((platform) => {
            const config = platformConfig[platform];
            const credential = getCredentialForPlatform(platform);
            const Icon = config.icon;

            return (
              <div
                key={platform}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg text-white ${config.bgColor}`}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-medium">{config.name}</h4>
                    {credential ? (
                      <Chip color="success" size="sm" variant="flat">
                        연동됨
                      </Chip>
                    ) : (
                      <Chip color="default" size="sm" variant="flat">
                        미연동
                      </Chip>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {credential && (
                    <Switch
                      isSelected={credential.is_active}
                      onValueChange={(isActive) =>
                        handleToggle(platform, isActive)
                      }
                    />
                  )}
                  <Button
                    color={credential ? "default" : config.color}
                    size="sm"
                    variant={credential ? "flat" : "solid"}
                    onPress={() => handleAddOrEdit(platform)}
                  >
                    {credential ? "수정" : "연동"}
                  </Button>
                  {credential && (
                    <Button
                      color="danger"
                      size="sm"
                      variant="light"
                      onPress={() => onDelete(platform)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedPlatform && platformConfig[selectedPlatform].name} 인증
                정보
              </ModalHeader>
              <ModalBody>
                {selectedPlatform && (
                  <PlatformCredentialForm
                    initialValues={
                      getCredentialForPlatform(selectedPlatform)?.credentials
                    }
                    platform={selectedPlatform}
                    onSubmit={handleSave}
                  />
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button
                  color="primary"
                  form="credential-form"
                  isLoading={isLoading}
                  type="submit"
                >
                  저장
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
