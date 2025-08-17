"use client";

import { Card, CardHeader, CardBody } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { useMemo, useState } from "react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { SiTiktok } from "react-icons/si";

import log from "@/utils/logger";
import { useDictionary } from "@/hooks/use-dictionary";

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

/**
 * GDPR, CCPA 및 플랫폼별 이용 약관 준수를 위한 동의 관리 컴포넌트
 * 사용자가 각 플랫폼에 대한 권한을 명확하게 이해하고 동의할 수 있도록 함
 */
export function ConsentManager({
  platforms,
  onConsent,
  onCancel,
}: ConsentManagerProps) {
  const { dictionary: dict } = useDictionary();
  const defaultPlatforms: Platform[] = useMemo(
    () => [
      {
        id: "google_ads",
        name: dict.consent.platforms.google_ads.name,
        icon: <FaGoogle className="w-5 h-5" />,
        permissions: dict.consent.platforms.google_ads.permissions,
      },
      {
        id: "meta_ads",
        name: dict.consent.platforms.meta_ads.name,
        icon: <FaFacebook className="w-5 h-5" />,
        permissions: dict.consent.platforms.meta_ads.permissions,
      },
      {
        id: "tiktok_ads",
        name: dict.consent.platforms.tiktok_ads.name,
        icon: <SiTiktok className="w-5 h-5" />,
        permissions: dict.consent.platforms.tiktok_ads.permissions,
      },
    ],
    [dict],
  );
  const platformsToRender =
    platforms && platforms.length > 0 ? platforms : defaultPlatforms;
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
        <h2 className="text-2xl font-bold">{dict.consent.title}</h2>
        <p className="text-small text-default-500">
          {dict.consent.description}
        </p>
      </CardHeader>

      <CardBody className="gap-4">
        {/* 전체 선택 옵션 */}
        <div className="border-b pb-4">
          <Checkbox
            isSelected={allSelected}
            onValueChange={(isSelected) => {
              if (isSelected) {
                setSelectedPlatforms(
                  new Set(platformsToRender.map((p) => p.id)),
                );
              } else {
                setSelectedPlatforms(new Set());
              }
            }}
          >
            <span className="font-medium">{dict.consent.selectAll}</span>
          </Checkbox>
        </div>

        {/* 플랫폼별 권한 목록 */}
        <div className="space-y-4">
          {platformsToRender.map((platform) => (
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
                        <span className="text-xs text-danger">
                          {dict.consent.required}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-small text-default-500 mb-2">
                        {dict.consent.requestedPermissions}
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
          <h4 className="text-small font-medium mb-2">
            {dict.consent.noticeTitle}
          </h4>
          <ul className="space-y-2 text-xs text-default-500">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{dict.consent.bullets.revokeAnytime}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{dict.consent.bullets.scopeOnly}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{dict.consent.bullets.encrypted}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{dict.consent.bullets.privacy}</span>
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
              ? (dict.consent.buttons.connectSelected as string).replace(
                  "{{count}}",
                  String(selectedPlatforms.size),
                )
              : dict.consent.buttons.selectPrompt}
          </Button>
          {onCancel && (
            <Button isDisabled={isProcessing} variant="flat" onPress={onCancel}>
              {dict.common.cancel}
            </Button>
          )}
        </div>

        {/* 법적 고지 */}
        <p className="text-xs text-default-400 text-center mt-4">
          {dict.consent.legal.agreePrefix}{" "}
          <Link className="text-primary hover:underline" href="/terms">
            {dict.auth.signup.termsOfService}
          </Link>{" "}
          {dict.common.and}{" "}
          <Link className="text-primary hover:underline" href="/privacy">
            {dict.auth.signup.privacyPolicy}
          </Link>
          {dict.consent.legal.agreeSuffix}
        </p>
      </CardBody>
    </Card>
  );
}
