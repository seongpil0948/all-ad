"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { Link } from "@heroui/link";
import { FiFileText, FiMail } from "react-icons/fi";

export default function TermsOfServiceContent() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-default-900">
          Sivera 서비스 이용약관
        </h1>
        <Chip
          className="font-medium"
          color="primary"
          size="lg"
          startContent={<FiFileText className="w-4 h-4" />}
          variant="flat"
        >
          회원가입 시 필수 동의 사항
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
                제3조 (약관의 명시와 개정)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article4"
              >
                제4조 (회원가입)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article5"
              >
                제5조 (회원 정보의 변경)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article6"
              >
                제6조 (회원의 아이디 및 비밀번호 관리에 대한 의무)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article7"
              >
                제7조 (회원에 대한 통지)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article8"
              >
                제8조 (서비스의 제공 및 변경)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article9"
              >
                제9조 (광고 플랫폼 계정 연동 및 데이터)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article10"
              >
                제10조 (회원의 의무)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article11"
              >
                제11조 (회사의 의무)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article12"
              >
                제12조 (유료 서비스 및 결제)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article13"
              >
                제13조 (서비스 장애 및 중단 시 보상)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article14"
              >
                제14조 (서비스 이용 제한 및 회원 자격 상실)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article15"
              >
                제15조 (계약 해지)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article16"
              >
                제16조 (면책조항)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article17"
              >
                제17조 (게시물의 저작권 및 관리)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article18"
              >
                제18조 (지식재산권의 귀속)
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary transition-colors"
                href="#article19"
              >
                제19조 (분쟁 해결)
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
              본 약관은 주식회사 시베라(이하 &quot;회사&quot;라 합니다)가
              제공하는 All-AD 서비스 및 관련 제반 서비스(이하
              &quot;서비스&quot;라 합니다)의 이용과 관련하여 회사와 회원 간의
              권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
              합니다.
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
              본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
            </p>
            <div className="space-y-3">
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;서비스&quot;</p>
                <p className="text-default-600 text-sm">
                  회사가 제공하는 Sivera 웹사이트 및 관련 애플리케이션을 통해
                  광고 플랫폼 데이터 통합, 대시보드, 리포팅, 광고 캠페인 관리
                  보조 기능 등 광고 운영 효율화를 위해 제공하는 모든 기능을
                  의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;회원&quot;</p>
                <p className="text-default-600 text-sm">
                  본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는
                  서비스를 이용하는 개인 또는 법인을 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;아이디(ID)&quot;</p>
                <p className="text-default-600 text-sm">
                  회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가
                  승인하는 이메일 주소를 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;비밀번호&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 부여 받은 아이디와 일치되는 회원임을 확인하고
                  비밀보호를 위해 회원 자신이 정한 문자 또는 숫자의 조합을
                  의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-warning">
                <p className="font-semibold">&quot;광고 플랫폼 데이터&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 서비스 이용을 위해 연동한 외부 광고 플랫폼(예: 구글
                  애즈, 메타 애즈 등)으로부터 수집되는 광고 계정 정보, 캠페인
                  정보, 광고 성과 데이터 등을 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;유료 서비스&quot;</p>
                <p className="text-default-600 text-sm">
                  회사가 유료로 제공하는 각종 온라인 디지털 콘텐츠 및 제반
                  서비스를 의미합니다.
                </p>
              </div>
              <div className="pl-4 border-l-3 border-primary">
                <p className="font-semibold">&quot;게시물&quot;</p>
                <p className="text-default-600 text-sm">
                  회원이 서비스를 이용함에 있어 서비스상에 게시한
                  부호·문자·음성·음향·화상·동영상 등의 정보 형태의 글, 사진,
                  동영상 및 각종 파일과 링크 등을 의미합니다.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제3조 */}
        <Card id="article3">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제3조 (약관의 명시와 개정)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기
                화면 또는 연결화면에 게시합니다.
              </li>
              <li className="text-default-700">
                회사는 &quot;약관의 규제에 관한 법률&quot;, &quot;정보통신망
                이용촉진 및 정보보호 등에 관한 법률(이하
                &quot;정보통신망법&quot;)&quot; 등 관련법을 위배하지 않는
                범위에서 본 약관을 개정할 수 있습니다.
              </li>
              <li className="text-default-700">
                회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여
                현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일
                전부터 적용일자 전일까지 공지합니다. 다만, 회원에게 불리한
                약관의 개정의 경우에는 최소한 30일 이상의 사전 유예기간을 두고
                공지하며, 이메일 발송 등 개별적으로 명확히 통지하도록 합니다.
              </li>
              <li className="text-default-700">
                회사가 전항에 따라 개정약관을 공지 또는 통지하면서 회원에게 일정
                기간 내에 의사표시를 하지 않으면 의사표시가 표명된 것으로 본다는
                뜻을 명확하게 공지 또는 통지하였음에도 회원이 명시적으로 거부의
                의사표시를 하지 아니한 경우 회원이 개정약관에 동의한 것으로
                봅니다.
              </li>
              <li className="text-default-700">
                회원이 개정약관의 적용에 동의하지 않는 경우 회사는 개정 약관의
                내용을 적용할 수 없으며, 이 경우 회원은 이용계약을 해지할 수
                있습니다. 기존 약관을 적용할 수 없는 특별한 사정이 있는 경우에는
                회사도 이용계약을 해지할 수 있습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제4조 */}
        <Card id="article4">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제4조 (회원가입)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원가입은 서비스를 이용하려는 자(이하 &quot;가입신청자&quot;라
                합니다)가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을
                하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.
              </li>
              <li className="text-default-700">
                회사는 가입신청자의 신청에 대하여 서비스 이용을 승낙함을
                원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에
                대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수
                있습니다.
                <ul className="mt-2 ml-6 space-y-1 list-disc">
                  <li>
                    가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이
                    있는 경우 (단, 회사의 회원 재가입 승낙을 얻은 경우는 예외)
                  </li>
                  <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                  <li>
                    허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지
                    않은 경우
                  </li>
                  <li>
                    만 14세 미만 아동이 법정대리인의 동의를 얻지 아니한 경우
                  </li>
                  <li>
                    가입신청자의 귀책사유로 인하여 승인이 불가능하거나 기타
                    규정한 제반 사항을 위반하며 신청하는 경우
                  </li>
                </ul>
              </li>
              <li className="text-default-700">
                제1항에 따른 신청에 있어 회사는 회원의 종류에 따라 전문기관을
                통한 실명확인 및 본인인증을 요청할 수 있습니다.
              </li>
              <li className="text-default-700">
                회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한
                시점으로 합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제5조 */}
        <Card id="article5">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제5조 (회원 정보의 변경)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를
                열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한
                아이디(이메일 주소) 등은 수정이 불가능할 수 있습니다.
              </li>
              <li className="text-default-700">
                회원은 회원가입신청 시 기재한 사항이 변경되었을 경우 온라인으로
                수정을 하거나 전자우편 기타 방법으로 회사에 대하여 그 변경사항을
                알려야 합니다.
              </li>
              <li className="text-default-700">
                제2항의 변경사항을 회사에 알리지 않아 발생한 불이익에 대하여
                회사는 책임지지 않습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제6조 */}
        <Card id="article6">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제6조 (회원의 아이디 및 비밀번호 관리에 대한 의무)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원의 아이디와 비밀번호에 관한 관리책임은 회원에게 있으며, 이를
                제3자가 이용하도록 하여서는 안 됩니다.
              </li>
              <li className="text-default-700">
                회사는 회원의 아이디가 개인정보 유출 우려가 있거나,
                반사회적이거나 미풍양속에 어긋나거나 회사 및 회사의 운영자로
                오인할 우려가 있는 경우, 해당 아이디의 이용을 제한할 수
                있습니다.
              </li>
              <li className="text-default-700">
                회원은 아이디 및 비밀번호가 도용되거나 제3자가 사용하고 있음을
                인지한 경우에는 이를 즉시 회사에 통지하고 회사의 안내에 따라야
                합니다.
              </li>
              <li className="text-default-700">
                제3항의 경우에 해당 회원이 회사에 그 사실을 통지하지 않거나,
                통지한 경우에도 회사의 안내에 따르지 않아 발생한 불이익에 대하여
                회사는 책임지지 않습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제7조 */}
        <Card id="article7">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제7조 (회원에 대한 통지)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사가 회원에 대한 통지를 하는 경우 본 약관에 별도 규정이 없는
                한 회원이 지정한 이메일 주소, 서비스 내 알림 등으로 할 수
                있습니다.
              </li>
              <li className="text-default-700">
                회사는 회원 전체에 대한 통지의 경우 7일 이상 서비스 공지사항에
                게시함으로써 제1항의 통지에 갈음할 수 있습니다. 다만, 회원
                본인의 거래와 관련하여 중대한 영향을 미치는 사항에 대하여는
                개별통지를 합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제8조 */}
        <Card id="article8">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제8조 (서비스의 제공 및 변경)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-2">
                  1. 회사는 회원에게 다음과 같은 서비스를 제공합니다.
                </p>
                <ul className="ml-4 space-y-1 list-disc text-default-600">
                  <li>다수 광고 플랫폼 데이터 통합 및 자동 수집 서비스</li>
                  <li>통합 광고 성과 대시보드 제공 서비스</li>
                  <li>통합 리포팅 및 분석 서비스</li>
                  <li>
                    광고 캠페인 ON/OFF 등 관리 보조 기능 서비스 (단계적 제공)
                  </li>
                  <li>AI 기반 성과 분석 및 제안 서비스 (향후 제공 예정)</li>
                  <li>광고 운영 자동화 서비스 (향후 제공 예정)</li>
                  <li>
                    기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해
                    회원에게 제공하는 일체의 서비스
                  </li>
                </ul>
              </div>
              <p className="text-default-700">
                2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.
              </p>
              <p className="text-default-700">
                3. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장,
                통신두절 또는 운영상 상당한 이유가 있는 경우 서비스의 제공을
                일시적으로 중단할 수 있습니다. 이 경우 회사는 제7조(회원에 대한
                통지)에 정한 방법으로 회원에게 통지합니다. 다만, 회사가 사전에
                통지할 수 없는 부득이한 사유가 있는 경우 사후에 통지할 수
                있습니다.
              </p>
              <p className="text-default-700">
                4. 회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수
                있으며, 정기점검시간은 서비스제공화면에 공지한 바에 따릅니다.
              </p>
              <p className="text-default-700">
                5. 회사는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라
                제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.
              </p>
              <p className="text-default-700">
                6. 서비스의 내용, 이용방법, 이용시간에 대하여 변경이 있는
                경우에는 변경사유, 변경될 서비스의 내용 및 제공일자 등은 그 변경
                전에 해당 서비스 초기화면에 게시하여야 합니다.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* 제9조 */}
        <Card id="article9">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제9조 (광고 플랫폼 계정 연동 및 데이터)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-warning-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-warning-700">중요 사항</p>
              <p className="text-warning-600 text-sm">
                광고 플랫폼 연동은 서비스의 핵심 기능이며, 연동 시 환불이 제한될
                수 있습니다.
              </p>
            </div>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원은 서비스를 이용하기 위해 자신의 광고 플랫폼 계정 정보를
                회사에 제공하고 연동하는 것에 동의해야 합니다.
              </li>
              <li className="text-default-700">
                회원은 연동하려는 광고 플랫폼 계정에 대한 정당한 접근 권한을
                보유하고 있어야 하며, 이를 위반하여 발생하는 모든 책임은
                회원에게 있습니다.
              </li>
              <li className="text-default-700">
                회사는 회원이 연동한 광고 플랫폼으로부터 광고 플랫폼 데이터를
                수집, 저장, 처리하여 서비스 제공 목적으로만 사용합니다. 데이터의
                수집 및 이용에 관한 자세한 사항은 &quot;개인정보
                처리방침&quot;을 따릅니다.
              </li>
              <li className="text-default-700">
                회사는 광고 플랫폼 API를 통해 데이터를 수집하며, 해당 플랫폼의
                정책 변경, API 오류, 또는 회원의 계정 상태 변경 등으로 인해
                데이터 수집이 원활하지 않거나 일부 데이터의 정확성에 차이가
                발생할 수 있습니다.
              </li>
              <li className="text-default-700">
                회사는 데이터의 완전한 무결성이나 실시간성을 보장하지 않으며,
                이로 인해 발생하는 회원의 손해에 대해 회사의 고의 또는 중과실이
                없는 한 책임을 지지 않습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제10조 */}
        <Card id="article10">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제10조 (회원의 의무)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원은 관계법, 본 약관의 규정, 이용안내 및 서비스와 관련하여
                공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타
                회사의 업무에 방해되는 행위를 하여서는 안 됩니다.
              </li>
              <li className="text-default-700">
                회원은 서비스를 통해 접근하거나 연동하는 모든 외부 광고
                플랫폼(예: 구글 애즈, 메타 애즈 등)의 이용약관, 운영 정책, API
                사용 규정 및 기타 관련 지침을 숙지하고 이를 준수해야 합니다.
                회원이 해당 플랫폼의 규정을 위반하여 발생하는 모든 법적 책임과
                불이익은 회원 본인에게 있으며, 이로 인해 회사에 손해가 발생하는
                경우 회원은 그 손해를 배상할 책임이 있습니다.
              </li>
              <li className="text-default-700">
                회원은 다음 각 호의 행위를 하여서는 안 됩니다.
                <ul className="mt-2 ml-6 space-y-1 list-disc">
                  <li>신청 또는 변경 시 허위내용의 등록</li>
                  <li>타인의 정보도용</li>
                  <li>회사가 게시한 정보의 변경</li>
                  <li>
                    회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신
                    또는 게시
                  </li>
                  <li>회사 및 기타 제3자의 저작권 등 지식재산권에 대한 침해</li>
                  <li>
                    회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는
                    행위
                  </li>
                  <li>
                    외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에
                    반하는 정보를 서비스에 공개 또는 게시하는 행위
                  </li>
                  <li>
                    회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위
                  </li>
                  <li>
                    서비스의 안정적인 운영을 방해할 목적으로 다량의 정보를
                    전송하거나 광고성 정보를 전송하는 행위
                  </li>
                  <li>
                    정보통신설비의 오작동이나 정보 등의 파괴를 유발시키는 컴퓨터
                    바이러스 프로그램 등을 유포하는 행위
                  </li>
                  <li>기타 불법적이거나 부당한 행위</li>
                </ul>
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제11조 */}
        <Card id="article11">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제11조 (회사의 의무)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사는 관련법과 본 약관이 금지하거나 미풍양속에 반하는 행위를
                하지 않으며, 계속적이고 안정적으로 서비스를 제공하기 위하여
                최선을 다하여 노력합니다.
              </li>
              <li className="text-default-700">
                회사는 회원이 안전하게 서비스를 이용할 수 있도록
                개인정보(신용정보 포함)보호를 위해 보안시스템을 갖추어야 하며
                개인정보 처리방침을 공시하고 준수합니다.
              </li>
              <li className="text-default-700">
                회사는 서비스이용과 관련하여 회원으로부터 제기된 의견이나 불만이
                정당하다고 인정할 경우에는 이를 처리하여야 합니다. 회원이 제기한
                의견이나 불만사항에 대해서는 게시판을 활용하거나 전자우편 등을
                통하여 회원에게 처리과정 및 결과를 전달합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제12조 */}
        <Card id="article12">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제12조 (유료 서비스 및 결제 - 향후 유료 플랜 도입 시 적용)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="bg-primary-50 p-4 rounded-lg mb-4">
              <p className="font-semibold text-primary-700">향후 적용 예정</p>
              <p className="text-primary-600 text-sm">
                현재 서비스는 무료로 제공되며, 향후 유료 플랜 도입 시 본 조항이
                적용됩니다.
              </p>
            </div>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사는 유료 서비스의 종류, 내용, 가격, 이용기간 등을 서비스
                화면에 게시합니다.
              </li>
              <li className="text-default-700">
                회원이 유료 서비스를 이용하고자 하는 경우, 회사가 정한 결제
                수단을 통해 요금을 납부해야 합니다.
              </li>
              <li className="text-default-700">
                결제와 관련한 사항은 각 결제수단 제공업체의 정책을 따르며, 이와
                관련하여 발생하는 문제에 대해 회사는 회사의 고의 또는 중과실이
                없는 한 책임을 지지 않습니다.
              </li>
              <li className="text-default-700">
                회사는 요금 정책을 변경할 수 있으며, 변경 시 제3조(약관의 명시와
                개정)의 규정에 따라 공지합니다.
              </li>
              <li className="text-default-700">
                청약철회 및 환불 규정은 별도로 정하는 &quot;Sivera 서비스
                청약철회 및 환불 규정&quot; 문서에 따르며, 해당 문서는 서비스
                화면에 게시하거나 링크를 통해 제공합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제13조 */}
        <Card id="article13">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제13조 (서비스 장애 및 중단 시 보상)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="font-semibold mb-2">
                  1. 본 조에서 사용하는 용어의 정의는 다음과 같습니다.
                </p>
                <ul className="ml-4 space-y-1 list-disc text-default-600">
                  <li>
                    &quot;서비스 중단&quot;이라 함은 회사의 귀책사유로 인해 유료
                    서비스의 핵심 기능을 회원이 연속적으로 이용하지 못하는
                    상태를 의미합니다.
                  </li>
                  <li>
                    &quot;서비스 크레딧&quot;이라 함은 본 조에 따라 회원에게
                    제공되는 보상의 한 형태로, 다음 결제 시 이용 요금에서
                    차감되거나 서비스 이용 기간이 연장되는 등의 방식을
                    의미합니다.
                  </li>
                </ul>
              </div>
              <p className="text-default-700">
                2. 본 조는 회사가 제공하는 유료 서비스 요금제를 이용 중인
                회원에게 적용됩니다. 무료로 제공되는 서비스에는 본 조가 적용되지
                않을 수 있습니다.
              </p>
              <p className="text-default-700">
                3. 회사는 회사의 귀책사유로 인해 발생한 서비스 중단 시간이 다음
                각 목의 기준을 초과하는 경우 본 조에 따라 회원에게 보상을
                제공합니다.
              </p>
              <p className="text-default-700">
                4. 보상 내용은 다음 각 목 중 하나 또는 회사가 별도로 정하는
                방식으로 제공될 수 있으며, 중복 적용되지 않고 회원에게 유리한
                조건 하나만 적용됩니다.
              </p>
              <div>
                <p className="font-semibold mb-2">
                  5. 다음 각 호의 사유로 인해 서비스 이용이 불가능한 경우에는 본
                  조에 따른 보상 대상에서 제외됩니다.
                </p>
                <ul className="ml-4 space-y-1 list-disc text-default-600">
                  <li>
                    사전에 공지된 정기점검 또는 긴급점검으로 서비스가 일시
                    중단된 경우
                  </li>
                  <li>
                    천재지변, 전쟁, 국가비상사태 등 불가항력으로 인해 서비스가
                    중단된 경우
                  </li>
                  <li>
                    회원이 연동한 외부 광고 플랫폼 API 자체의 장애, 오류, 점검
                    등으로 인해 서비스 기능이 제한되거나 중단된 경우
                  </li>
                  <li>
                    회원의 인터넷 접속 환경 또는 단말기 문제로 인해 서비스
                    이용이 원활하지 않은 경우
                  </li>
                  <li>
                    회원이 본 약관 또는 관련 법령을 위반하여 서비스 이용이
                    제한되거나 중단된 경우
                  </li>
                  <li>기타 회사의 직접적인 귀책사유로 보기 어려운 경우</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* 제14조 */}
        <Card id="article14">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제14조 (서비스 이용 제한 및 회원 자격 상실)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을
                방해한 경우, 회사는 경고, 일시정지, 영구이용정지 등으로 서비스
                이용을 단계적으로 제한할 수 있습니다.
              </li>
              <li className="text-default-700">
                회사는 다음 각 호에 해당하는 경우 사전통보 없이 이용계약을
                해지하거나 회원 자격을 상실시킬 수 있습니다.
                <ul className="mt-2 ml-6 space-y-1 list-disc">
                  <li>제4조 제2항의 회원가입 거절 사유가 확인된 경우</li>
                  <li>
                    다른 회원의 권리나 명예, 신용 기타 정당한 이익을 침해하거나
                    대한민국 법질서에 위배되는 행위를 한 경우
                  </li>
                  <li>서비스 운영을 고의로 방해한 경우</li>
                  <li>
                    본 약관이 금지하는 행위를 반복하거나, 1년 이상 장기간 휴면
                    회원인 경우
                  </li>
                  <li>
                    (유료 서비스의 경우) 이용요금을 정해진 기간 내에 납부하지
                    아니한 경우
                  </li>
                </ul>
              </li>
              <li className="text-default-700">
                본 조에 따라 서비스 이용을 제한하거나 계약을 해지하는 경우에는
                회사는 제7조 (회원에 대한 통지)에 따라 통지합니다.
              </li>
              <li className="text-default-700">
                회원은 본 조에 따른 이용제한 등에 대해 회사가 정한 절차에 따라
                이의신청을 할 수 있습니다. 이 때 이의가 정당하다고 회사가
                인정하는 경우 회사는 즉시 서비스의 이용을 재개합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제15조 */}
        <Card id="article15">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제15조 (계약 해지)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원은 언제든지 서비스 내 계정 관리 메뉴 또는 고객센터를 통하여
                이용계약 해지 신청(회원탈퇴)을 할 수 있으며, 회사는 관련법 등이
                정하는 바에 따라 이를 즉시 처리하여야 합니다.
              </li>
              <li className="text-default-700">
                회원이 계약을 해지할 경우, 관련법 및 개인정보 처리방침에 따라
                회사가 회원정보를 보유하는 경우를 제외하고는 해지 즉시 회원의
                모든 데이터는 소멸됩니다. 다만, 연동된 광고 플랫폼의 데이터는
                해당 플랫폼의 정책에 따릅니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제16조 */}
        <Card id="article16">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제16조 (면책조항)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
              </li>
              <li className="text-default-700">
                회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는
                책임을 지지 않습니다.
              </li>
              <li className="text-default-700">
                회사는 회원이 서비스를 이용하여 기대하는 수익을 얻지 못하거나
                상실한 것에 대하여 책임을 지지 않으며, 그 밖에 서비스를 통하여
                얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
              </li>
              <li className="text-default-700">
                회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의
                신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.
              </li>
              <li className="text-default-700">
                회사는 회원 간 또는 회원과 제3자 상호간에 서비스를 매개로 하여
                거래 등을 한 경우에는 책임이 면제됩니다.
              </li>
              <li className="text-default-700">
                회사는 광고 플랫폼 자체의 API 변경, 오류, 서비스 중단 등으로
                인해 발생하는 서비스의 일시적 중단이나 데이터 오류에 대해서는
                회사의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
              </li>
              <li className="text-default-700">
                회사는 무료로 제공되는 서비스 이용과 관련하여 관련법에 특별한
                규정이 없는 한 책임을 지지 않습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제17조 */}
        <Card id="article17">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제17조 (게시물의 저작권 및 관리 - 서비스 내 게시 기능이 있을 경우
              적용)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의
                저작자에게 귀속됩니다.
              </li>
              <li className="text-default-700">
                회원이 서비스 내에 게시하는 게시물은 검색결과 내지 서비스 및
                관련 프로모션 등에 노출될 수 있으며, 해당 노출을 위해 필요한
                범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다. 이
                경우, 회사는 저작권법 규정을 준수하며, 회원은 언제든지 고객센터
                또는 서비스 내 관리기능을 통해 해당 게시물에 대해 삭제, 검색결과
                제외, 비공개 등의 조치를 취할 수 있습니다.
              </li>
              <li className="text-default-700">
                회사는 회원의 게시물이 정보통신망법 및 저작권법 등 관련법에
                위반되는 내용을 포함하거나, 타인의 권리를 침해하거나, 약관에
                위배되거나, 음란하거나 과도하게 폭력적인 내용 등 공서양속에
                반하는 경우, 해당 게시물에 대해 사전통지 없이 삭제 또는 임시조치
                등을 취할 수 있습니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제18조 */}
        <Card id="article18">
          <CardHeader>
            <h2 className="text-2xl font-semibold">
              제18조 (지식재산권의 귀속)
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                서비스에 대한 저작권 및 지식재산권은 회사에 귀속됩니다.
              </li>
              <li className="text-default-700">
                회원은 회사가 제공하는 서비스를 이용함으로써 얻은 정보 중
                회사에게 지식재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제,
                송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로
                이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 제19조 */}
        <Card id="article19">
          <CardHeader>
            <h2 className="text-2xl font-semibold">제19조 (분쟁 해결)</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-default-700">
                회사와 회원은 서비스 이용과 관련하여 발생한 분쟁을 원만하게
                해결하기 위하여 필요한 모든 노력을 하여야 합니다.
              </li>
              <li className="text-default-700">
                전항의 노력에도 불구하고 분쟁이 해결되지 않아 소송이 제기되는
                경우, 회사의 본사 소재지를 관할하는 법원을 전속적 합의관할
                법원으로 합니다.
              </li>
              <li className="text-default-700">
                회사와 회원간에 제기된 소송에는 대한민국 법을 적용합니다.
              </li>
            </ol>
          </CardBody>
        </Card>

        {/* 부칙 */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">부칙</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-700">
              본 약관은 2025년 1월 27일부터 시행됩니다.
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-8 space-y-4">
        <div className="bg-default-100 p-4 rounded-lg space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FiMail className="text-primary" />
            <Link
              color="primary"
              href="mailto:allofadvertisements@gmail.com"
              underline="hover"
            >
              allofadvertisements@gmail.com
            </Link>
          </div>
        </div>
        <p className="text-default-500 text-sm">
          © 2025 주식회사 시베라. All rights reserved.
        </p>
      </div>
    </div>
  );
}
