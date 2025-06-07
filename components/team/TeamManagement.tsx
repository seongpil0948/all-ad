"use client";

import { createElement, useEffect, useState, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Avatar } from "@heroui/avatar";
import {
  FaUserPlus,
  FaCrown,
  FaEdit,
  FaEye,
  FaTrash,
  FaUser,
} from "react-icons/fa";

import { useTeamStore, useAuthStore } from "@/stores";
import { UserRole } from "@/types/database.types";
import log from "@/utils/logger";
import { LoadingState } from "@/components/common";

const roleConfig = {
  master: {
    label: "마스터",
    color: "danger",
    icon: FaCrown,
    description: "모든 권한을 가진 관리자",
  },
  team_mate: {
    label: "팀 메이트",
    color: "primary",
    icon: FaEdit,
    description: "캠페인 수정 및 관리 가능",
  },
  viewer: {
    label: "뷰어",
    color: "default",
    icon: FaEye,
    description: "읽기 전용 권한",
  },
} as const;

export function TeamManagement() {
  const {
    currentTeam,
    teamMembers,
    teamInvitations,
    userRole,
    isLoading,
    error,
    fetchCurrentTeam,
    fetchTeamMembers,
    fetchInvitations,
    inviteTeamMember,
    updateMemberRole,
    removeMember,
  } = useTeamStore();

  const currentUser = useAuthStore((state) => state.user);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("viewer");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Initialize data - run only once
  useEffect(() => {
    if (!isInitialized) {
      fetchCurrentTeam().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  // Fetch team members and invitations when currentTeam changes
  useEffect(() => {
    if (currentTeam && isInitialized) {
      fetchTeamMembers();
      fetchInvitations();
    }
  }, [currentTeam?.id, isInitialized]);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail) {
      log.warn("팀원 초대 실패: 이메일이 입력되지 않음");
      setErrorMessage("초대할 팀원의 이메일을 입력해주세요.");

      return;
    }

    try {
      await inviteTeamMember(inviteEmail, inviteRole);
      log.info(`팀원 초대 성공: ${inviteEmail}`);
      setSuccessMessage(`${inviteEmail}님에게 초대장을 보냈습니다.`);
      onClose();
      setInviteEmail("");
      setInviteRole("viewer");
    } catch (error) {
      log.error(`팀원 초대 실패: ${JSON.stringify(error)}`);
      setErrorMessage("초대 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }, [inviteEmail, inviteRole, inviteTeamMember, onClose]);

  const handleRoleUpdate = useCallback(
    async (memberId: string) => {
      try {
        await updateMemberRole(memberId, editingRole);
        log.info(`팀원 권한 변경 성공: ${roleConfig[editingRole].label}`);
        setSuccessMessage(
          `팀원의 권한이 ${roleConfig[editingRole].label}로 변경되었습니다.`,
        );
        setEditingMember(null);
      } catch (error) {
        log.error(`팀원 권한 변경 실패: ${JSON.stringify(error)}`);
        setErrorMessage("권한 변경에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [editingRole, updateMemberRole],
  );

  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      if (confirm(`${memberName}님을 팀에서 제거하시겠습니까?`)) {
        try {
          await removeMember(memberId);
          log.info(`팀원 제거 성공: ${memberName}`);
          setSuccessMessage(`${memberName}님이 팀에서 제거되었습니다.`);
        } catch (error) {
          log.error(`팀원 제거 실패: ${JSON.stringify(error)}`);
          setErrorMessage("팀원 제거 중 오류가 발생했습니다.");
        }
      }
    },
    [removeMember],
  );

  const canManageTeam = userRole === "master" || userRole === "team_mate";

  if (isLoading && !currentTeam) {
    return <LoadingState message="팀 정보를 불러오는 중..." />;
  }

  if (!currentTeam) {
    return (
      <Card>
        <CardBody>
          <p className="text-center text-default-500">
            팀 정보를 불러올 수 없습니다
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{currentTeam.name}</h2>
          <p className="text-default-500">팀원 관리</p>
        </div>

        {canManageTeam && (
          <Button
            color="primary"
            startContent={<FaUserPlus />}
            onPress={onOpen}
          >
            팀원 초대
          </Button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="bg-success-50 border-success-200">
          <CardBody>
            <p className="text-success">{successMessage}</p>
          </CardBody>
        </Card>
      )}

      {errorMessage && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{errorMessage}</p>
          </CardBody>
        </Card>
      )}

      {error && (
        <Card className="bg-danger-50 border-danger-200">
          <CardBody>
            <p className="text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* 현재 사용자 정보 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">내 권한</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3">
            {userRole && (
              <>
                {createElement(roleConfig[userRole].icon, {
                  className: `w-5 h-5 text-${roleConfig[userRole].color}`,
                })}
                <div>
                  <p className="font-medium">{roleConfig[userRole].label}</p>
                  <p className="text-sm text-default-500">
                    {roleConfig[userRole].description}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 팀원 목록 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">팀원 목록</h3>
        </CardHeader>
        <CardBody>
          <Table aria-label="팀원 목록">
            <TableHeader>
              <TableColumn>팀원</TableColumn>
              <TableColumn>이메일</TableColumn>
              <TableColumn>권한</TableColumn>
              <TableColumn>가입일</TableColumn>
              {canManageTeam ? <TableColumn>액션</TableColumn> : <></>}
            </TableHeader>
            <TableBody items={teamMembers ?? []}>
              {(member) => {
                const memberProfile = member.profiles;
                const isCurrentUser = currentUser?.id === member.user_id;
                const isMaster = currentTeam.master_user_id === member.user_id;

                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={
                            memberProfile?.full_name ||
                            memberProfile?.email ||
                            "Unknown"
                          }
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {memberProfile?.full_name || "이름 없음"}
                            {isCurrentUser && " (나)"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <p className="text-sm">{memberProfile?.email}</p>
                    </TableCell>

                    <TableCell>
                      {editingMember === member.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            className="w-32"
                            selectedKeys={[editingRole]}
                            size="sm"
                            onChange={(e) =>
                              setEditingRole(e.target.value as UserRole)
                            }
                          >
                            {Object.entries(roleConfig).map(
                              ([role, config]) => (
                                <SelectItem key={role}>
                                  {config.label}
                                </SelectItem>
                              ),
                            )}
                          </Select>
                          <Button
                            color="primary"
                            size="sm"
                            onPress={() => handleRoleUpdate(member.id)}
                          >
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => setEditingMember(null)}
                          >
                            취소
                          </Button>
                        </div>
                      ) : (
                        <Chip
                          color={roleConfig[member.role].color}
                          startContent={
                            <div className="w-4 h-4">
                              {createElement(roleConfig[member.role].icon, {
                                className: "w-3 h-3",
                              })}
                            </div>
                          }
                          variant="flat"
                        >
                          {roleConfig[member.role].label}
                        </Chip>
                      )}
                    </TableCell>

                    <TableCell>
                      <p className="text-sm text-default-500">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </TableCell>

                    {canManageTeam ? (
                      <TableCell>
                        {!isMaster &&
                          !isCurrentUser &&
                          userRole === "master" && (
                            <div className="flex items-center gap-2">
                              <Button
                                isDisabled={editingMember !== null}
                                size="sm"
                                variant="light"
                                onPress={() => {
                                  setEditingMember(member.id);
                                  setEditingRole(member.role);
                                }}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                color="danger"
                                size="sm"
                                variant="light"
                                onPress={() =>
                                  handleRemoveMember(
                                    member.id,
                                    memberProfile?.full_name ||
                                      memberProfile?.email ||
                                      "Unknown",
                                  )
                                }
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          )}
                      </TableCell>
                    ) : (
                      <> </>
                    )}
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 대기 중인 초대 */}
      {teamInvitations && teamInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">대기 중인 초대</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="대기 중인 초대 목록">
              <TableHeader>
                <TableColumn>이메일</TableColumn>
                <TableColumn>권한</TableColumn>
                <TableColumn>초대일</TableColumn>
                <TableColumn>만료일</TableColumn>
                {userRole === "master" ? (
                  <TableColumn>액션</TableColumn>
                ) : (
                  <></>
                )}
              </TableHeader>
              <TableBody items={teamInvitations}>
                {(invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <p className="text-sm">{invitation.email}</p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={roleConfig[invitation.role].color}
                        startContent={
                          <div className="w-4 h-4">
                            {createElement(roleConfig[invitation.role].icon, {
                              className: "w-3 h-3",
                            })}
                          </div>
                        }
                        variant="flat"
                      >
                        {roleConfig[invitation.role].label}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-500">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-500">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </TableCell>

                    {userRole === "master" ? <TableCell>-</TableCell> : <></>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>팀원 초대</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="이메일"
                placeholder="초대할 팀원의 이메일을 입력하세요"
                startContent={<FaUser className="text-default-400" />}
                type="email"
                value={inviteEmail}
                onValueChange={(e) => setInviteEmail(e)}
              />

              <Select
                items={Object.entries(roleConfig)
                  .filter(([role]) => role !== "master")
                  .map(([role, config]) => ({
                    key: role,
                    label: config.label,
                    description: config.description,
                    icon: config.icon,
                  }))}
                label="권한"
                selectedKeys={[inviteRole]}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
              >
                {(item) => (
                  <SelectItem key={item.key} textValue={item.label}>
                    <div className="flex gap-2 items-center">
                      {createElement(item.icon, {
                        className: "w-4 h-4 flex-shrink-0",
                      })}
                      <div className="flex flex-col">
                        <span className="text-small">{item.label}</span>
                        <span className="text-tiny text-default-400">
                          {item.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                )}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              취소
            </Button>
            <Button color="primary" onPress={handleInvite}>
              초대
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
