import { Card, CardBody, CardHeader } from "@heroui/card";

import { FEATURES, SECTION_TITLES } from "@/constants/home";
import { PageHeader } from "@/components/common/PageHeader";

export function FeaturesSection() {
  return (
    <section className="px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          centered
          pageSubtitle={SECTION_TITLES.FEATURES.subtitle}
          pageTitle={SECTION_TITLES.FEATURES.title}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Card
                key={index}
                className="h-full hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-0 pt-6">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit">
                    <Icon className="w-8 h-8" />
                  </div>
                </CardHeader>
                <CardBody>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-default-500">{feature.description}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
