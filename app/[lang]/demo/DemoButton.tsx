"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

export default function DemoButton() {
  const router = useRouter();

  return (
    <Button color="primary" size="lg" onPress={() => router.push("/login")}>
      전체 기능 사용하기
    </Button>
  );
}
