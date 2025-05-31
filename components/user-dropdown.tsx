"use client";

import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  FiLogOut,
  FiSettings,
  FiUser,
  FiHelpCircle,
  FiBarChart2,
  FiUsers,
} from "react-icons/fi";

import { createClient } from "@/utils/supabase/client";
import { getProfile } from "@/utils/profile";
import { Profile } from "@/types/database.types";

interface UserDropdownProps {
  user: User;
}

export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await getProfile(user.id);

      setProfile(userProfile);
    };

    fetchProfile();
  }, [user.id]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = (email: string) => {
    const name = email.split("@")[0];

    return name.charAt(0).toUpperCase();
  };

  const userEmail = user.email || "";
  const userInitials = getUserInitials(userEmail);
  const userName = profile?.full_name || userEmail.split("@")[0];

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
          src={profile?.avatar_url || undefined}
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
