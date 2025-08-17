/* eslint-disable local/no-literal-strings */
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { FiInfo, FiMail } from "react-icons/fi";

export default function RefundPolicyContent() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-default-900">
          Sivera 청약철회 및 환불규정
        </h1>
        <Chip
          className="font-medium"
          color="warning"
          size="lg"
          startContent={<FiInfo className="w-4 h-4" />}
          variant="flat"
        >
          API 연동 시 환불 불가 | 미연동 상태로 7일 이내 환불 가능
        </Chip>
        <p className="text-default-600 text-sm">최종 수정일: 2025년 1월 27일</p>
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
                href="#article1"
              >
                제1조 (목적)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article2"
              >
                제2조 (용어의 정의)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article3"
              >
                제3조 (청약철회)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article4"
              >
                제4조 (계약 해지)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article5"
              >
                제5조 (환불 규정)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article6"
              >
                제6조 (환불 절차)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article7"
              >
                제7조 (요금제 변경 시 처리)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article8"
              >
                제8조 (정책 변경)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article9"
              >
                제9조 (문의처)
              </a>
            </li>
          </ul>
        </CardBody>
      </Card>

      <div className="space-y-8">
        {/* 제1조 */}
        <Card id="article1">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제1조 (목적)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700 leading-relaxed">
              본 규정은 주식회사 시베라(이하 &quot;회사&quot;라 합니다)가
              제공하는 Sivera 유료 서비스(이하 &quot;유료 서비스&quot;라
              합니다)의 이용 계약과 관련하여 회원의 청약철회 및 계약 해지,
              환불에 관한 조건 및 절차를 명확히 규정함을 목적으로 합니다. 본
              규정은 회사의 &quot;Sivera 서비스 이용약관&quot; (이하
              &quot;이용약관&quot;이라 합니다)의 일부를 구성합니다.
            </p>
          </CardBody>
        </Card>

        {/* 제2조 */}
        <Card id="article2">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제2조 (용어의 정의)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700">
              본 규정에서 사용하는 용어는 이용약관 제2조에서 정의한 바에 따르며,
              그 외 용어의 정의는 다음과 같습니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;구독 기간&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 유료 서비스를 이용하기로 약정한 기간을 의미합니다 (예:
                  월간, 연간).
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;결제 주기&quot;</p>
                <p className="text-default-600 text-sm">
                  구독 기간에 따라 요금이 결제되는 주기를 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;정기 결제&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 미리 등록한 결제 수단을 통해 각 결제 주기마다 자동으로
                  서비스 이용 요금이 결제되는 방식을 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold">&quot;API 연동&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 서비스를 통해 자신의 외부 광고 플랫폼 계정에 접근하여
                  데이터를 동기화하고 시베라 대시보드 및 관련 기능을 이용할 수
                  있도록 연결하는 행위를 의미합니다.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제3조 */}
        <Card id="article3">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제3조 (청약철회)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="font-semibold text-primary-700">
                1. 청약철회 가능 기간
              </p>
              <p className="text-primary-600">
                회원은 유료 서비스 이용 계약 체결일 또는 유료 서비스 이용
                가능일로부터 7일 이내에 청약철회를 할 수 있습니다.
              </p>
            </div>

            <div className="bg-warning-50 p-4 rounded-lg">
              <p className="font-semibold text-warning-700 mb-2">
                2. 청약철회 제한 사항
              </p>
              <ul className="space-y-2 list-decimal list-inside text-warning-600">
                <li>
                  회원이 유료 서비스 이용 계약 후 1개 이상의 광고 플랫폼 API를
                  연동하여 데이터 동기화를 1회 이상 시작하였거나, 연동된
                  데이터를 통해 대시보드, 리포트 조회 등 서비스의 주요 기능을
                  사용한 경우. 이는 서비스의 핵심 가치를 이미 제공받고 이용한
                  것으로 간주합니다.
                </li>
                <li>
                  청약철회 가능 기간(7일) 이내라도, 제2항 제1호에 해당하지 않는
                  다른 사유로 회원이 유료 서비스의 전부 또는 상당 부분을 이미
                  사용한 경우.
                </li>
                <li>
                  시간의 경과에 의하여 재판매가 곤란할 정도로 유료 서비스의
                  가치가 현저히 감소한 경우.
                </li>
                <li>
                  기타 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련
                  법령에서 정하는 청약철회 제한 사유에 해당하는 경우.
                </li>
              </ul>
            </div>

            <div className="p-4 border border-default-200 rounded-lg">
              <p className="font-semibold mb-2">3. 청약철회 방법</p>
              <p className="text-default-600">
                회원은 청약철회를 하고자 하는 경우, 서비스 내 고객센터 또는
                지정된 연락처(allofadvertisements@gmail.com 등)를 통해
                서면(전자문서 포함)으로 청약철회 의사를 표시해야 합니다.
              </p>
            </div>

            <div className="p-4 border border-default-200 rounded-lg">
              <p className="font-semibold mb-2">4. 청약철회 효과</p>
              <p className="text-default-600">
                제3조 제2항의 청약철회 제한 사유에 해당하지 않아 청약철회가
                유효하게 이루어지는 경우, 회사는 지체 없이 회원의 유료 서비스
                이용을 중단시키고, 이미 지급받은 대금이 있다면 관련 법령에 따라
                환급 절차를 진행합니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제4조 */}
        <Card id="article4">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제4조 (계약 해지)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="pl-4 border-l-3 border-primary">
              <p className="font-semibold mb-2">1. 회원에 의한 계약 해지</p>
              <ul className="space-y-1 list-disc list-inside text-default-600">
                <li>
                  회원은 언제든지 서비스 내 &apos;설정 → 요금제 및 결제
                  관리&apos; 메뉴 또는 고객센터를 통해 유료 서비스 이용 계약의
                  해지를 신청할 수 있습니다.
                </li>
                <li>
                  계약 해지 신청 시, 회원은 현재 진행 중인 구독 기간(월간 또는
                  연간) 만료일까지 서비스를 계속 이용할 수 있으며, 다음 결제
                  주기의 정기 결제는 이루어지지 않습니다.
                </li>
              </ul>
            </div>

            <div className="pl-4 border-l-3 border-danger">
              <p className="font-semibold mb-2">2. 회사에 의한 계약 해지</p>
              <ul className="space-y-1 list-disc list-inside text-default-600">
                <li>
                  회사는 회원이 이용약관에서 정한 중대한 의무를 위반하거나,
                  서비스의 정상적인 운영을 방해하는 경우 이용약관 제13조 (서비스
                  이용 제한 및 회원 자격 상실)에 따라 이용 계약을 해지할 수
                  있습니다.
                </li>
                <li>
                  이 경우 회사는 회원에게 해지 사유를 명시하여 사전 통지하며,
                  회원에게 소명할 기회를 부여할 수 있습니다.
                </li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* 제5조 */}
        <Card id="article5">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제5조 (환불 규정)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-danger-50 p-4 rounded-lg">
              <p className="font-semibold text-danger-700 mb-2">1. 일반 원칙</p>
              <p className="text-danger-600">
                제3조 제2항 각 호에 명시된 청약철회 제한 사유(특히 API 연동 및
                서비스 주요 기능 사용)에 해당하거나, 청약철회 기간(7일)이 경과한
                경우, 이미 결제된 구독 기간의 이용 요금은 원칙적으로 환불되지
                않습니다.
              </p>
              <p className="text-danger-600 mt-2">
                회원이 구독 기간 중 계약을 해지하는 경우에도, 해당 구독 기간의
                잔여일에 대한 이용 요금은 환불되지 않으며, 회원은 해당 구독 기간
                만료일까지 서비스를 계속 이용할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 border border-default-200 rounded-lg">
                <p className="font-semibold mb-2">2. 월간 구독 서비스</p>
                <p className="text-default-600">
                  월간 구독 서비스 이용 중 회원이 계약을 해지하거나 제3조
                  제2항의 청약철회 제한 사유에 해당하는 경우, 이미 결제된 당월
                  이용 요금은 환불되지 않으며, 구독 기간 만료일까지 서비스
                  이용이 가능합니다.
                </p>
              </div>

              <div className="p-4 border border-default-200 rounded-lg">
                <p className="font-semibold mb-2">3. 연간 구독 서비스</p>
                <p className="text-default-600">
                  연간 구독 서비스 이용 중 회원이 계약을 해지하거나 제3조
                  제2항의 청약철회 제한 사유에 해당하는 경우, 이미 결제된 연간
                  이용 요금은 환불되지 않으며, 구독 기간 만료일(결제일로부터
                  1년)까지 서비스 이용이 가능합니다. 연간 구독은 장기 이용에
                  따른 할인 혜택이 적용되므로, 중도 해지에 따른 부분 환불은
                  제공되지 않습니다.
                </p>
              </div>

              <div className="p-4 border border-default-200 rounded-lg">
                <p className="font-semibold mb-2">
                  4. AI 크레딧 등 소모성 상품의 환불 (향후 V2.0 등에서 도입 시)
                </p>
                <p className="text-default-600">
                  AI 기능 이용을 위해 별도로 구매한 크레딧 등 소모성 상품은 구매
                  후 사용하지 않은 경우에 한하여 제3조에 따른 청약철회 기간 내
                  청약철회가 가능하며(단, API 연동 전제 조건이 있다면 해당 조건
                  우선), 해당 기간 경과 후 또는 일부라도 사용한 경우에는
                  원칙적으로 환불되지 않습니다.
                </p>
              </div>

              <div className="p-4 bg-success-50 rounded-lg">
                <p className="font-semibold text-success-700 mb-2">
                  5. 회사의 귀책사유로 인한 계약 해지 또는 서비스 중단 시 환불
                </p>
                <p className="text-success-600">
                  본 규정에도 불구하고, 회사의 책임 있는 사유로 인해 유료
                  서비스가 연속적으로 3일 이상 중단되거나, 월 누적 72시간 이상
                  중단되는 등 회원이 정상적인 서비스 이용이 불가능한 경우,
                  회원은 계약을 해지하고 회사가 정한 기준 또는 관련 법령에 따라
                  이용하지 못한 기간에 대한 이용료를 환불받을 수 있습니다.
                </p>
              </div>

              <div className="p-4 border border-default-200 rounded-lg">
                <p className="font-semibold mb-2">6. 과오납금의 환불</p>
                <p className="text-default-600">
                  회원이 요금을 잘못 납부한 경우(과오납), 회사는 그 과오납금을
                  회원에게 환불해야 합니다. 회사의 귀책사유로 과오납금이 발생한
                  경우, 회사는 계약비용·수수료 등에 관계없이 과오납금 전액을
                  환불합니다.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제6조 */}
        <Card id="article6">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제6조 (환불 절차)</h2>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                제3조에 따른 청약철회(제한 사유에 해당하지 않는 경우) 또는 제5조
                제5항 및 제6항에 따른 환불을 받고자 하는 회원은 서비스 내
                고객센터 또는 지정된 연락처(allofadvertisements@gmail.com 등)를
                통해 환불 요청 사유 및 필요한 정보를 제공해야 합니다.
              </li>
              <li className="text-default-700">
                회사는 회원의 환불 요청을 접수한 후, 환불 사유 및 조건을
                검토하여 처리 결과를 통지합니다.
              </li>
              <li className="text-default-700">
                환불이 결정된 경우, 회사는 영업일 기준 3~7 영업일 이내에 회원이
                결제한 수단과 동일한 방법으로 환불하는 것을 원칙으로 합니다. 단,
                동일한 방법으로 환불이 불가능한 경우에는 회원과 협의하여 다른
                방법으로 환불할 수 있습니다.
              </li>
              <li className="text-default-700">
                환불 시 발생하는 금융 수수료 등은 환불 사유에 따라 회원이 부담할
                수 있습니다. (회사의 귀책사유인 경우는 회사 부담)
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제7조 */}
        <Card id="article7">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제7조 (요금제 변경 시 처리)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="pl-4 border-l-3 border-primary">
              <p className="font-semibold mb-2">1. 업그레이드</p>
              <p className="text-default-600">
                회원이 하위 요금제에서 상위 요금제로 변경하는 경우, 변경 즉시
                상위 요금제가 적용되며, 잔여 기간에 대한 추가 요금이 일할
                계산되어 청구되거나 다음 결제일에 합산 청구될 수 있습니다.
              </p>
            </div>

            <div className="pl-4 border-l-3 border-secondary">
              <p className="font-semibold mb-2">2. 다운그레이드</p>
              <p className="text-default-600">
                회원이 상위 요금제에서 하위 요금제로 변경하는 경우, 변경 신청은
                다음 결제 주기의 시작일부터 적용되며, 현재 이용 중인 구독 기간에
                대한 차액은 환불되지 않습니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제8조 */}
        <Card id="article8">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제8조 (정책 변경)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700">
              본 청약철회 및 환불 규정은 회사의 정책 및 관련 법령의 변경에 따라
              수정될 수 있으며, 변경 시에는 이용약관 제3조(약관의 명시와 개정)의
              규정에 따라 공지합니다.
            </p>
          </CardBody>
        </Card>

        {/* 제9조 */}
        <Card id="article9">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제9조 (문의처)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700 mb-4">
              본 규정과 관련하여 궁금한 사항이 있으시면 아래 연락처로
              문의해주시기 바랍니다.
            </p>
            <div className="bg-default-100 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <FiMail className="text-primary" />
                <Link
                  color="primary"
                  href="mailto:allofadvertisements@gmail.com"
                  underline="hover"
                >
                  allofadvertisements@gmail.com
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <FiInfo className="text-primary" />
                <Link
                  isExternal
                  color="primary"
                  href="https://github.com/your-repo/issues/23"
                  underline="hover"
                >
                  이슈: 청약철회 및 환불규정 #23
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-default-500 text-sm">
        <p>© 2025 주식회사 시베라. All rights reserved.</p>
      </div>
    </div>
  );
}
