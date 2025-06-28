import { Button } from "@heroui/button";
import Link from "next/link";

interface PricingButtonProps {
  planName: string;
  cta: string;
  isPopular: boolean;
}

export default function PricingButton({
  planName,
  cta,
  isPopular,
}: PricingButtonProps) {
  const href = planName === "Enterprise" ? "/contact" : "/login";

  return (
    <Button
      fullWidth
      as={Link}
      color={isPopular ? "primary" : "default"}
      href={href}
      variant={isPopular ? "shadow" : "flat"}
    >
      {cta}
    </Button>
  );
}
