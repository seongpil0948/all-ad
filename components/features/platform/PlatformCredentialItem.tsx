"use client";

import { memo, useCallback } from "react";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { FaExternalLinkAlt } from "react-icons/fa";

import { PlatformIcon } from "@/components/common/PlatformIcon";
import { platformConfig } from "@/constants/platform-config";
import { PlatformType, PlatformCredential } from "@/types";

interface PlatformCredentialItemProps {
  platform: PlatformType;
  credential?: PlatformCredential;
  onAddOrEdit: (platform: PlatformType) => void;
  onToggle: (platform: PlatformType, isActive: boolean) => void;
  onDelete: (platform: PlatformType) => void;
}

function PlatformCredentialItemComponent({
  platform,
  credential,
  onAddOrEdit,
  onToggle,
  onDelete,
}: PlatformCredentialItemProps) {
  const config = platformConfig[platform];

  const handleToggle = useCallback(
    (isActive: boolean) => {
      onToggle(platform, isActive);
    },
    [platform, onToggle],
  );

  const handleAddOrEdit = useCallback(() => {
    onAddOrEdit(platform);
  }, [platform, onAddOrEdit]);

  const handleDelete = useCallback(() => {
    onDelete(platform);
  }, [platform, onDelete]);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <PlatformIcon showBackground platform={platform} />
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
            isSelected={credential.isActive}
            onValueChange={handleToggle}
          />
        )}
        <Button
          color={credential ? "default" : config.color}
          size="sm"
          startContent={
            config.supportsOAuth && !credential ? (
              <FaExternalLinkAlt size={14} />
            ) : null
          }
          variant={credential ? "flat" : "solid"}
          onPress={handleAddOrEdit}
        >
          {credential ? (config.supportsOAuth ? "재연동" : "수정") : "연동"}
        </Button>
        {credential && (
          <Button
            color="danger"
            size="sm"
            variant="light"
            onPress={handleDelete}
          >
            삭제
          </Button>
        )}
      </div>
    </div>
  );
}

export const PlatformCredentialItem = memo(PlatformCredentialItemComponent);
