import { Card, CardBody } from "@heroui/card";

import { getDictionary, type Locale } from "../dictionaries";

import { title, subtitle } from "@/components/primitives";
import {
  StatsSection,
  TestimonialsSection,
  // IntegrationProcessSection,
  FAQSection,
  DashboardPreview,
  AnimatedBackground,
  PricingSection,
  FeaturesSection,
  PlatformsSection,
  HeroButtons,
} from "@/components/home";
import { PageHeader } from "@/components/common";
import { CTAButton } from "@/components/common/CTAButton";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div>
            <h1 className={title({ size: "lg" })}>{dict.home.hero.title}</h1>
            <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
              {dict.home.hero.subtitle}
            </p>
          </div>

          <div className="mt-8">
            <HeroButtons
              primaryButtonText={dict.pricing.cta.startFreeTrial}
              secondaryButtonText={dict.nav.demo}
            />
          </div>
        </div>

        {/* Animated background */}
        <AnimatedBackground />
      </section>

      {/* Features Section - Server Component */}
      <FeaturesSection />

      {/* Supported Platforms - Server Component */}
      <PlatformsSection />

      {/* Statistics Section */}
      <StatsSection />

      {/* Integration Process Section */}
      {/* <IntegrationProcessSection /> */}

      {/* Dashboard Preview */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            centered
            pageSubtitle={dict.home.platforms.visualization.subtitle}
            pageTitle={dict.home.platforms.visualization.title}
          />

          <div className="relative mt-12">
            <Card className="overflow-hidden shadow-xl">
              <CardBody className="p-0">
                <DashboardPreview />
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* CTA Section */}
      <section className="px-6 py-20 bg-linear-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {dict.home.hero.cta}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {dict.home.hero.subCta}
            </p>
            <CTAButton
              action="start-trial"
              className="bg-white text-primary font-semibold"
              path="/login"
              text={dict.pricing.cta.startFreeTrial}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
