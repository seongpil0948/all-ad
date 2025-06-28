"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { FaChartLine, FaRocket, FaShieldAlt, FaDatabase } from "react-icons/fa";

import { PageHeader } from "@/components/common/PageHeader";
import { useDictionary } from "@/hooks/use-dictionary";

const iconMap = {
  FaChartLine,
  FaRocket,
  FaShieldAlt,
  FaDatabase,
} as const;

export function FeaturesSection() {
  const { dictionary: dict } = useDictionary();

  const features = [
    {
      icon: "FaChartLine" as keyof typeof iconMap,
      title: dict.home.features.dashboard?.title || "Unified Dashboard",
      description:
        (dict.home.features.dashboard as { description?: string })
          ?.description || "Manage all your campaigns in one place",
    },
    {
      icon: "FaRocket" as keyof typeof iconMap,
      title: dict.home.features.automation.title,
      description: dict.home.features.automation.description,
    },
    {
      icon: "FaShieldAlt" as keyof typeof iconMap,
      title: dict.home.features.security.title,
      description: dict.home.features.security.description,
    },
    {
      icon: "FaDatabase" as keyof typeof iconMap,
      title: dict.home.features.integration.title,
      description: dict.home.features.integration.description,
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          centered
          pageSubtitle={dict.home.features.subtitle}
          pageTitle={dict.home.features.title}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon];

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
