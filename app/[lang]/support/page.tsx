import { Card, CardBody, CardHeader } from "@heroui/card";
import { Link } from "@heroui/link";
import { FaEnvelope, FaPhone, FaQuestionCircle, FaBook } from "react-icons/fa";

import { title, subtitle } from "@/components/primitives";
import { Container } from "@/components/layouts/Container";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supportOptions = [
    {
      icon: <FaBook className="w-8 h-8" />,
      title: dict.support.cards.docs.title,
      description: dict.support.cards.docs.description,
      link: "/docs",
      linkText: dict.support.cards.docs.linkText,
    },
    {
      icon: <FaQuestionCircle className="w-8 h-8" />,
      title: dict.support.cards.faq.title,
      description: dict.support.cards.faq.description,
      link: "/faq",
      linkText: dict.support.cards.faq.linkText,
    },
    {
      icon: <FaEnvelope className="w-8 h-8" />,
      title: dict.support.cards.email.title,
      description: dict.support.cards.email.description,
      link: "mailto:support@sivera.co.kr",
      linkText: dict.support.cards.email.linkText,
      isExternal: true,
    },
    {
      icon: <FaPhone className="w-8 h-8" />,
      title: dict.support.cards.phone.title,
      description: dict.support.cards.phone.description,
      link: "tel:02-1234-5678",
      linkText: dict.support.cards.phone.linkText,
      isExternal: true,
    },
  ];

  return (
    <Container className="py-20">
      <div className="text-center mb-12">
        <h1 className={title({ size: "lg" })}>{dict.support.title}</h1>
        <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
          {dict.support.subtitle}
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
            <h3 className="text-xl font-semibold mb-2">
              {dict.support.enterprise.title}
            </h3>
            <p className="text-default-500 mb-4">
              {dict.support.enterprise.description}
            </p>
            <Link href="/contact" size="lg">
              {dict.support.enterprise.cta}
            </Link>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
