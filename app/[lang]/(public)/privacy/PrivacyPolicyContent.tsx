/* eslint-disable local/no-literal-strings */
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { FiShield, FiMail, FiPhone, FiGlobe } from "react-icons/fi";

export default function PrivacyPolicyContent() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-default-900">
          Sivera 개인정보 처리방침
        </h1>
        <Chip
          className="font-medium"
          color="success"
          size="lg"
          startContent={<FiShield className="w-4 h-4" />}
          variant="flat"
        >
          이용자 권익 보호에 최선을 다합니다
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
            {[
              "제1조 (총칙)",
              "제2조 (수집하는 개인정보의 항목 및 수집방법)",
              "제3조 (개인정보의 수집 및 이용목적)",
              "제4조 (개인정보의 제3자 제공)",
              "제5조 (개인정보처리의 위탁)",
              "제6조 (개인정보의 국외 이전에 관한 사항)",
              "제7조 (개인정보의 보유 및 이용기간)",
              "제8조 (개인정보의 파기절차 및 방법)",
              "제9조 (정보주체와 법정대리인의 권리·의무 및 그 행사방법)",
              "제10조 (개인정보 자동 수집 장치의 설치·운영 및 그 거부에 관한 사항)",
              "제11조 (개인정보의 안전성 확보 조치)",
              "제12조 (개인정보 보호책임자 및 담당부서 안내)",
              "제13조 (권익침해 구제방법)",
              "제14조 (정책 변경에 관한 사항)",
              "제15조 (부칙)",
            ].map((title, index) => (
              <li key={index}>
                <a
                  className="hover:text-primary transition-colors"
                  href={`#article${index + 1}`}
                >
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="space-y-8">
        {/* 제1조 */}
        <Card id="article1">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제1조 (총칙)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700 leading-relaxed">
              주식회사 시베라(이하 &quot;회사&quot;라 합니다)는 정보통신망
              이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련
              법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보
              처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다. 본
              개인정보 처리방침은 회사에서 제공하는 &quot;All-AD&quot;
              서비스(이하 &quot;서비스&quot;라 합니다)에 적용됩니다.
            </p>
          </CardBody>
        </Card>

        {/* 제2조 */}
        <Card id="article2">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제2조 (수집하는 개인정보의 항목 및 수집방법)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold mb-2">
                  1. 회원가입 시 수집하는 개인정보
                </p>
                <div className="bg-primary-50 p-3 rounded-lg">
                  <p className="text-primary-700 font-medium">필수항목</p>
                  <p className="text-primary-600">
                    이름, 이메일 주소(아이디), 비밀번호
                  </p>
                </div>
                <div className="mt-2 bg-default-100 p-3 rounded-lg">
                  <p className="text-default-700 font-medium">
                    선택항목 (서비스 기획에 따라 추가)
                  </p>
                  <p className="text-default-600">회사명, 연락처</p>
                </div>
              </div>

              <div className="pl-4 border-l-3 border-secondary">
                <p className="font-semibold mb-2">
                  2. 서비스 이용 과정에서 자동으로 수집되는 정보
                </p>
                <ul className="space-y-1 list-disc list-inside text-default-600">
                  <li>IP Address, 쿠키, 방문 일시</li>
                  <li>서비스 이용 기록, 불량 이용 기록</li>
                  <li>기기 정보(OS, 브라우저 정보 등)</li>
                </ul>
              </div>

              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold mb-2">
                  3. 광고 플랫폼 계정 연동 시 수집되는 정보
                </p>
                <div className="bg-warning-50 p-3 rounded-lg">
                  <p className="text-warning-700 font-medium">
                    광고 플랫폼 데이터
                  </p>
                  <ul className="mt-1 space-y-1 list-disc list-inside text-warning-600 text-sm">
                    <li>각 플랫폼의 광고 계정 식별 정보</li>
                    <li>캠페인 정보, 광고 그룹 정보, 광고 소재 정보</li>
                    <li>
                      광고 성과 데이터(노출수, 클릭수, 비용, 전환수, ROAS 등)
                    </li>
                    <li>예산 정보, 타겟팅 정보</li>
                  </ul>
                </div>
              </div>

              <div className="pl-4 border-l-3 border-default">
                <p className="font-semibold mb-2">4. 개인정보 수집 방법</p>
                <ul className="space-y-1 list-disc list-inside text-default-600">
                  <li>홈페이지, 모바일 웹/앱에서의 회원가입, 서비스 이용</li>
                  <li>
                    서면양식, 팩스, 전화, 상담 게시판, 이메일, 이벤트 응모
                  </li>
                  <li>생성정보 수집 툴을 통한 수집</li>
                  <li>사용자의 광고 플랫폼 계정 연동 시 API를 통한 수집</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제3조 */}
        <Card id="article3">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제3조 (개인정보의 수집 및 이용목적)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">1. 회원 관리</p>
                <p className="text-default-600 text-sm">
                  회원제 서비스 이용에 따른 본인 식별, 가입 의사 확인, 연령
                  확인, 불량회원의 부정 이용 방지와 비인가 사용 방지, 중복 가입
                  확인, 분쟁 조정을 위한 기록 보존, 불만처리 등 민원처리,
                  고지사항 전달
                </p>
              </div>
              <div className="pl-4 border-l-3 border-success">
                <p className="font-semibold">2. 서비스 제공</p>
                <p className="text-default-600 text-sm">
                  통합 대시보드 제공, 광고 플랫폼 데이터 연동 및 자동 수집, 통합
                  리포팅 및 분석 자료 제공, 캠페인 ON/OFF 등 관리 기능 제공,
                  콘텐츠 제공, 맞춤 서비스 제공
                </p>
              </div>
              <div className="pl-4 border-l-3 border-secondary">
                <p className="font-semibold">
                  3. 신규 서비스 개발 및 마케팅·광고에의 활용 (선택적 동의 사항)
                </p>
                <p className="text-default-600 text-sm">
                  신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른
                  서비스 제공 및 광고 게재, 서비스의 유효성 확인, 이벤트 및
                  광고성 정보 제공 및 참여기회 제공, 접속빈도 파악, 회원의
                  서비스 이용에 대한 통계
                </p>
              </div>
              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold">
                  4. 유료 서비스 제공 (향후 유료 플랜 도입 시)
                </p>
                <p className="text-default-600 text-sm">
                  요금 결제, 구매 및 요금 추심
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제4조 */}
        <Card id="article4">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제4조 (개인정보의 제3자 제공)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-success-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-success-700">원칙</p>
              <p className="text-success-600">
                회사는 원칙적으로 이용자의 개인정보를 제3조(개인정보의 수집 및
                이용목적)에서 명시한 범위 내에서 처리하며, 이용자의 사전 동의
                없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지
                않습니다.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-2">예외 사항</p>
              <ul className="space-y-1 list-disc list-inside text-default-600">
                <li>이용자들이 사전에 동의한 경우</li>
                <li>
                  법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와
                  방법에 따라 수사기관의 요구가 있는 경우
                </li>
                <li>
                  (향후 유료 플랜 도입 시) 서비스 제공에 따른 요금정산을 위하여
                  필요한 경우
                </li>
              </ul>
            </div>
            <div className="mt-4 p-4 border border-default-200 rounded-lg">
              <p className="text-default-600 text-sm">
                제3자 제공 시 제공받는 자, 제공받는 자의 이용 목적, 제공하는
                항목, 보유 및 이용 기간 등을 명시하여 동의를 받습니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제5조 */}
        <Card id="article5">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제5조 (개인정보처리의 위탁)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 서비스 향상을 위해서 아래와 같이 개인정보를 위탁하고
              있으며, 관계 법령에 따라 위탁계약 시 개인정보가 안전하게 관리될 수
              있도록 필요한 사항을 규정하고 있습니다.
            </p>
            <div className="space-y-3">
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold mb-2">
                  1. 클라우드 서버 호스팅 및 시스템 운영
                </p>
                <ul className="space-y-1 text-default-600 text-sm">
                  <li>
                    <strong>수탁업체:</strong> Amazon Web Services, Inc.
                  </li>
                  <li>
                    <strong>위탁업무 내용:</strong> 서비스 제공을 위한 인프라
                    운영 및 데이터 보관
                  </li>
                  <li>
                    <strong>보유 및 이용기간:</strong> 회원 탈퇴 시 혹은 위탁
                    계약 종료 시까지
                  </li>
                </ul>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold mb-2">
                  2. (향후 결제 기능 도입 시) 결제 처리
                </p>
                <ul className="space-y-1 text-default-600 text-sm">
                  <li>
                    <strong>수탁업체:</strong> [결제 대행사 명칭]
                  </li>
                  <li>
                    <strong>위탁업무 내용:</strong> 신용카드, 휴대폰, 계좌이체
                    등을 통한 결제 처리
                  </li>
                  <li>
                    <strong>보유 및 이용기간:</strong> 회원 탈퇴 시 혹은 위탁
                    계약 종료 시까지
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제6조 */}
        <Card id="article6">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제6조 (개인정보의 국외 이전에 관한 사항)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-warning-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-warning-700">
                <FiGlobe className="inline mr-2" />
                국외 이전 안내
              </p>
              <p className="text-warning-600 text-sm">
                회사는 서비스 제공 및 이용자 편의 증진을 위하여 클라우드 기반의
                서비스 인프라를 해외에 위치한 데이터센터에 두고 운영하고
                있습니다.
              </p>
            </div>
            <div className="space-y-3">
              <div className="grid gap-2">
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    이전되는 항목:
                  </span>
                  <span className="text-default-600">
                    제2조에서 수집하는 모든 개인정보 (이름, 이메일 주소,
                    비밀번호(암호화), 서비스 이용 기록, 광고 플랫폼 데이터 등)
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    이전되는 국가:
                  </span>
                  <span className="text-default-600">
                    미국, 일본, 싱가포르 등 AWS 리전 국가
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    이전 일시 및 방법:
                  </span>
                  <span className="text-default-600">
                    서비스 이용에 따른 데이터 생성 및 동기화 시점에
                    정보통신망(암호화된 통신 구간)을 통해 안전하게 이전
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    이전받는 자:
                  </span>
                  <span className="text-default-600">
                    Amazon Web Services, Inc.
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    이용 목적:
                  </span>
                  <span className="text-default-600">
                    클라우드 서버 운영을 통한 서비스 데이터의 안전한 보관 및
                    처리, 서비스 인프라 관리 및 유지보수
                  </span>
                </div>
                <div className="flex">
                  <span className="font-semibold min-w-[140px]">
                    보유 기간:
                  </span>
                  <span className="text-default-600">
                    회원의 서비스 이용 기간 동안 또는 개인정보 처리 위탁 계약
                    종료 시까지
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 border border-warning-200 rounded-lg bg-warning-50">
              <p className="text-warning-700 text-sm">
                이용자는 개인정보의 국외 이전에 대한 동의를 거부할 권리가
                있습니다. 다만, 동의를 거부하는 경우 서비스의 전부 또는 일부
                이용이 제한될 수 있습니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제7조 */}
        <Card id="article7">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제7조 (개인정보의 보유 및 이용기간)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이
              달성되면 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의
              이유로 명시한 기간 동안 보존합니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold mb-2">
                  1. 회사 내부 방침에 의한 정보 보유 사유
                </p>
                <div className="bg-default-100 p-3 rounded-lg">
                  <p className="text-default-700">부정 이용 기록</p>
                  <p className="text-default-600 text-sm">보존 기간: 1년</p>
                </div>
              </div>
              <div className="pl-4 border-l-3 border-secondary">
                <p className="font-semibold mb-2">
                  2. 관련 법령에 의한 정보 보유 사유
                </p>
                <div className="space-y-2">
                  <div className="bg-default-100 p-3 rounded-lg">
                    <p className="text-default-700">
                      계약 또는 청약철회 등에 관한 기록
                    </p>
                    <p className="text-default-600 text-sm">
                      보존 기간: 5년 (전자상거래 등에서의 소비자보호에 관한
                      법률)
                    </p>
                  </div>
                  <div className="bg-default-100 p-3 rounded-lg">
                    <p className="text-default-700">
                      대금결제 및 재화 등의 공급에 관한 기록
                    </p>
                    <p className="text-default-600 text-sm">
                      보존 기간: 5년 (전자상거래 등에서의 소비자보호에 관한
                      법률)
                    </p>
                  </div>
                  <div className="bg-default-100 p-3 rounded-lg">
                    <p className="text-default-700">
                      소비자의 불만 또는 분쟁처리에 관한 기록
                    </p>
                    <p className="text-default-600 text-sm">
                      보존 기간: 3년 (전자상거래 등에서의 소비자보호에 관한
                      법률)
                    </p>
                  </div>
                  <div className="bg-default-100 p-3 rounded-lg">
                    <p className="text-default-700">로그인 기록</p>
                    <p className="text-default-600 text-sm">
                      보존 기간: 3개월 (통신비밀보호법)
                    </p>
                  </div>
                </div>
              </div>
              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold mb-2">3. 광고 플랫폼 데이터</p>
                <p className="text-default-600 text-sm">
                  서비스 제공을 위해 사용자가 광고 플랫폼 계정 연동을 유지하는
                  동안 보유하며, 사용자가 직접 연동을 해제하거나 회원 탈퇴 시
                  회사의 내부 절차에 따라 안전하게 파기됩니다.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제8조 */}
        <Card id="article8">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제8조 (개인정보의 파기절차 및 방법)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당
              정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-danger">
                <p className="font-semibold mb-2">1. 파기절차</p>
                <p className="text-default-600 text-sm">
                  이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후
                  별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및
                  기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간
                  참조) 일정 기간 저장된 후 파기됩니다. 별도 DB로 옮겨진
                  개인정보는 법률에 의한 경우가 아니고서는 보유되는 이외의 다른
                  목적으로 이용되지 않습니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-danger">
                <p className="font-semibold mb-2">2. 파기방법</p>
                <ul className="space-y-1 list-disc list-inside text-default-600 text-sm">
                  <li>
                    전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는
                    기술적 방법을 사용하여 삭제합니다.
                  </li>
                  <li>
                    종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여
                    파기합니다.
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제9조 */}
        <Card id="article9">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제9조 (정보주체와 법정대리인의 권리·의무 및 그 행사방법)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나
                수정할 수 있으며 가입 해지(동의 철회)를 요청할 수도 있습니다.
              </li>
              <li className="text-default-700">
                개인정보 조회, 수정을 위해서는 &apos;내 계정&apos;(또는
                &apos;회원정보수정&apos; 등) 기능을 이용할 수 있으며, 가입
                해지(동의 철회)를 위해서는 &quot;회원탈퇴&quot; 기능을 이용하여
                본인 확인 절차를 거치신 후 직접 열람, 정정 또는 탈퇴가
                가능합니다.
              </li>
              <li className="text-default-700">
                혹은 개인정보보호책임자에게 서면, 전화 또는 이메일로 연락하시면
                지체 없이 조치하겠습니다.
              </li>
              <li className="text-default-700">
                이용자가 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을
                완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다.
                또한 잘못된 개인정보를 제3자에게 이미 제공한 경우에는 정정
                처리결과를 제3자에게 지체 없이 통지하여 정정이 이루어지도록
                하겠습니다.
              </li>
              <li className="text-default-700">
                회사는 이용자의 요청에 의해 해지 또는 삭제된 개인정보는
                &quot;제7조 (개인정보의 보유 및 이용기간)&quot;에 명시된 바에
                따라 처리하고 그 외의 용도로 열람 또는 이용할 수 없도록 처리하고
                있습니다.
              </li>
              <li className="text-default-700">
                만 14세 미만 아동의 개인정보는 수집하지 않으며, 필요한 경우
                법정대리인의 동의를 얻습니다. 만 14세 미만 아동의 법정대리인은
                아동의 개인정보의 열람, 정정, 동의철회를 요청할 수 있으며,
                이러한 요청이 있을 경우 회사는 지체 없이 필요한 조치를 취합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제10조 */}
        <Card id="article10">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제10조 (개인정보 자동 수집 장치의 설치·운영 및 그 거부에 관한
              사항)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를
              저장하고 수시로 불러오는 &apos;쿠키(cookie)&apos;를 사용합니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold mb-2">1. 쿠키의 사용 목적</p>
                <p className="text-default-600 text-sm">
                  회원과 비회원의 접속 빈도나 방문 시간 등을 분석, 이용자의
                  취향과 관심분야를 파악 및 자취 추적, 각종 이벤트 참여 정도 및
                  방문 횟수 파악 등을 통한 타겟 마케팅 및 개인 맞춤 서비스 제공
                </p>
              </div>
              <div className="pl-4 border-l-3 border-secondary">
                <p className="font-semibold mb-2">
                  2. 쿠키의 설치·운영 및 거부
                </p>
                <p className="text-default-600 text-sm mb-2">
                  이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서,
                  이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를
                  허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든
                  쿠키의 저장을 거부할 수도 있습니다.
                </p>
                <div className="bg-default-100 p-3 rounded-lg">
                  <p className="text-default-700 text-sm font-medium">
                    설정방법 예 (인터넷 익스플로어의 경우)
                  </p>
                  <p className="text-default-600 text-sm">
                    웹 브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 border border-warning-200 rounded-lg bg-warning-50">
              <p className="text-warning-700 text-sm">
                단, 쿠키 설치를 거부하였을 경우 서비스 제공에 어려움이 있을 수
                있습니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제11조 */}
        <Card id="article11">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제11조 (개인정보의 안전성 확보 조치)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 이용자들의 개인정보를 처리함에 있어 개인정보가 분실, 도난,
              유출, 변조 또는 훼손되지 않도록 안전성 확보를 위하여 다음과 같은
              기술적/관리적 대책을 강구하고 있습니다.
            </p>
            <div className="space-y-3">
              <div className="bg-success-50 p-4 rounded-lg">
                <FiShield className="text-success-700 text-2xl mb-2" />
                <p className="font-semibold text-success-700 mb-2">
                  1. 비밀번호 암호화
                </p>
                <p className="text-success-600 text-sm">
                  회원 아이디(ID)의 비밀번호는 암호화되어 저장 및 관리되고 있어
                  본인만이 알고 있으며, 개인정보의 확인 및 변경도 비밀번호를
                  알고 있는 본인에 의해서만 가능합니다.
                </p>
              </div>
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="font-semibold text-primary-700 mb-2">
                  2. 해킹 등에 대비한 대책
                </p>
                <p className="text-primary-600 text-sm">
                  회사는 해킹이나 컴퓨터 바이러스 등에 의해 회원의 개인정보가
                  유출되거나 훼손되는 것을 막기 위해 최선을 다하고 있습니다.
                  개인정보의 훼손에 대비해서 자료를 수시로 백업하고 있고, 최신
                  백신프로그램을 이용하여 이용자들의 개인정보나 자료가
                  유출되거나 손상되지 않도록 방지하고 있으며, 암호화 통신 등을
                  통하여 네트워크상에서 개인정보를 안전하게 전송할 수 있도록
                  하고 있습니다.
                </p>
              </div>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="font-semibold text-secondary-700 mb-2">
                  3. 처리 직원의 최소화 및 교육
                </p>
                <p className="text-secondary-600 text-sm">
                  회사의 개인정보관련 처리 직원은 담당자에 한정시키고 있고 이를
                  위한 별도의 비밀번호를 부여하여 정기적으로 갱신하고 있으며,
                  담당자에 대한 수시 교육을 통하여 개인정보 처리방침의 준수를
                  항상 강조하고 있습니다.
                </p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold text-default-700 mb-2">
                  4. 개인정보보호전담기구의 운영
                </p>
                <p className="text-default-600 text-sm">
                  사내 개인정보보호전담기구 등을 통하여 개인정보 처리방침의
                  이행사항 및 담당자의 준수 여부를 확인하여 문제가 발견될 경우
                  즉시 수정하고 바로잡을 수 있도록 노력하고 있습니다.
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 border border-danger-200 rounded-lg bg-danger-50">
              <p className="text-danger-700 text-sm">
                단, 이용자 본인의 부주의나 인터넷상의 문제로 ID, 비밀번호 등
                개인정보가 유출되어 발생한 문제에 대해 회사는 일체의 책임을 지지
                않습니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제12조 */}
        <Card id="article12">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제12조 (개인정보 보호책임자 및 담당부서 안내)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을
              처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를
              지정하고 있습니다.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <p className="font-semibold text-primary-700 mb-3">
                  개인정보 보호책임자
                </p>
                <div className="space-y-2 text-primary-600">
                  <p>
                    <strong>이름:</strong> [담당자 이름]
                  </p>
                  <p>
                    <strong>직책:</strong> [담당자 직책]
                  </p>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    <span>[전화번호]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <Link
                      color="primary"
                      href="mailto:allofadvertisements@gmail.com"
                      underline="hover"
                    >
                      allofadvertisements@gmail.com
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="font-semibold text-secondary-700 mb-3">
                  개인정보 보호 담당부서
                </p>
                <div className="space-y-2 text-secondary-600">
                  <p>
                    <strong>부서명:</strong> [담당 부서명]
                  </p>
                  <p>
                    <strong>담당자:</strong> [담당자 이름]
                  </p>
                  <div className="flex items-center gap-2">
                    <FiPhone className="w-4 h-4" />
                    <span>[전화번호]</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail className="w-4 h-4" />
                    <Link
                      color="secondary"
                      href="mailto:allofadvertisements@gmail.com"
                      underline="hover"
                    >
                      allofadvertisements@gmail.com
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-default-600 text-sm mt-4">
              귀하께서는 회사의 서비스를 이용하시면서 발생하는 모든 개인정보보호
              관련 민원을 개인정보보호책임자 혹은 담당부서로 신고하실 수
              있습니다. 회사는 이용자들의 신고사항에 대해 신속하게 충분한 답변을
              드릴 것입니다.
            </p>
          </CardBody>
        </Card>

        {/* 제13조 */}
        <Card id="article13">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제13조 (권익침해 구제방법)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-default-700 mb-4">
              기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래
              기관에 문의하시기 바랍니다.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold text-default-700 mb-2">
                  개인정보침해신고센터
                </p>
                <p className="text-default-600 text-sm">privacy.kisa.or.kr</p>
                <p className="text-default-600 text-sm">국번없이 118</p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold text-default-700 mb-2">
                  개인정보분쟁조정위원회
                </p>
                <p className="text-default-600 text-sm">kopico.go.kr</p>
                <p className="text-default-600 text-sm">1833-6972</p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold text-default-700 mb-2">
                  대검찰청 사이버수사과
                </p>
                <p className="text-default-600 text-sm">spo.go.kr</p>
                <p className="text-default-600 text-sm">국번없이 1301</p>
              </div>
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="font-semibold text-default-700 mb-2">
                  경찰청 사이버수사국
                </p>
                <p className="text-default-600 text-sm">ecrm.cyber.go.kr</p>
                <p className="text-default-600 text-sm">국번없이 182</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제14조 */}
        <Card id="article14">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제14조 (정책 변경에 관한 사항)
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700">
              이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
              변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일
              전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </CardBody>
        </Card>

        {/* 제15조 */}
        <Card id="article15">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제15조 (부칙)</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700">
              본 개인정보 처리방침은 2025년 1월 27일부터 시행됩니다.
            </p>
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
