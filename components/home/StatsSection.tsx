/* eslint-disable local/no-literal-strings */
import { FaChartLine, FaUsers, FaBullseye, FaClock } from "react-icons/fa";
import { Container } from "@/components/layouts/Container";
import { AutoGrid } from "@/components/common/AutoGrid";

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  suffix?: string;
}

const StatItem = ({ icon, value, label, suffix = "" }: StatItemProps) => {
  return (
    <div className="text-center transform transition-transform duration-300 hover:scale-105">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-primary">
        {icon}
      </div>
      <div className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
        {value}
        {suffix && <span className="text-2xl lg:text-3xl">{suffix}</span>}
      </div>
      <p className="text-default-500">{label}</p>
    </div>
  );
};

export const StatsSection = () => {
  const stats = [
    {
      icon: <FaChartLine className="w-full h-full" />,
      value: "42",
      suffix: "%",
      label: "평균 ROI 증가",
    },
    {
      icon: <FaUsers className="w-full h-full" />,
      value: "1,200",
      suffix: "+",
      label: "활성 사용자",
    },
    {
      icon: <FaBullseye className="w-full h-full" />,
      value: "85",
      suffix: "%",
      label: "캠페인 성공률",
    },
    {
      icon: <FaClock className="w-full h-full" />,
      value: "24/7",
      label: "실시간 모니터링",
    },
  ];

  return (
    <section className="py-20 bg-linear-to-br from-primary/5 to-secondary/5">
      <Container>
        <AutoGrid minItemWidth={220} gap="gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </AutoGrid>
      </Container>
    </section>
  );
};
