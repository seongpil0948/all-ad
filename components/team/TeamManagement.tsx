"use client";

import {
  createElement,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Avatar } from "@heroui/avatar";
import { useAsyncList } from "@react-stately/data";
import { useShallow } from "zustand/shallow";
import { FaUserPlus, FaCrown, FaEdit, FaEye, FaTrash } from "react-icons/fa";

import { useTeamStore, useAuthStore } from "@/stores";
import {
  UserRole,
  TeamMemberWithProfile,
  TeamInvitation,
} from "@/types/database.types";
import log from "@/utils/logger";
import {
  LoadingState,
  SectionHeader,
  TableActions,
  InfiniteScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";
import { TableSkeleton, CardSkeleton } from "@/components/common/skeletons";

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

const ITEMS_PER_PAGE = 20;

export function TeamManagement() {
  const [isPending, startTransition] = useTransition();

  // Use useShallow to optimize re-renders
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
  } = useTeamStore(
    useShallow((state) => ({
      currentTeam: state.currentTeam,
      teamMembers: state.teamMembers,
      teamInvitations: state.teamInvitations,
      userRole: state.userRole,
      isLoading: state.isLoading,
      error: state.error,
      fetchCurrentTeam: state.fetchCurrentTeam,
      fetchTeamMembers: state.fetchTeamMembers,
      fetchInvitations: state.fetchInvitations,
      inviteTeamMember: state.inviteTeamMember,
      updateMemberRole: state.updateMemberRole,
      removeMember: state.removeMember,
    })),
  );

  const currentUser = useAuthStore(useShallow((state) => state.user));

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("viewer");
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<UserRole>("viewer");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [hasMoreInvitations, setHasMoreInvitations] = useState(true);

  // Check if user can manage team
  const canManageTeam = useMemo(
    () => userRole === "master" || userRole === "team_mate",
    [userRole],
  );

  // Effect 1: Fetch current team - separate concern
  useEffect(() => {
    startTransition(() => {
      fetchCurrentTeam().catch((err) => {
        log.error("Failed to fetch current team", err);
      });
    });
  }, [fetchCurrentTeam]);

  // Effect 2: Fetch team members and invitations when team changes - separate concern
  useEffect(() => {
    if (currentTeam) {
      startTransition(() => {
        Promise.all([
          fetchTeamMembers().catch((err) => {
            log.error("Failed to fetch team members", err);
          }),
          fetchInvitations().catch((err) => {
            log.error("Failed to fetch invitations", err);
          }),
        ]);
      });
    }
  }, [currentTeam, fetchTeamMembers, fetchInvitations]);

  // Infinite scroll setup for team members
  const membersList = useAsyncList<TeamMemberWithProfile>({
    async load({ cursor }) {
      const start = cursor ? parseInt(cursor) : 0;
      const members = teamMembers || [];
      const items = members.slice(start, start + ITEMS_PER_PAGE);

      const hasMore = start + ITEMS_PER_PAGE < members.length;

      setHasMoreMembers(hasMore);

      return {
        items,
        cursor: hasMore ? String(start + ITEMS_PER_PAGE) : undefined,
      };
    },
    getKey: (item) => item.id,
  });

  // Infinite scroll setup for invitations
  const invitationsList = useAsyncList<TeamInvitation>({
    async load({ cursor }) {
      const start = cursor ? parseInt(cursor) : 0;
      const invitations = teamInvitations || [];
      const items = invitations.slice(start, start + ITEMS_PER_PAGE);

      const hasMore = start + ITEMS_PER_PAGE < invitations.length;

      setHasMoreInvitations(hasMore);

      return {
        items,
        cursor: hasMore ? String(start + ITEMS_PER_PAGE) : undefined,
      };
    },
    getKey: (item) => item.id,
  });

  // Table columns definition - memoize to prevent re-creation
  const memberColumns = useMemo<
    InfiniteScrollTableColumn<TeamMemberWithProfile>[]
  >(
    () => [
      { key: "member", label: "팀원" },
      { key: "email", label: "이메일" },
      { key: "role", label: "권한" },
      { key: "joinDate", label: "가입일" },
      ...(canManageTeam ? [{ key: "actions", label: "액션" }] : []),
    ],
    [canManageTeam],
  );

  const invitationColumns = useMemo<
    InfiniteScrollTableColumn<TeamInvitation>[]
  >(
    () => [
      { key: "email", label: "초대한 이메일" },
      { key: "role", label: "권한" },
      { key: "status", label: "상태" },
      { key: "invitedBy", label: "초대자" },
      { key: "expiresAt", label: "만료일" },
    ],
    [],
  );

  // Effect 3: Reload members list when data changes - separate concern
  useEffect(() => {
    startTransition(() => {
      membersList.reload();
    });
  }, [teamMembers?.length]);

  // Effect 4: Reload invitations list when data changes - separate concern
  useEffect(() => {
    startTransition(() => {
      invitationsList.reload();
    });
  }, [teamInvitations?.length]);

  // Effect 5: Clear success message after 3 seconds - separate concern
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        startTransition(() => {
          setSuccessMessage(null);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Effect 6: Clear error message after 3 seconds - separate concern
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        startTransition(() => {
          setErrorMessage(null);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleInvite = useCallback(async () => {
    if (!inviteEmail) {
      log.warn("팀원 초대 실패: 이메일이 입력되지 않음");
      setErrorMessage("초대할 팀원의 이메일을 입력해주세요.");

      return;
    }

    try {
      await inviteTeamMember(inviteEmail, inviteRole);
      log.info(`팀원 초대 성공: ${inviteEmail}`);
      startTransition(() => {
        setSuccessMessage(`${inviteEmail}님에게 초대장을 보냈습니다.`);
        setInviteEmail("");
        setInviteRole("viewer");
      });
      onClose();
    } catch (error) {
      log.error(`팀원 초대 실패: ${JSON.stringify(error)}`);
      startTransition(() => {
        setErrorMessage("초대 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
    }
  }, [inviteEmail, inviteRole, inviteTeamMember, onClose]);

  const handleRoleUpdate = useCallback(
    async (memberId: string) => {
      try {
        await updateMemberRole(memberId, editingRole);
        log.info(`팀원 권한 변경 성공: ${roleConfig[editingRole].label}`);
        startTransition(() => {
          setSuccessMessage(
            `팀원의 권한이 ${roleConfig[editingRole].label}로 변경되었습니다.`,
          );
          setEditingMember(null);
        });
      } catch (error) {
        log.error(`팀원 권한 변경 실패: ${JSON.stringify(error)}`);
        startTransition(() => {
          setErrorMessage("권한 변경에 실패했습니다. 다시 시도해주세요.");
        });
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
          startTransition(() => {
            setSuccessMessage(`${memberName}님이 팀에서 제거되었습니다.`);
          });
        } catch (error) {
          log.error(`팀원 제거 실패: ${JSON.stringify(error)}`);
          startTransition(() => {
            setErrorMessage("팀원 제거 중 오류가 발생했습니다.");
          });
        }
      }
    },
    [removeMember],
  );

  // Render cell content for members table - memoize to prevent re-renders
  const renderMemberCell = useCallback(
    (member: TeamMemberWithProfile, columnKey: string) => {
      const memberProfile = member.profiles;
      const isCurrentUser = currentUser?.id === member.user_id;
      const isMaster = currentTeam?.master_user_id === member.user_id;

      switch (columnKey) {
        case "member":
          return (
            <div className="flex items-center gap-3">
              <Avatar
                name={
                  memberProfile?.full_name || memberProfile?.email || "Unknown"
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
          );
        case "email":
          return <p className="text-sm">{memberProfile?.email}</p>;
        case "role":
          return editingMember === member.id ? (
            <div className="flex items-center gap-2">
              <Select
                className="w-32"
                selectedKeys={[editingRole]}
                size="sm"
                onChange={(e) => {
                  startTransition(() => {
                    setEditingRole(e.target.value as UserRole);
                  });
                }}
              >
                {Object.entries(roleConfig).map(([role, config]) => (
                  <SelectItem key={role}>{config.label}</SelectItem>
                ))}
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
                variant="light"
                onPress={() => {
                  startTransition(() => {
                    setEditingMember(null);
                  });
                }}
              >
                취소
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Chip
                color={roleConfig[isMaster ? "master" : member.role].color}
                size="sm"
                startContent={createElement(
                  roleConfig[isMaster ? "master" : member.role].icon,
                  { className: "w-3 h-3" },
                )}
                variant="flat"
              >
                {roleConfig[isMaster ? "master" : member.role].label}
              </Chip>
            </div>
          );
        case "joinDate":
          return (
            <p className="text-sm">
              {new Date(member.joined_at).toLocaleDateString()}
            </p>
          );
        case "actions":
          return (
            <TableActions
              actions={[
                ...(userRole === "master" &&
                !isMaster &&
                !isCurrentUser &&
                member.role !== "master"
                  ? [
                      {
                        icon: <FaEdit />,
                        label: "권한 변경",
                        variant: "flat" as const,
                        onPress: () => {
                          startTransition(() => {
                            setEditingMember(member.id);
                            setEditingRole(member.role);
                          });
                        },
                      },
                    ]
                  : []),
                ...(userRole === "master" && !isMaster && !isCurrentUser
                  ? [
                      {
                        icon: <FaTrash />,
                        label: "제거",
                        variant: "flat" as const,
                        color: "danger" as const,
                        onPress: () =>
                          handleRemoveMember(
                            member.id,
                            memberProfile?.full_name || "팀원",
                          ),
                      },
                    ]
                  : []),
              ]}
            />
          );
        default:
          return null;
      }
    },
    [
      currentUser,
      currentTeam,
      editingMember,
      editingRole,
      userRole,
      handleRoleUpdate,
      handleRemoveMember,
    ],
  );

  // Render cell content for invitations table - memoize to prevent re-renders
  const renderInvitationCell = useCallback(
    (invitation: TeamInvitation, columnKey: string) => {
      switch (columnKey) {
        case "email":
          return <p className="font-medium">{invitation.email}</p>;
        case "role":
          return (
            <Chip
              color={roleConfig[invitation.role].color}
              size="sm"
              startContent={createElement(roleConfig[invitation.role].icon, {
                className: "w-3 h-3",
              })}
              variant="flat"
            >
              {roleConfig[invitation.role].label}
            </Chip>
          );
        case "status":
          return (
            <Chip
              color={invitation.status === "pending" ? "warning" : "success"}
              size="sm"
              variant="dot"
            >
              {invitation.status === "pending" ? "대기 중" : "승인됨"}
            </Chip>
          );
        case "invitedBy":
          return (
            <p className="text-sm">{invitation.invited_by || "알 수 없음"}</p>
          );
        case "expiresAt":
          return (
            <p className="text-sm">
              {new Date(invitation.expires_at).toLocaleDateString()}
            </p>
          );
        default:
          return null;
      }
    },
    [],
  );

  if (isLoading && !teamMembers?.length) {
    return <LoadingState message="팀 정보를 불러오는 중..." />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 팀 정보 카드 */}
      {isLoading && !currentTeam ? (
        <CardSkeleton />
      ) : (
        currentTeam && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">팀 정보</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">팀 이름:</span>{" "}
                  {currentTeam.name}
                </p>
                <p>
                  <span className="font-medium">내 권한:</span>{" "}
                  <Chip
                    color={roleConfig[userRole || "viewer"].color}
                    size="sm"
                    startContent={createElement(
                      roleConfig[userRole || "viewer"].icon,
                      { className: "w-3 h-3" },
                    )}
                    variant="flat"
                  >
                    {roleConfig[userRole || "viewer"].label}
                  </Chip>
                </p>
                <p className="text-sm text-default-500">
                  {roleConfig[userRole || "viewer"].description}
                </p>
              </div>
            </CardBody>
          </Card>
        )
      )}

      {/* 성공/에러 메시지 */}
      {successMessage && (
        <Card>
          <CardBody>
            <p className="text-success">{successMessage}</p>
          </CardBody>
        </Card>
      )}

      {errorMessage && (
        <Card>
          <CardBody>
            <p className="text-danger">{errorMessage}</p>
          </CardBody>
        </Card>
      )}

      {/* 팀원 목록 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <SectionHeader
            subtitle="팀에 속한 멤버들을 관리합니다"
            title="팀원 목록"
          />
          {canManageTeam && (
            <Button
              color="primary"
              size="sm"
              startContent={<FaUserPlus />}
              onPress={onOpen}
            >
              팀원 초대
            </Button>
          )}
        </div>

        {isLoading && !teamMembers?.length ? (
          <TableSkeleton columns={memberColumns.length} rows={5} />
        ) : (
          <InfiniteScrollTable
            aria-label="팀원 목록"
            columns={memberColumns}
            emptyContent="팀원이 없습니다"
            hasMore={hasMoreMembers}
            isLoading={membersList.isLoading || isPending}
            items={membersList}
            maxHeight="400px"
            renderCell={renderMemberCell}
            onLoadMore={() => membersList.loadMore()}
          />
        )}
      </div>

      {/* 초대 현황 */}
      {canManageTeam && teamInvitations && teamInvitations.length > 0 && (
        <div>
          <div className="mb-4">
            <SectionHeader
              subtitle="초대된 사용자들의 상태를 확인합니다"
              title="초대 현황"
            />
          </div>

          {isLoading && !teamInvitations?.length ? (
            <TableSkeleton columns={invitationColumns.length} rows={3} />
          ) : (
            <InfiniteScrollTable
              aria-label="초대 현황"
              columns={invitationColumns}
              emptyContent="초대 내역이 없습니다"
              hasMore={hasMoreInvitations}
              isLoading={invitationsList.isLoading || isPending}
              items={invitationsList}
              maxHeight="300px"
              renderCell={renderInvitationCell}
              onLoadMore={() => invitationsList.loadMore()}
            />
          )}
        </div>
      )}

      {/* 팀원 초대 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>팀원 초대</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="이메일"
                placeholder="team@example.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  startTransition(() => {
                    setInviteEmail(e.target.value);
                  });
                }}
              />
              <Select
                label="권한"
                selectedKeys={[inviteRole]}
                onChange={(e) => {
                  startTransition(() => {
                    setInviteRole(e.target.value as UserRole);
                  });
                }}
              >
                {Object.entries(roleConfig)
                  .filter(([role]) => role !== "master")
                  .map(([role, config]) => (
                    <SelectItem
                      key={role}
                      startContent={createElement(config.icon, {
                        className: "w-4 h-4",
                      })}
                    >
                      <div>
                        <p className="font-medium">{config.label}</p>
                        <p className="text-xs text-default-500">
                          {config.description}
                        </p>
                      </div>
                    </SelectItem>
                  ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              취소
            </Button>
            <Button
              color="primary"
              isDisabled={!inviteEmail}
              startContent={<FaUserPlus />}
              onPress={handleInvite}
            >
              초대하기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
