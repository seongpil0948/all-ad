"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { useDictionary } from "@/hooks/use-dictionary";

export default function DemoButton() {
  const router = useRouter();
  const { dictionary: dict } = useDictionary();
  const LOGIN_PATH = "/login" as const;

  return (
    <Button color="primary" size="lg" onPress={() => router.push(LOGIN_PATH)}>
      {dict.demo.cta.tryAllFeatures}
    </Button>
  );
}
