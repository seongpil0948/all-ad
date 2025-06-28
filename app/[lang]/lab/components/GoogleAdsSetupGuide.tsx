import { Card, CardBody } from "@heroui/card";
import { Code } from "@heroui/code";
import { Divider } from "@heroui/divider";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function GoogleAdsSetupGuide() {
  return (
    <Accordion>
      <AccordionItem
        key="google-ads-setup-guide"
        title="🔧 Google Ads 설정 가이드"
      >
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="text-sm">
            <h3 className="font-semibold mb-2">⚠️ 일반적인 오류 해결 가이드</h3>
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-red-600">
                  PERMISSION_DENIED: Google Ads API has not been used
                </p>
                <p className="text-gray-700">
                  Google Ads API를 활성화해야 합니다:
                </p>
                <ol className="list-decimal list-inside mt-1 space-y-1 text-gray-600">
                  <li>
                    <a
                      className="text-blue-600 hover:underline"
                      href="https://console.developers.google.com/apis/api/googleads.googleapis.com/overview?project=1047362900010"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Google Cloud Console에서 API 활성화 (프로젝트:
                      1047362900010)
                    </a>
                  </li>
                  <li>&quot;사용&quot; 버튼을 클릭하여 API 활성화</li>
                  <li>
                    Developer Token이 승인되었는지 확인 (Basic/Standard Access)
                  </li>
                  <li>활성화 후 2-3분 대기 필요</li>
                </ol>
              </div>
              <Divider />
              <div>
                <p className="font-semibold text-red-600">
                  redirect_uri_mismatch 오류
                </p>
                <p className="text-gray-700">
                  OAuth 2.0 클라이언트에 리디렉션 URI 추가:
                </p>
                <Code className="mt-1 text-xs">
                  {`${window.location.origin}/api/auth/callback/google-ads-lab`}
                </Code>
              </div>
              <Divider />
              <div>
                <p className="font-semibold text-orange-600">
                  Developer Token 관련
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Test Account에서는 테스트 토큰 사용 가능</li>
                  <li>Production 사용 시 Basic Access 이상 필요</li>
                  <li>
                    <a
                      className="text-blue-600 hover:underline"
                      href="https://ads.google.com/aw/apicenter"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      API Center에서 확인
                    </a>
                  </li>
                </ul>
              </div>
              <Divider />
              <div>
                <p className="font-semibold text-green-600">계정 ID 구분</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>
                    <strong>Login Customer ID (MCC)</strong>: 관리자 계정 ID
                    (예: 261-609-8766)
                  </li>
                  <li>
                    <strong>Customer ID</strong>: 실제 작업할 광고주 계정 ID
                    (예: 810-530-8586)
                  </li>
                  <li>
                    MCC 계정으로 로그인하여 여러 하위 계정을 관리할 수 있습니다
                  </li>
                </ul>
              </div>
              <Divider />
              <div>
                <p className="font-semibold text-blue-600">
                  권한 문제 해결 방법
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>Google Ads 계정이 MCC(관리자) 계정인지 확인</li>
                  <li>
                    Developer Token이 해당 MCC 계정과 연결되어 있는지 확인
                  </li>
                  <li>
                    OAuth 동의 화면에서 필요한 권한을 모두 승인했는지 확인
                  </li>
                  <li>기존 토큰이 있다면 삭제하고 다시 인증 시도</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}
