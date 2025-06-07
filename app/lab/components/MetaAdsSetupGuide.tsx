"use client";

import { Card, CardBody } from "@heroui/card";
import { Code } from "@heroui/code";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";
import { Chip } from "@heroui/chip";

export default function MetaAdsSetupGuide() {
  const currentDomain =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const requiredUrls = {
    production: `${currentDomain}/api/auth/callback/meta-ads`,
    lab: `${currentDomain}/api/auth/callback/meta-ads-lab`,
  };

  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardBody className="space-y-4">
        <h3 className="text-lg font-semibold text-amber-900">
          🔧 Facebook App 설정 가이드
        </h3>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            &ldquo;URL을 읽어들일 수 없습니다&rdquo; 오류를 해결하려면 Facebook
            App 설정에서 다음 항목들을 확인하세요:
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold">1. App Domains 설정</h4>
            <p className="text-sm text-gray-600">
              Facebook Developers → 앱 → 설정 → 기본 설정에서 App Domains에
              추가:
            </p>
            <Code className="text-sm">
              {currentDomain.replace(/^https?:\/\//, "")}
            </Code>
          </div>

          <Divider />

          <div className="space-y-2">
            <h4 className="font-semibold">2. 유효한 OAuth 리디렉션 URI</h4>
            <p className="text-sm text-gray-600">
              Facebook Login → 설정에서 다음 URI들을 모두 추가:
            </p>
            <div className="space-y-1">
              <Code className="text-sm block">{requiredUrls.production}</Code>
              <Code className="text-sm block">{requiredUrls.lab}</Code>
            </div>
          </div>

          <Divider />

          <div className="space-y-2">
            <h4 className="font-semibold">3. 앱 모드 확인</h4>
            <div className="flex gap-2 items-center">
              <Chip color="success" size="sm">
                개발 모드
              </Chip>
              <span className="text-sm">앱이 개발 모드인지 확인</span>
            </div>
            <p className="text-sm text-gray-600">
              라이브 모드에서는 App Review가 필요합니다.
            </p>
          </div>

          <Divider />

          <div className="space-y-2">
            <h4 className="font-semibold">4. Business Verification</h4>
            <p className="text-sm text-gray-600">
              고급 기능 사용을 위해 비즈니스 인증이 필요할 수 있습니다.
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm">
              <strong>빠른 링크:</strong>{" "}
              <Link
                className="text-sm"
                href="https://developers.facebook.com/apps"
                target="_blank"
              >
                Facebook Developers Console →
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>참고:</strong> localhost 환경에서는 HTTPS가 필요하지
              않지만, 프로덕션 환경에서는 반드시 HTTPS를 사용해야 합니다.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
