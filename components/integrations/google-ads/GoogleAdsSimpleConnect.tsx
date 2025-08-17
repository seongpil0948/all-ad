/* eslint-disable local/no-literal-strings */
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaGoogle, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { useDictionary } from "@/hooks/use-dictionary";

interface GoogleAdsSimpleConnectProps {
  isConnected: boolean;
  accountEmail?: string;
  onDisconnect?: () => Promise<void>;
}

export function GoogleAdsSimpleConnect({
  isConnected,
  accountEmail,
  onDisconnect,
}: GoogleAdsSimpleConnectProps) {
  const router = useRouter();
  const { dictionary: dict } = useDictionary();

  const handleConnect = () => {
    // Redirect to OAuth flow
    router.push("/api/auth/google-ads");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 w-full">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <FaGoogle className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Google Ads</h3>
            <p className="text-sm text-default-500">
              {dict.integrations.platforms.googleAds.description}
            </p>
          </div>
          {isConnected && (
            <Chip
              color="success"
              size="sm"
              startContent={<FaCheckCircle className="text-sm" />}
              variant="flat"
            >
              {dict.integrations.connected}
            </Chip>
          )}
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-600">
                {dict.integrations.connectedAccount}
              </p>
              <p className="font-medium">{accountEmail || "Google Ads 계정"}</p>
            </div>

            {onDisconnect && (
              <Button
                fullWidth
                color="danger"
                size="sm"
                variant="flat"
                onPress={onDisconnect}
              >
                {dict.integrations.disconnect}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-default-600 space-y-2">
              <p>{dict.integrations.platforms.googleAds.features}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{dict.integrations.platforms.googleAds.feature1}</li>
                <li>{dict.integrations.platforms.googleAds.feature2}</li>
                <li>{dict.integrations.platforms.googleAds.feature3}</li>
                <li>{dict.integrations.platforms.googleAds.feature4}</li>
              </ul>
            </div>

            <Button
              fullWidth
              color="primary"
              startContent={<FaGoogle />}
              onPress={handleConnect}
            >
              {dict.integrations.platforms.googleAds.connectButton}
            </Button>

            <p className="text-xs text-default-400 text-center">
              {dict.integrations.platforms.googleAds.instructions}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
