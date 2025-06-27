"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { FiSettings, FiMail, FiGlobe } from "react-icons/fi";

export default function CookiePolicyContent() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-default-900">
          All-AD 쿠키 정책
        </h1>
        <Chip
          className="font-medium"
          color="secondary"
          size="lg"
          startContent={<FiSettings className="w-4 h-4" />}
          variant="flat"
        >
          사용자 경험 향상을 위한 쿠키 사용
        </Chip>
        <p className="text-default-600 text-sm">시행일: 2025년 1월 27일</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md font-semibold">목차</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <ul className="space-y-2 list-disc list-inside text-default-700">
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#what-are-cookies"
              >
                쿠키란 무엇인가요?
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#why-use-cookies"
              >
                All-AD는 쿠키를 왜 사용하나요?
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#cookie-types"
              >
                All-AD가 사용하는 쿠키의 종류
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#cookie-settings"
              >
                쿠키 설정 변경 방법
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#third-party"
              >
                제3자 쿠키
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#policy-changes"
              >
                쿠키 정책 변경
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#contact"
              >
                문의처
              </a>
            </li>
          </ul>
        </CardBody>
      </Card>

      <div className="space-y-8">
        {/* 쿠키란 무엇인가요? */}
        <Card id="what-are-cookies">
          <CardHeader>
            <h2 className="text-2xl font-semibold">쿠키란 무엇인가요?</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700 leading-relaxed">
              쿠키(Cookie)는 사용자가 웹사이트를 방문할 때 사용자의 컴퓨터 또는
              모바일 기기(이하 &quot;기기&quot;)에 저장되는 작은 텍스트
              파일입니다. 쿠키는 웹사이트가 사용자의 기기를 인식하고, 사용자의
              기본 설정, 로그인 상태, 이전 활동 등을 기억하여 보다 편리하고
              맞춤화된 서비스를 제공할 수 있도록 돕습니다.
            </p>
          </CardBody>
        </Card>

        {/* All-AD는 쿠키를 왜 사용하나요? */}
        <Card id="why-use-cookies">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              All-AD는 쿠키를 왜 사용하나요?
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 leading-relaxed">
              주식회사 올애드(이하 &quot;회사&quot;)는 All-AD 서비스(이하
              &quot;서비스&quot;)의 원활한 운영과 사용자 경험 향상, 그리고
              서비스 개선을 위한 분석 목적으로 쿠키를 사용합니다. 구체적인 사용
              목적은 다음과 같습니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold mb-1">1. 서비스의 필수 기능 제공</p>
                <p className="text-default-600">
                  회원 로그인 상태 유지, 보안 기능, 서비스 기본 설정 기억 등
                  서비스 제공에 반드시 필요한 기능을 위해 사용됩니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-secondary">
                <p className="font-semibold mb-1">2. 사용자 경험 최적화</p>
                <p className="text-default-600">
                  사용자가 선호하는 언어, 화면 구성 등 개인화된 설정을 기억하여
                  보다 편리한 서비스 이용 환경을 제공합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-success">
                <p className="font-semibold mb-1">3. 서비스 이용 현황 분석</p>
                <p className="text-default-600">
                  사용자의 서비스 이용 패턴, 접속 빈도, 페이지 이용 현황 등을
                  익명으로 분석하여 서비스 개선 및 신규 서비스 개발에
                  활용합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold mb-1">4. 마케팅 활동 (선택 사항)</p>
                <p className="text-default-600">
                  회사의 새로운 서비스나 이벤트 정보를 효과적으로 전달하기 위한
                  마케팅 활동에 활용될 수 있습니다. (이는 사용자의 별도 동의를
                  얻어 진행됩니다.)
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* All-AD가 사용하는 쿠키의 종류 */}
        <Card id="cookie-types">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              All-AD가 사용하는 쿠키의 종류
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 leading-relaxed">
              회사는 서비스 제공을 위해 다음과 같은 종류의 쿠키를 사용할 수
              있습니다.
            </p>
            <div className="space-y-4">
              <Card className="border-2 border-danger-200">
                <CardHeader className="bg-danger-50">
                  <div className="flex items-center gap-2">
                    <Chip color="danger" size="sm" variant="flat">
                      필수
                    </Chip>
                    <h3 className="text-lg font-semibold">
                      필수 쿠키 (Strictly Necessary Cookies)
                    </h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-default-700">
                    서비스의 핵심 기능(예: 로그인 유지, 보안 인증, 네트워크
                    관리)을 수행하는 데 반드시 필요한 쿠키입니다. 이 쿠키는
                    사용자의 동의 없이도 사용될 수 있으며, 비활성화할 경우
                    서비스의 정상적인 이용이 불가능할 수 있습니다.
                  </p>
                </CardBody>
              </Card>

              <Card className="border-2 border-primary-200">
                <CardHeader className="bg-primary-50">
                  <div className="flex items-center gap-2">
                    <Chip color="primary" size="sm" variant="flat">
                      성능
                    </Chip>
                    <h3 className="text-lg font-semibold">
                      성능 쿠키 (Performance/Analytics Cookies)
                    </h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-default-700 mb-2">
                    사용자가 서비스를 어떻게 이용하는지에 대한 정보(예: 방문
                    페이지, 이용 시간, 오류 메시지 등)를 수집하여 서비스 성능
                    개선 및 사용성 분석에 사용됩니다. 수집된 정보는 통계적
                    목적을 위해 익명으로 처리될 수 있습니다.
                  </p>
                  <p className="text-default-600 text-sm">
                    예시: Google Analytics와 같은 웹 분석 도구에서 사용되는
                    쿠키. 사용자는 이 쿠키의 사용을 거부할 수 있습니다.
                  </p>
                </CardBody>
              </Card>

              <Card className="border-2 border-secondary-200">
                <CardHeader className="bg-secondary-50">
                  <div className="flex items-center gap-2">
                    <Chip color="secondary" size="sm" variant="flat">
                      기능
                    </Chip>
                    <h3 className="text-lg font-semibold">
                      기능 쿠키 (Functional Cookies)
                    </h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-default-700">
                    사용자가 선택한 설정(예: 언어 환경, 사용자 인터페이스 개인화
                    설정 등)을 기억하여 보다 편리하고 맞춤화된 서비스를 제공하는
                    데 사용됩니다. 사용자는 이 쿠키의 사용을 거부할 수 있으며,
                    거부 시 일부 맞춤 기능 이용에 제한이 있을 수 있습니다.
                  </p>
                </CardBody>
              </Card>

              <Card className="border-2 border-warning-200">
                <CardHeader className="bg-warning-50">
                  <div className="flex items-center gap-2">
                    <Chip color="warning" size="sm" variant="flat">
                      선택
                    </Chip>
                    <h3 className="text-lg font-semibold">
                      광고/타겟팅 쿠키 (Advertising/Targeting Cookies)
                    </h3>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-default-700">
                    회사의 마케팅 캠페인 효과를 측정하거나, 사용자의 관심사에
                    기반한 회사 서비스 관련 맞춤형 광고를 다른 웹사이트에서
                    제공하기 위해 사용될 수 있습니다. (서비스 내부에 제3자
                    광고를 노출하는 용도가 아닙니다.) 이 쿠키는 사용자의
                    명시적인 동의 하에 사용되며, 언제든지 동의를 철회할 수
                    있습니다.
                  </p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* 쿠키 설정 변경 방법 */}
        <Card id="cookie-settings">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              쿠키 설정 변경 방법 (쿠키 관리 및 거부권)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 leading-relaxed">
              이용자는 쿠키 설치에 대한 선택권을 가지고 있으며, 언제든지 쿠키
              설정을 변경하여 쿠키 저장을 거부하거나 삭제할 수 있습니다.
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  1. 웹 브라우저 설정 변경
                </h3>
                <p className="text-default-600 mb-3">
                  대부분의 웹 브라우저는 쿠키를 자동으로 수락하도록 설정되어
                  있지만, 브라우저 설정을 변경하여 모든 쿠키를 거부하거나,
                  쿠키가 저장될 때마다 확인을 거치도록 할 수 있습니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="bg-default-50">
                    <CardBody className="p-3">
                      <p className="font-medium text-sm">Internet Explorer</p>
                      <p className="text-xs text-default-600">
                        도구 → 인터넷 옵션 → 개인정보 → 고급
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-default-50">
                    <CardBody className="p-3">
                      <p className="font-medium text-sm">Microsoft Edge</p>
                      <p className="text-xs text-default-600">
                        설정 등 → 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트
                        데이터 관리 및 삭제
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-default-50">
                    <CardBody className="p-3">
                      <p className="font-medium text-sm">Chrome</p>
                      <p className="text-xs text-default-600">
                        설정 → 개인 정보 보호 및 보안 → 쿠키 및 기타 사이트
                        데이터
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-default-50">
                    <CardBody className="p-3">
                      <p className="font-medium text-sm">Safari</p>
                      <p className="text-xs text-default-600">
                        환경설정 → 개인정보 보호
                      </p>
                    </CardBody>
                  </Card>
                  <Card className="bg-default-50">
                    <CardBody className="p-3">
                      <p className="font-medium text-sm">Firefox</p>
                      <p className="text-xs text-default-600">
                        설정 → 개인 정보 및 보안 → 쿠키와 사이트 데이터
                      </p>
                    </CardBody>
                  </Card>
                </div>
                <p className="text-default-600 text-sm mt-3">
                  (브라우저 종류 및 버전에 따라 설정 방법이 다를 수 있으므로, 각
                  브라우저의 도움말을 참고하시기 바랍니다.)
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  2. 서비스 내 쿠키 설정 도구 (제공 시)
                </h3>
                <p className="text-default-600">
                  회사는 사용자가 서비스 내에서 직접 쿠키 설정을 관리할 수 있는
                  도구(예: 쿠키 동의 관리 배너/팝업)를 제공할 수 있습니다. 이를
                  통해 필수 쿠키를 제외한 다른 유형의 쿠키에 대한 동의 여부를
                  선택하거나 변경할 수 있습니다.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  3. 쿠키 거부 시 영향
                </h3>
                <Chip className="mb-2" color="warning" size="sm" variant="flat">
                  주의사항
                </Chip>
                <p className="text-default-600">
                  필수 쿠키를 제외한 쿠키의 사용을 거부하는 경우, 서비스의 일부
                  기능(특히 맞춤형 서비스) 이용에 어려움이 있거나, 서비스 이용의
                  편의성이 저하될 수 있습니다.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제3자 쿠키 */}
        <Card id="third-party">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제3자 쿠키</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-default-700 leading-relaxed">
              회사는 서비스 품질 향상 및 이용 현황 분석을 위해 다음과 같은 제3자
              서비스 제공업체의 쿠키를 사용할 수 있습니다. 이러한 제3자 쿠키는
              해당 업체의 개인정보 처리방침 및 쿠키 정책에 따라 관리됩니다.
            </p>
            <div className="bg-default-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiGlobe className="w-5 h-5 text-primary" />
                <p className="font-semibold">Google Analytics</p>
              </div>
              <p className="text-default-600 text-sm">
                웹사이트 이용 현황 분석 (
                <Link
                  className="text-primary"
                  href="https://policies.google.com/privacy"
                  target="_blank"
                >
                  Google의 개인정보 처리방침 참고
                </Link>
                )
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 쿠키 정책 변경 */}
        <Card id="policy-changes">
          <CardHeader>
            <h2 className="text-2xl font-semibold">쿠키 정책 변경</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-default-700 leading-relaxed">
              본 쿠키 정책은 법령 및 정부 지침의 변경, 또는 회사 내부 방침의
              변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다.
            </p>
            <p className="text-default-700 leading-relaxed">
              쿠키 정책이 변경되는 경우, 회사는 변경 사항을 서비스 공지사항을
              통해 게시하며, 중요한 변경의 경우 이메일 등을 통해 별도로 고지할
              수 있습니다. 변경된 쿠키 정책은 게시한 날로부터 효력이 발생합니다.
            </p>
          </CardBody>
        </Card>

        {/* 문의처 */}
        <Card id="contact">
          <CardHeader>
            <h2 className="text-2xl font-semibold">문의처</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700 leading-relaxed mb-4">
              본 쿠키 정책과 관련하여 궁금한 사항이 있으시면 아래 연락처로
              문의해주시기 바랍니다.
            </p>
            <div className="bg-primary-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <FiMail className="w-5 h-5 text-primary" />
                <p className="font-semibold">이메일</p>
              </div>
              <p className="text-primary-700 ml-7">
                allofadvertisements@gmail.com
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
