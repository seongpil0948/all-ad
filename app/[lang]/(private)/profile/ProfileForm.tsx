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
import { useDictionary } from "@/hooks/use-dictionary";

interface ProfileFormProps {
  user: User;
  profile: Profile;
  updateProfileAction: (
    formData: FormData,
  ) => Promise<{ success: boolean; message: string }>;
}

const SubmitButton = memo(() => {
  const { pending } = useFormStatus();
  const { dictionary: dict } = useDictionary();

  return (
    <Button color="primary" isLoading={pending} type="submit">
      {dict.common.save}
    </Button>
  );
});

SubmitButton.displayName = "SubmitButton";

export function ProfileForm({
  user,
  profile,
  updateProfileAction,
}: ProfileFormProps) {
  const { dictionary: dict } = useDictionary();
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
            title: dict.profile.toast.avatarUpdated,
          });
        } else {
          toast.error({
            title: dict.profile.toast.avatarUpdateError,
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
          title: dict.profile.toast.avatarDeleted,
        });
      } else {
        toast.error({
          title: dict.profile.toast.avatarDeleteError,
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
          {dict.profile.uploadPrompt}
        </p>
      </div>

      <Divider className="my-6" />

      <form action={handleSubmit}>
        <div className="space-y-6">
          <Input
            label={dict.profile.nameLabel}
            name="full_name"
            placeholder={dict.profile.namePlaceholder}
            value={formData.full_name}
            onChange={handleNameChange}
          />

          <Input
            isReadOnly
            description={dict.profile.emailReadonly}
            label={dict.profile.emailLabel}
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
