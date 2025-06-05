import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { FaEnvelope, FaPhone, FaQuestionCircle, FaBook } from "react-icons/fa";

import { title, subtitle } from "@/components/primitives";

export default function SupportPage() {
  const supportOptions = [
    {
      icon: <FaBook className="w-8 h-8" />,
      title: "문서",
      description: "사용 가이드와 API 문서를 확인하세요",
      link: "/docs",
      linkText: "문서 보기",
    },
    {
      icon: <FaQuestionCircle className="w-8 h-8" />,
      title: "FAQ",
      description: "자주 묻는 질문과 답변을 확인하세요",
      link: "/faq",
      linkText: "FAQ 보기",
    },
    {
      icon: <FaEnvelope className="w-8 h-8" />,
      title: "이메일 지원",
      description: "support@all-ad.co.kr로 문의해주세요",
      link: "mailto:support@all-ad.co.kr",
      linkText: "이메일 보내기",
      isExternal: true,
    },
    {
      icon: <FaPhone className="w-8 h-8" />,
      title: "전화 지원",
      description: "평일 09:00-18:00 운영",
      link: "tel:02-1234-5678",
      linkText: "02-1234-5678",
      isExternal: true,
    },
  ];

  return (
    <div className="container mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h1 className={title({ size: "lg" })}>고객 지원</h1>
        <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
          궁금한 점이 있으신가요? 다양한 방법으로 도움을 받으실 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {supportOptions.map((option, index) => (
          <div key={index}>
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-0 pt-6">
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                  {option.icon}
                </div>
                <h3 className="text-xl font-semibold">{option.title}</h3>
              </CardHeader>
              <CardBody>
                <p className="text-default-500 mb-4">{option.description}</p>
                <Link
                  href={option.link}
                  isExternal={option.isExternal}
                  showAnchorIcon={option.isExternal}
                >
                  {option.linkText}
                </Link>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardBody className="text-center py-8">
            <h3 className="text-xl font-semibold mb-2">엔터프라이즈 고객</h3>
            <p className="text-default-500 mb-4">
              대규모 배포나 맞춤형 솔루션이 필요하신가요?
            </p>
            <Link href="/contact" size="lg">
              영업팀 문의하기
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
