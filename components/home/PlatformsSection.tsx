import { PLATFORMS, SECTION_TITLES } from "@/constants/home";
import { PageHeader } from "@/components/common/PageHeader";

export function PlatformsSection() {
  return (
    <section className="px-6 py-20 bg-default-50">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          centered
          pageSubtitle={SECTION_TITLES.PLATFORMS.subtitle}
          pageTitle={SECTION_TITLES.PLATFORMS.title}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {PLATFORMS.map((platform, index) => {
            const Icon = platform.icon;

            return (
              <div
                key={index}
                className="flex flex-col items-center p-6 bg-white dark:bg-default-100 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className={`text-5xl mb-3 ${platform.color}`}>
                  <Icon />
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
