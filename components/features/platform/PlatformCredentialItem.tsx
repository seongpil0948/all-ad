"use client";

import { memo, useCallback } from "react";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { FaExternalLinkAlt } from "react-icons/fa";

import { PlatformIcon } from "@/components/common/PlatformIcon";
import { platformConfig } from "@/constants/platform-config";
import { PlatformType, PlatformCredential } from "@/types";
import { useDictionary } from "@/hooks/use-dictionary";

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
  const { dictionary: dict } = useDictionary();
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
              {dict.integrations.connected}
            </Chip>
          ) : (
            <Chip color="default" size="sm" variant="flat">
              {dict.integrations.credentials.notConnected}
            </Chip>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {credential && (
          <Switch
            isSelected={credential.is_active ?? false}
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
          {credential
            ? config.supportsOAuth
              ? dict.integrations.reconnect
              : dict.common.edit
            : dict.integrations.connect}
        </Button>
        {credential && (
          <Button
            color="danger"
            size="sm"
            variant="light"
            onPress={handleDelete}
          >
            {dict.common.delete}
          </Button>
        )}
      </div>
    </div>
  );
}

export const PlatformCredentialItem = memo(PlatformCredentialItemComponent);
