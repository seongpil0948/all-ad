"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { useRouter } from "next/navigation";
import {
  FiLogOut,
  FiSettings,
  FiUser,
  FiHelpCircle,
  FiBarChart2,
  FiUsers,
} from "react-icons/fi";

import { useAuthStore } from "@/stores/useAuthStore";
import { clientLogout } from "@/app/(auth)/login/client-actions";

export function UserDropdown() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await clientLogout(router);
    } catch {
      // Error is handled in the client action
    }
  };

  const getUserInitials = (email: string) => {
    const name = email.split("@")[0];

    return name.charAt(0).toUpperCase();
  };

  const userEmail = user.email || "";
  const userInitials = getUserInitials(userEmail);
  const userName = userEmail.split("@")[0];

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Avatar
          isBordered
          as="button"
          className="transition-transform"
          color="primary"
          name={userInitials}
          size="sm"
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="User menu actions"
        variant="flat"
        onAction={(key) => {
          switch (key) {
            case "profile":
              router.push("/profile");
              break;
            case "settings":
              router.push("/settings");
              break;
            case "team":
              router.push("/team");
              break;
            case "analytics":
              router.push("/analytics");
              break;
            case "help":
              router.push("/support");
              break;
            case "logout":
              handleSignOut();
              break;
          }
        }}
      >
        <DropdownSection showDivider>
          <DropdownItem
            key="profile-info"
            className="h-14 gap-2"
            textValue="Profile"
          >
            <p className="font-semibold">{userName}</p>
            <p className="text-small text-default-500">{userEmail}</p>
          </DropdownItem>
        </DropdownSection>
        <DropdownSection showDivider>
          <DropdownItem
            key="profile"
            startContent={<FiUser className="text-xl" />}
          >
            내 프로필
          </DropdownItem>
          <DropdownItem
            key="settings"
            startContent={<FiSettings className="text-xl" />}
          >
            설정
          </DropdownItem>
          <DropdownItem
            key="team"
            startContent={<FiUsers className="text-xl" />}
          >
            팀 관리
          </DropdownItem>
          <DropdownItem
            key="analytics"
            startContent={<FiBarChart2 className="text-xl" />}
          >
            분석
          </DropdownItem>
        </DropdownSection>
        <DropdownSection>
          <DropdownItem
            key="help"
            startContent={<FiHelpCircle className="text-xl" />}
          >
            도움말 및 피드백
          </DropdownItem>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            startContent={<FiLogOut className="text-xl" />}
          >
            로그아웃
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
