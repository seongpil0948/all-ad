"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";

import { createClient } from "@/utils/supabase/client";
import { getProfile, updateProfile } from "@/utils/profile";
import { AvatarUpload } from "@/components/avatar-upload";
import { Profile } from "@/types/database.types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");

        return;
      }

      setUser(user);

      // Fetch or create profile
      let userProfile = await getProfile(user.id);

      if (!userProfile) {
        // Create profile if it doesn't exist
        const { data, error } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email!,
          })
          .select()
          .single();

        if (!error) {
          userProfile = data;
        }
      }

      if (userProfile) {
        setProfile(userProfile);
        setFormData({
          full_name: userProfile.full_name || "",
          email: userProfile.email || user.email || "",
        });
      }

      setLoading(false);
    };

    fetchUserAndProfile();
  }, [router]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const updatedProfile = await updateProfile(user.id, {
        full_name: formData.full_name,
      });

      setProfile(updatedProfile);
      alert("프로필이 업데이트되었습니다.");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("프로필 업데이트 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;

    try {
      const updatedProfile = await updateProfile(user.id, {
        avatar_url: url,
      });

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating avatar:", error);
      alert("아바타 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleAvatarDelete = async () => {
    if (!user) return;

    try {
      const updatedProfile = await updateProfile(user.id, {
        avatar_url: null,
      });

      setProfile(updatedProfile);
    } catch (error) {
      console.error("Error deleting avatar:", error);
      alert("아바타 삭제 중 오류가 발생했습니다.");
    }
  };

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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">프로필 설정</h1>

      <Card>
        <CardBody className="p-8">
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

          <div className="space-y-6">
            <Input
              label="이름"
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
            <Button color="primary" isLoading={saving} onClick={handleSave}>
              저장
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
