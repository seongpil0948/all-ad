"use client";

import { useState, useRef } from "react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";

import { uploadAvatar, deleteAvatar } from "@/utils/profile";

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string;
  onUploadComplete: (url: string) => void;
  onDeleteComplete: () => void;
}

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
      alert("JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.");

      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");

      return;
    }

    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);

      onUploadComplete(url);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("아바타 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAvatarUrl || !confirm("프로필 사진을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteAvatar(currentAvatarUrl);
      onDeleteComplete();
    } catch (error) {
      console.error("Error deleting avatar:", error);
      alert("아바타 삭제 중 오류가 발생했습니다.");
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
