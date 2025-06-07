"use client";

import type { Tables } from "@/types/supabase.types";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaGoogle, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

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
              Google 광고 캠페인을 관리하세요
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
          {isConnected ? "연동됨" : "미연동"}
        </Chip>
      </CardHeader>

      <CardBody className="space-y-4">
        {isConnected && credential ? (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-500">연동 계정</span>
                <span className="font-medium">
                  {credential.account_name || "Google Ads 계정"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-default-500">연동 일시</span>
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
                연동 해제
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-default-600">
              Google Ads 계정을 연동하면 캠페인 성과를 실시간으로 확인하고
              관리할 수 있습니다.
            </p>

            <div className="space-y-2 text-sm text-default-500">
              <p>연동 시 다음 기능을 사용할 수 있습니다:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>캠페인 ON/OFF 제어</li>
                <li>실시간 성과 지표 확인</li>
                <li>예산 관리 및 최적화</li>
                <li>통합 리포트 생성</li>
              </ul>
            </div>

            <Button
              fullWidth
              color="primary"
              isLoading={isLoading}
              startContent={<FaGoogle />}
              onPress={onConnect}
            >
              Google Ads 연동하기
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
