import { Card, CardBody } from "@heroui/card";

import { title, subtitle } from "@/components/primitives";
import {
  StatsSection,
  TestimonialsSection,
  IntegrationProcessSection,
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
import { CTA_TEXTS, SECTION_TITLES } from "@/constants/home";

export default function Home() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 lg:py-32">
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div>
            <h1 className={title({ size: "lg" })}>
              {CTA_TEXTS.MAIN_TITLE}{" "}
              <span className={title({ color: "violet", size: "lg" })}>
                {CTA_TEXTS.MAIN_TITLE_HIGHLIGHT}
              </span>
            </h1>
            <p className={subtitle({ class: "mt-4 max-w-2xl mx-auto" })}>
              {CTA_TEXTS.MAIN_SUBTITLE}
            </p>
          </div>

          <div className="mt-8">
            <HeroButtons
              primaryButtonText={CTA_TEXTS.CTA_PRIMARY}
              secondaryButtonText={CTA_TEXTS.CTA_SECONDARY}
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
      <IntegrationProcessSection />

      {/* Dashboard Preview */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            centered
            pageSubtitle={SECTION_TITLES.DASHBOARD.subtitle}
            pageTitle={SECTION_TITLES.DASHBOARD.title}
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
      <section className="px-6 py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              {CTA_TEXTS.CTA_SECTION_TITLE}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {CTA_TEXTS.CTA_SECTION_SUBTITLE}
            </p>
            <CTAButton
              action="start-trial"
              className="bg-white text-primary font-semibold"
              path="/login"
              text={CTA_TEXTS.CTA_SECTION_BUTTON}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
