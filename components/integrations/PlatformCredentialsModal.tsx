"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/textarea";
import { Card, CardBody } from "@heroui/card";
import { Link } from "@heroui/link";
import {
  FaGoogle,
  FaFacebook,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { SiKakao, SiNaver } from "react-icons/si";

import { PlatformType } from "@/types";
import log from "@/utils/logger";

interface PlatformCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: PlatformType;
  onSubmit: (credentials: PlatformCredentials) => Promise<void>;
}

export interface PlatformCredentials {
  clientId: string;
  clientSecret: string;
  developerToken?: string; // For Google Ads
  redirectUri?: string;
}

const PLATFORM_SETUP_GUIDES = {
  google: {
    icon: FaGoogle,
    name: "Google Ads",
    setupUrl: "https://console.cloud.google.com/",
    guide: [
      "Google Cloud Console에서 새 프로젝트 생성",
      "Google Ads API 활성화",
      "OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)",
      "승인된 리디렉션 URI 추가",
      "Google Ads API Center에서 Developer Token 획득",
    ],
    fields: ["clientId", "clientSecret", "developerToken"],
  },
  facebook: {
    icon: FaFacebook,
    name: "Meta Ads",
    setupUrl: "https://developers.facebook.com/",
    guide: [
      "Facebook Developers에서 앱 생성",
      "Facebook Login 제품 추가",
      "앱 ID와 앱 시크릿 확인",
      "필요한 권한 요청: ads_management, ads_read",
    ],
    fields: ["clientId", "clientSecret"],
  },
  kakao: {
    icon: SiKakao,
    name: "카카오 모먼트",
    setupUrl: "https://developers.kakao.com/",
    guide: [
      "카카오 개발자 사이트에서 애플리케이션 생성",
      "앱 키 발급 (REST API 키)",
      "카카오 로그인 활성화",
      "Redirect URI 등록",
      "카카오 모먼트 API 사용 권한 신청",
    ],
    fields: ["clientId", "clientSecret"],
  },
  naver: {
    icon: SiNaver,
    name: "네이버 검색광고",
    setupUrl: "https://developers.naver.com/",
    guide: [
      "네이버 개발자 센터에서 애플리케이션 등록",
      "Client ID와 Client Secret 발급",
      "네이버 로그인 API 사용 설정",
      "서비스 URL 및 Callback URL 등록",
    ],
    fields: ["clientId", "clientSecret"],
  },
};

export function PlatformCredentialsModal({
  isOpen,
  onClose,
  platform,
  onSubmit,
}: PlatformCredentialsModalProps) {
  const [credentials, setCredentials] = useState<PlatformCredentials>({
    clientId: "",
    clientSecret: "",
    developerToken: "",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const platformGuide = PLATFORM_SETUP_GUIDES[platform];
  const redirectUri = `${window.location.origin}/api/auth/oauth/${platform}/callback`;

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Add redirect URI for OAuth
      const fullCredentials = {
        ...credentials,
        redirectUri,
      };
      
      await onSubmit(fullCredentials);
      
      // Reset form
      setCredentials({
        clientId: "",
        clientSecret: "",
        developerToken: "",
      });
      
      onClose();
    } catch (error) {
      log.error("Failed to save platform credentials", { platform, error });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!platformGuide) {
    return null;
  }

  const Icon = platformGuide.icon;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <span>{platformGuide.name} API 인증 정보 입력</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Setup Guide */}
            <Card>
              <CardBody>
                <h4 className="font-semibold mb-3">설정 가이드</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-default-600">
                  {platformGuide.guide.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                <Link
                  href={platformGuide.setupUrl}
                  target="_blank"
                  className="mt-3 flex items-center gap-2"
                >
                  {platformGuide.name} 개발자 콘솔로 이동
                  <FaExternalLinkAlt className="w-3 h-3" />
                </Link>
              </CardBody>
            </Card>

            {/* Redirect URI Info */}
            <Card className="bg-primary-50 border border-primary-200">
              <CardBody>
                <h4 className="font-semibold mb-2">OAuth 리디렉션 URI</h4>
                <p className="text-sm text-default-600 mb-2">
                  아래 URI를 {platformGuide.name} 콘솔의 승인된 리디렉션 URI에 추가하세요:
                </p>
                <code className="text-xs bg-default-100 p-2 rounded block break-all">
                  {redirectUri}
                </code>
              </CardBody>
            </Card>

            {/* Credentials Form */}
            <div className="space-y-4">
              {platformGuide.fields.includes("clientId") && (
                <Input
                  label={platform === "facebook" ? "앱 ID" : "Client ID"}
                  placeholder={
                    platform === "facebook" 
                      ? "Facebook 앱 ID 입력" 
                      : "Client ID 입력"
                  }
                  value={credentials.clientId}
                  onChange={(e) =>
                    setCredentials({ ...credentials, clientId: e.target.value })
                  }
                  required
                />
              )}

              {platformGuide.fields.includes("clientSecret") && (
                <Input
                  label={platform === "facebook" ? "앱 시크릿" : "Client Secret"}
                  placeholder={
                    platform === "facebook"
                      ? "Facebook 앱 시크릿 입력"
                      : "Client Secret 입력"
                  }
                  type={showSecrets ? "text" : "password"}
                  value={credentials.clientSecret}
                  onChange={(e) =>
                    setCredentials({ ...credentials, clientSecret: e.target.value })
                  }
                  endContent={
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  }
                  required
                />
              )}

              {platformGuide.fields.includes("developerToken") && (
                <Input
                  label="Developer Token"
                  placeholder="Google Ads Developer Token 입력"
                  type={showSecrets ? "text" : "password"}
                  value={credentials.developerToken}
                  onChange={(e) =>
                    setCredentials({ ...credentials, developerToken: e.target.value })
                  }
                  endContent={
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  }
                  required
                />
              )}
            </div>

            {/* Security Notice */}
            <Card className="bg-warning-50 border border-warning-200">
              <CardBody>
                <p className="text-sm text-warning-800">
                  <strong>보안 안내:</strong> 입력하신 인증 정보는 암호화되어 안전하게 저장됩니다.
                  인증 정보는 광고 플랫폼 API 접근에만 사용되며, 제3자와 공유되지 않습니다.
                </p>
              </CardBody>
            </Card>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            취소
          </Button>
          <Button
            color="primary"
            isLoading={isSubmitting}
            isDisabled={
              !credentials.clientId ||
              !credentials.clientSecret ||
              (platform === "google" && !credentials.developerToken)
            }
            onPress={handleSubmit}
          >
            저장 및 연결
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}