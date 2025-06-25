"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaGoogle, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
              구글 광고 계정을 연동하세요
            </p>
          </div>
          {isConnected && (
            <Chip
              color="success"
              size="sm"
              startContent={<FaCheckCircle className="text-sm" />}
              variant="flat"
            >
              연동됨
            </Chip>
          )}
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-default-100 rounded-lg p-3">
              <p className="text-sm text-default-600">연동된 계정</p>
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
                연동 해제
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-default-600 space-y-2">
              <p>Google Ads 연동 시 가능한 기능:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>캠페인 실시간 모니터링</li>
                <li>캠페인 ON/OFF 제어</li>
                <li>성과 데이터 자동 수집</li>
                <li>통합 리포트 생성</li>
              </ul>
            </div>

            <Button
              fullWidth
              color="primary"
              startContent={<FaGoogle />}
              onPress={handleConnect}
            >
              Google 계정으로 연동하기
            </Button>

            <p className="text-xs text-default-400 text-center">
              Google 로그인 후 권한을 승인하면 자동으로 연동됩니다
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
