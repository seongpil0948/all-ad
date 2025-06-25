"use client";

import { useState, useRef } from "react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

import { uploadAvatar, deleteAvatar } from "@/utils/profile";
import { AvatarUploadProps } from "@/types/components";
import log from "@/utils/logger";
import { toast } from "@/utils/toast";

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  onDeleteComplete,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!validTypes.includes(file.type)) {
      toast.error({
        title: "잘못된 파일 형식",
        description: "JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.",
      });

      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error({
        title: "파일 크기 초과",
        description: "파일 크기는 5MB 이하여야 합니다.",
      });

      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);

      onUploadComplete(url);
      toast.success({
        title: "프로필 사진 업로드 성공",
      });
    } catch (error) {
      log.error("Error uploading avatar", error as Error, {
        module: "AvatarUpload",
        userId,
        fileSize: file.size,
        fileType: file.type,
      });
      toast.error({
        title: "업로드 실패",
        description: "아바타 업로드 중 오류가 발생했습니다.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl) {
      return;
    }

    if (!confirm("프로필 사진을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAvatar(currentAvatarUrl);
      onDeleteComplete();
      toast.success({
        title: "프로필 사진 삭제 성공",
      });
    } catch (error) {
      log.error("Error deleting avatar", error as Error, {
        module: "AvatarUpload",
        userId,
        avatarUrl: currentAvatarUrl,
      });
      toast.error({
        title: "삭제 실패",
        description: "아바타 삭제 중 오류가 발생했습니다.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar
        isBordered
        className="w-32 h-32"
        color="primary"
        src={currentAvatarUrl}
      />

      <input
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        type="file"
        onChange={handleFileSelect}
      />

      <div className="absolute bottom-0 right-0 flex gap-1">
        <Button
          isIconOnly
          color="primary"
          isLoading={uploading}
          radius="full"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Spinner size="sm" /> : <FiCamera />}
        </Button>

        {currentAvatarUrl && (
          <Button
            isIconOnly
            color="danger"
            isLoading={deleting}
            radius="full"
            size="sm"
            onClick={handleDelete}
          >
            {deleting ? <Spinner size="sm" /> : <FiTrash2 />}
          </Button>
        )}
      </div>
    </div>
  );
}
