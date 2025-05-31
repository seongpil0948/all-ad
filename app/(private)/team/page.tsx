"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";
import { Spinner } from "@heroui/spinner";
import { FiUserPlus } from "react-icons/fi";

import { createClient } from "@/utils/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "김철수",
      email: "chulsoo@example.com",
      role: "관리자",
      status: "active",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
    },
    {
      id: "2",
      name: "이영희",
      email: "younghee@example.com",
      role: "편집자",
      status: "active",
      avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d",
    },
    {
      id: "3",
      name: "박민수",
      email: "minsoo@example.com",
      role: "뷰어",
      status: "pending",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
  ]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");

        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const roleColorMap = {
    관리자: "danger",
    편집자: "warning",
    뷰어: "primary",
  } as const;

  const statusColorMap = {
    active: "success",
    pending: "warning",
  } as const;

  const columns = [
    { key: "user", label: "사용자" },
    { key: "role", label: "역할" },
    { key: "status", label: "상태" },
    { key: "actions", label: "작업" },
  ];

  const renderCell = (member: TeamMember, columnKey: React.Key) => {
    switch (columnKey) {
      case "user":
        return (
          <User
            avatarProps={{ radius: "full", src: member.avatar }}
            description={member.email}
            name={member.name}
          />
        );
      case "role":
        return (
          <Chip
            className="capitalize"
            color={roleColorMap[member.role as keyof typeof roleColorMap]}
            size="sm"
            variant="flat"
          >
            {member.role}
          </Chip>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[member.status as keyof typeof statusColorMap]}
            size="sm"
            variant="dot"
          >
            {member.status === "active" ? "활성" : "대기중"}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Button size="sm" variant="light">
              편집
            </Button>
            <Button color="danger" size="sm" variant="light">
              제거
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">팀 관리</h1>
        <Button color="primary" startContent={<FiUserPlus />}>
          팀원 초대
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          <Table removeWrapper aria-label="팀 멤버 테이블">
            <TableHeader columns={columns}>
              {(column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              )}
            </TableHeader>
            <TableBody items={teamMembers}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => (
                    <TableCell>{renderCell(item, columnKey)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">총 팀원</p>
            <p className="text-2xl font-bold">3명</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">활성 사용자</p>
            <p className="text-2xl font-bold">2명</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-default-500 text-sm">대기중</p>
            <p className="text-2xl font-bold">1명</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
