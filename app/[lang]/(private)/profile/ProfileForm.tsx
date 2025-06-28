"use client";

import { useState, useTransition, useCallback, memo } from "react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { useFormStatus } from "react-dom";
import { User } from "@supabase/supabase-js";

import { updateAvatarAction } from "./actions";

import { AvatarUpload } from "@/components/avatar-upload";
import { Profile } from "@/types";
import { toast } from "@/utils/toast";

interface ProfileFormProps {
  user: User;
  profile: Profile;
  updateProfileAction: (
    formData: FormData,
  ) => Promise<{ success: boolean; message: string }>;
}

const SubmitButton = memo(() => {
  const { pending } = useFormStatus();

  return (
    <Button color="primary" isLoading={pending} type="submit">
      저장
    </Button>
  );
});

SubmitButton.displayName = "SubmitButton";

export function ProfileForm({
  user,
  profile,
  updateProfileAction,
}: ProfileFormProps) {
  const [, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || user.email || "",
  });

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      const result = await updateProfileAction(formData);

      if (result.success) {
        toast.success({
          title: result.message,
        });
      } else {
        toast.error({
          title: result.message,
        });
      }
    },
    [updateProfileAction],
  );

  const handleAvatarUpload = useCallback(
    async (url: string) => {
      startTransition(async () => {
        const result = await updateAvatarAction(url);

        if (result.success) {
          toast.success({
            title: "프로필 사진이 업데이트되었습니다.",
          });
        } else {
          toast.error({
            title: "아바타 업데이트 중 오류가 발생했습니다.",
          });
        }
      });
    },
    [startTransition],
  );

  const handleAvatarDelete = useCallback(async () => {
    startTransition(async () => {
      const result = await updateAvatarAction(null);

      if (result.success) {
        toast.success({
          title: "프로필 사진이 삭제되었습니다.",
        });
      } else {
        toast.error({
          title: "아바타 삭제 중 오류가 발생했습니다.",
        });
      }
    });
  }, [startTransition]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, full_name: e.target.value }));
    },
    [],
  );

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

      <form action={handleSubmit}>
        <div className="space-y-6">
          <Input
            label="이름"
            name="full_name"
            placeholder="이름을 입력하세요"
            value={formData.full_name}
            onChange={handleNameChange}
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
