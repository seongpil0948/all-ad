"use client";

import type { Tables } from "@/types/supabase.types";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaGoogle, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

import { useDictionary } from "@/hooks/use-dictionary";

type PlatformCredential = Tables<"platform_credentials">;

interface GoogleAdsIntegrationProps {
  credential?: PlatformCredential;
  onConnect: () => void;
  onDisconnect: () => void;
  isLoading?: boolean;
}

export function GoogleAdsIntegration({
  credential,
  onConnect,
  onDisconnect,
  isLoading = false,
}: GoogleAdsIntegrationProps) {
  const { dictionary: dict } = useDictionary();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = credential?.is_active === true;

  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <FaGoogle className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Google Ads</h3>
            <p className="text-sm text-default-500">
              {dict.integrations.platforms.googleAds.description}
            </p>
          </div>
        </div>
        <Chip
          color={isConnected ? "success" : "default"}
          startContent={
            isConnected ? (
              <FaCheckCircle className="text-sm" />
            ) : (
              <FaExclamationCircle className="text-sm" />
            )
          }
          variant="flat"
        >
          {isConnected
            ? dict.integrations.connected
            : dict.integrations.credentials.notConnected}
        </Chip>
      </CardHeader>

      <CardBody className="space-y-4">
        {isConnected && credential ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-500">
                  {dict.integrations.connectedAccount}
                </span>
                <span className="font-medium">
                  {credential.account_name || "Google Ads Account"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-default-500">
                  {dict.integrations.credentials.connectedDate}
                </span>
                <span className="font-medium">
                  {new Date(credential.created_at).toLocaleDateString()}
                </span>
              </div>
              {credential.account_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-default-500">Customer ID</span>
                  <span className="font-medium">{credential.account_id}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                fullWidth
                color="danger"
                isLoading={isDisconnecting}
                size="sm"
                variant="flat"
                onPress={handleDisconnect}
              >
                {dict.integrations.disconnect}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-default-600">
              {dict.integrations.credentials.googleDescription}
            </p>

            <div className="space-y-2 text-sm text-default-500">
              <p>{dict.integrations.platforms.googleAds.features}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{dict.integrations.platforms.googleAds.feature2}</li>
                <li>{dict.integrations.platforms.googleAds.feature1}</li>
                <li>{dict.integrations.credentials.budgetManagement}</li>
                <li>{dict.integrations.platforms.googleAds.feature4}</li>
              </ul>
            </div>

            <Button
              fullWidth
              color="primary"
              isLoading={isLoading}
              startContent={<FaGoogle />}
              onPress={onConnect}
            >
              {dict.integrations.platforms.googleAds.connectButton}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
