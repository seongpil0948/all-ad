"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { useState } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

import log from "@/utils/logger";

export interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  permissions: string[];
  required?: boolean;
}

interface ConsentManagerProps {
  platforms: Platform[];
  onConsent: (consentedPlatforms: string[]) => void;
  onCancel?: () => void;
}

const defaultPlatforms: Platform[] = [
  {
    id: "google_ads",
    name: "Google Ads",
    icon: <FaGoogle className="w-5 h-5" />,
    permissions: [
      "캠페인 데이터 읽기",
      "캠페인 상태 변경 (ON/OFF)",
      "성과 보고서 생성",
      "광고 계정 정보 조회",
    ],
  },
  {
    id: "meta_ads",
    name: "Meta Ads",
    icon: <FaFacebook className="w-5 h-5" />,
    permissions: [
      "광고 계정 데이터 읽기",
      "캠페인 상태 변경",
      "인사이트 및 분석 데이터 조회",
      "Business Manager 정보 접근",
    ],
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    icon: <SiTiktok className="w-5 h-5" />,
    permissions: [
      "광고 계정 데이터 읽기",
      "캠페인 관리",
      "Business Center 정보 접근",
      "리포트 데이터 조회",
    ],
  },
];

/**
 * GDPR, CCPA 및 플랫폼별 이용 약관 준수를 위한 동의 관리 컴포넌트
 * 사용자가 각 플랫폼에 대한 권한을 명확하게 이해하고 동의할 수 있도록 함
 */
export function ConsentManager({
  platforms = defaultPlatforms,
  onConsent,
  onCancel,
}: ConsentManagerProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlatformToggle = (platformId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedPlatforms);

    if (isSelected) {
      newSelection.add(platformId);
    } else {
      newSelection.delete(platformId);
    }
    setSelectedPlatforms(newSelection);

    log.info("플랫폼 선택 변경", {
      platformId,
      isSelected,
      totalSelected: newSelection.size,
    });
  };

  const handleConsentSubmit = async () => {
    if (selectedPlatforms.size === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // 선택된 플랫폼 ID 배열로 변환
      const consentedPlatforms = Array.from(selectedPlatforms);

      log.info("사용자 동의 제출", {
        platforms: consentedPlatforms,
        timestamp: new Date().toISOString(),
      });

      // 동의 내역을 부모 컴포넌트로 전달
      await onConsent(consentedPlatforms);
    } catch (error) {
      log.error("동의 처리 중 오류 발생", { error });
    } finally {
      setIsProcessing(false);
    }
  };

  const allSelected = selectedPlatforms.size === platforms.length;
  const hasSelection = selectedPlatforms.size > 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="flex flex-col gap-1 pb-6">
        <h2 className="text-2xl font-bold">광고 계정 접근 권한</h2>
        <p className="text-small text-default-500">
          올애드가 광고 계정에 접근하기 위해 필요한 권한입니다. 선택한 플랫폼에
          대해서만 접근 권한이 부여됩니다.
        </p>
      </CardHeader>

      <CardBody className="gap-4">
        {/* 전체 선택 옵션 */}
        <div className="border-b pb-4">
          <Checkbox
            isSelected={allSelected}
            onValueChange={(isSelected) => {
              if (isSelected) {
                setSelectedPlatforms(new Set(platforms.map((p) => p.id)));
              } else {
                setSelectedPlatforms(new Set());
              }
            }}
          >
            <span className="font-medium">모든 플랫폼 선택</span>
          </Checkbox>
        </div>

        {/* 플랫폼별 권한 목록 */}
        <div className="space-y-4">
          {platforms.map((platform) => (
            <div
              key={platform.id}
              className="border rounded-lg p-4 hover:bg-default-50 transition-colors"
            >
              <Checkbox
                id={platform.id}
                isRequired={platform.required}
                isSelected={selectedPlatforms.has(platform.id)}
                onValueChange={(isSelected) =>
                  handlePlatformToggle(platform.id, isSelected)
                }
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{platform.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {platform.name}
                      {platform.required && (
                        <span className="text-xs text-danger">필수</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-small text-default-500 mb-2">
                        다음 권한이 요청됩니다:
                      </p>
                      <ul className="space-y-1">
                        {platform.permissions.map((permission, index) => (
                          <li
                            key={index}
                            className="text-xs text-default-400 flex items-start gap-2"
                          >
                            <span className="text-primary mt-0.5">•</span>
                            <span>{permission}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Checkbox>
            </div>
          ))}
        </div>

        {/* 추가 정보 */}
        <div className="bg-default-100 rounded-lg p-4 mt-4">
          <h4 className="text-small font-medium mb-2">중요 안내사항</h4>
          <ul className="space-y-2 text-xs text-default-500">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>이 권한은 언제든지 설정에서 취소할 수 있습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>
                올애드는 승인된 권한 범위 내에서만 데이터에 접근합니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>모든 데이터는 암호화되어 안전하게 보호됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>개인정보 처리방침에 따라 데이터가 처리됩니다.</span>
            </li>
          </ul>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 mt-6">
          <Button
            className="flex-1"
            color="primary"
            isDisabled={!hasSelection}
            isLoading={isProcessing}
            onPress={handleConsentSubmit}
          >
            {hasSelection
              ? `${selectedPlatforms.size}개 플랫폼 연동하기`
              : "플랫폼을 선택해주세요"}
          </Button>
          {onCancel && (
            <Button isDisabled={isProcessing} variant="flat" onPress={onCancel}>
              취소
            </Button>
          )}
        </div>

        {/* 법적 고지 */}
        <p className="text-xs text-default-400 text-center mt-4">
          계속 진행하면 올애드의{" "}
          <a className="text-primary hover:underline" href="/terms">
            이용약관
          </a>{" "}
          및{" "}
          <a className="text-primary hover:underline" href="/privacy">
            개인정보 처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </p>
      </CardBody>
    </Card>
  );
}
