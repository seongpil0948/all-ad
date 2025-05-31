"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Switch } from "@heroui/switch";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">설정</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">알림 설정</p>
              <p className="text-small text-default-500">알림 수신 방법을 설정합니다</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">이메일 알림</p>
                <p className="text-small text-default-500">중요한 업데이트를 이메일로 받습니다</p>
              </div>
              <Switch defaultSelected />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">브라우저 알림</p>
                <p className="text-small text-default-500">브라우저에서 실시간 알림을 받습니다</p>
              </div>
              <Switch />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">보안 설정</p>
              <p className="text-small text-default-500">계정 보안을 강화합니다</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">2단계 인증</p>
                <p className="text-small text-default-500">추가 보안을 위한 2단계 인증을 설정합니다</p>
              </div>
              <Switch />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">로그인 알림</p>
                <p className="text-small text-default-500">새로운 기기에서 로그인 시 알림을 받습니다</p>
              </div>
              <Switch defaultSelected />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex gap-3">
            <div className="flex flex-col">
              <p className="text-md font-semibold">데이터 및 개인정보</p>
              <p className="text-small text-default-500">데이터 사용 및 개인정보 설정</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">데이터 수집</p>
                <p className="text-small text-default-500">서비스 개선을 위한 데이터 수집에 동의합니다</p>
              </div>
              <Switch defaultSelected />
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-medium">마케팅 수신</p>
                <p className="text-small text-default-500">새로운 기능 및 프로모션 정보를 받습니다</p>
              </div>
              <Switch />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
