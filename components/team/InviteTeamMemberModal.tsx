"use client";

import { useState } from "react";
import { FaEnvelope, FaUserShield } from "react-icons/fa";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";

import { UserRole } from "@/types/platform";

interface InviteTeamMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: UserRole) => Promise<void>;
}

const roleOptions = [
  { value: "viewer", label: "뷰어", description: "캠페인 조회만 가능" },
  { value: "editor", label: "에디터", description: "캠페인 수정 가능" },
  { value: "master", label: "마스터", description: "모든 권한" },
];

export function InviteTeamMemberModal({
  isOpen,
  onOpenChange,
  onInvite,
}: InviteTeamMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email) {
      setError("이메일을 입력해주세요");

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await onInvite(email, role);
      setEmail("");
      setRole("viewer");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">팀원 초대</ModalHeader>
            <ModalBody>
              <Input
                errorMessage={error}
                isInvalid={!!error}
                label="이메일"
                placeholder="team@example.com"
                startContent={<FaEnvelope className="text-default-400" />}
                type="email"
                value={email}
                onValueChange={setEmail}
              />
              <Select
                label="권한 선택"
                placeholder="권한을 선택하세요"
                selectedKeys={[role]}
                startContent={<FaUserShield className="text-default-400" />}
                onSelectionChange={(keys) =>
                  setRole(Array.from(keys)[0] as UserRole)
                }
              >
                {roleOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    description={option.description}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                취소
              </Button>
              <Button
                color="primary"
                isLoading={isLoading}
                onPress={handleInvite}
              >
                초대하기
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
