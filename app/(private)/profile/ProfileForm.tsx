"use client";

import { useState, useTransition } from "react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { useFormStatus } from "react-dom";
import { User } from "@supabase/supabase-js";

import { updateAvatarAction } from "./actions";

import { AvatarUpload } from "@/components/avatar-upload";
import { Profile } from "@/types/database.types";
import { MessageCard } from "@/components/common";

interface ProfileFormProps {
  user: User;
  profile: Profile;
  updateProfileAction: (
    formData: FormData,
  ) => Promise<{ success: boolean; message: string }>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button color="primary" isLoading={pending} type="submit">
      저장
    </Button>
  );
}

export function ProfileForm({
  user,
  profile,
  updateProfileAction,
}: ProfileFormProps) {
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || user.email || "",
  });

  const handleSubmit = async (formData: FormData) => {
    setMessage(null);
    const result = await updateProfileAction(formData);

    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
  };

  const handleAvatarUpload = async (url: string) => {
    startTransition(async () => {
      const result = await updateAvatarAction(url);

      if (!result.success) {
        setMessage({
          type: "error",
          text: "아바타 업데이트 중 오류가 발생했습니다.",
        });
      }
    });
  };

  const handleAvatarDelete = async () => {
    startTransition(async () => {
      const result = await updateAvatarAction(null);

      if (!result.success) {
        setMessage({
          type: "error",
          text: "아바타 삭제 중 오류가 발생했습니다.",
        });
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <AvatarUpload
          currentAvatarUrl={profile?.avatar_url ?? undefined}
          userId={user?.id || ""}
          onDeleteComplete={handleAvatarDelete}
          onUploadComplete={handleAvatarUpload}
        />
        <p className="text-sm text-default-500 mt-4">
          클릭하여 프로필 사진을 업로드하세요
        </p>
      </div>

      <Divider className="my-6" />

      {message && <MessageCard message={message.text} type={message.type} />}

      <form action={handleSubmit}>
        <div className="space-y-6">
          <Input
            label="이름"
            name="full_name"
            placeholder="이름을 입력하세요"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />

          <Input
            isReadOnly
            description="이메일은 변경할 수 없습니다"
            label="이메일"
            type="email"
            value={formData.email}
          />
        </div>

        <div className="flex justify-end mt-8">
          <SubmitButton />
        </div>
      </form>
    </>
  );
}
