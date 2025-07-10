"use client";

import type { Dictionary } from "@/app/[lang]/dictionaries";

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
import { UserRole, TeamMemberWithProfile, TeamInvitation } from "@/types";
import log from "@/utils/logger";
import {
  LoadingState,
  SectionHeader,
  TableActions,
  InfiniteScrollTable,
  InfiniteScrollTableColumn,
} from "@/components/common";
import { TableSkeleton, CardSkeleton } from "@/components/common/skeletons";
import { toast } from "@/utils/toast";
import { useDictionary } from "@/hooks/use-dictionary";

const roleConfig = (dict: Dictionary) =>
  ({
    master: {
      label: dict.team.roles.master.name,
      color: "danger",
      icon: FaCrown,
      description: dict.team.roles.master.description,
    },
    team_mate: {
      label: dict.team.roles.team_mate.name,
      color: "primary",
      icon: FaEdit,
      description: dict.team.roles.team_mate.description,
    },
    viewer: {
      label: dict.team.roles.viewer.name,
      color: "default",
      icon: FaEye,
      description: dict.team.roles.viewer.description,
    },
  }) as const;

const ITEMS_PER_PAGE = 20;

export function TeamManagement() {
  const [isPending, startTransition] = useTransition();
  const { dictionary: dict } = useDictionary();

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
          fetchTeamMembers().catch((err: Error) => {
            log.error("Failed to fetch team members", err);
          }),
          fetchInvitations().catch((err: Error) => {
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
      { key: "member", label: dict.team.table.columns.member },
      { key: "email", label: dict.team.table.columns.email },
      { key: "role", label: dict.team.table.columns.role },
      { key: "joinDate", label: dict.team.table.columns.joinDate },
      ...(canManageTeam
        ? [{ key: "actions", label: dict.team.table.columns.actions }]
        : []),
    ],
    [canManageTeam, dict],
  );

  const invitationColumns = useMemo<
    InfiniteScrollTableColumn<TeamInvitation>[]
  >(
    () => [
      { key: "email", label: dict.team.table.columns.invitedEmail },
      { key: "role", label: dict.team.table.columns.role },
      { key: "status", label: dict.team.table.columns.status },
      { key: "invitedBy", label: dict.team.table.columns.invitedBy },
      { key: "expiresAt", label: dict.team.table.columns.expiresAt },
    ],
    [dict],
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

  const handleInvite = useCallback(async () => {
    if (!inviteEmail) {
      toast.error({
        title: dict.team.inviteModal.title,
      });

      return;
    }

    try {
      await inviteTeamMember(inviteEmail, inviteRole);
      toast.success({
        title: dict.team.toast.inviteSuccess,
        description: dict.team.toast.inviteSuccessDescription.replace(
          "{{email}}",
          inviteEmail,
        ),
      });
      startTransition(() => {
        setInviteEmail("");
        setInviteRole("viewer");
      });
      onClose();
    } catch {
      toast.error({
        title: dict.team.toast.inviteFailed,
        description: dict.team.toast.inviteFailedDescription,
      });
    }
  }, [inviteEmail, inviteRole, inviteTeamMember, onClose, dict]);

  const handleRoleUpdate = useCallback(
    async (memberId: string) => {
      try {
        await updateMemberRole(memberId, editingRole);
        toast.success({
          title: dict.team.toast.roleChangeSuccess,
          description: dict.team.toast.roleChangeSuccessDescription.replace(
            "{{role}}",
            roleConfig(dict)[editingRole].label,
          ),
        });
        startTransition(() => {
          setEditingMember(null);
        });
      } catch {
        toast.error({
          title: dict.team.toast.roleChangeFailed,
          description: dict.team.toast.roleChangeFailedDescription,
        });
      }
    },
    [editingRole, updateMemberRole, dict],
  );

  const handleRemoveMember = useCallback(
    async (memberId: string, memberName: string) => {
      if (
        confirm(dict.team.toast.removeConfirm.replace("{{name}}", memberName))
      ) {
        try {
          await removeMember(memberId);
          toast.success({
            title: dict.team.toast.removeSuccess,
            description: dict.team.toast.removeSuccessDescription.replace(
              "{{name}}",
              memberName,
            ),
          });
        } catch {
          toast.error({
            title: dict.team.toast.removeFailed,
            description: dict.team.toast.removeFailedDescription,
          });
        }
      }
    },
    [removeMember, dict],
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
                  {memberProfile?.full_name || dict.team.noName}
                  {isCurrentUser && ` ${dict.team.me}`}
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
                {Object.entries(roleConfig(dict)).map(([role, config]) => (
                  <SelectItem key={role}>{config.label}</SelectItem>
                ))}
              </Select>
              <Button
                color="primary"
                size="sm"
                onPress={() => handleRoleUpdate(member.id)}
              >
                {dict.common.save}
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
                {dict.common.cancel}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Chip
                color={
                  roleConfig(dict)[isMaster ? "master" : member.role].color
                }
                size="sm"
                startContent={createElement(
                  roleConfig(dict)[isMaster ? "master" : member.role].icon,
                  { className: "w-3 h-3" },
                )}
                variant="flat"
              >
                {roleConfig(dict)[isMaster ? "master" : member.role].label}
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
                        label: dict.team.actions.changeRole,
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
                        label: dict.team.actions.remove,
                        variant: "flat" as const,
                        color: "danger" as const,
                        onPress: () =>
                          handleRemoveMember(
                            member.id,
                            memberProfile?.full_name ||
                              dict.team.table.columns.member,
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
      dict,
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
              color={roleConfig(dict)[invitation.role].color}
              size="sm"
              startContent={createElement(
                roleConfig(dict)[invitation.role].icon,
                {
                  className: "w-3 h-3",
                },
              )}
              variant="flat"
            >
              {roleConfig(dict)[invitation.role].label}
            </Chip>
          );
        case "status":
          return (
            <Chip
              color={invitation.status === "pending" ? "warning" : "success"}
              size="sm"
              variant="dot"
            >
              {invitation.status === "pending"
                ? dict.team.members.pending
                : dict.team.members.active}
            </Chip>
          );
        case "invitedBy":
          return (
            <p className="text-sm">
              {invitation.invited_by || dict.team.unknown}
            </p>
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
    [dict],
  );

  if (isLoading && !teamMembers?.length) {
    return <LoadingState message={dict.team.loadingTeam} />;
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
              <h3 className="text-lg font-semibold">{dict.team.teamInfo}</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">{dict.team.teamName}</span>{" "}
                  {currentTeam.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{dict.team.myRole}</span>
                  <Chip
                    color={roleConfig(dict)[userRole || "viewer"].color}
                    size="sm"
                    startContent={createElement(
                      roleConfig(dict)[userRole || "viewer"].icon,
                      { className: "w-3 h-3" },
                    )}
                    variant="flat"
                  >
                    {roleConfig(dict)[userRole || "viewer"].label}
                  </Chip>
                </div>
                <p className="text-sm text-default-500">
                  {roleConfig(dict)[userRole || "viewer"].description}
                </p>
              </div>
            </CardBody>
          </Card>
        )
      )}

      {/* 팀원 목록 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <SectionHeader
            subtitle={dict.team.memberListSubtitle}
            title={dict.team.memberListTitle}
          />
          {canManageTeam && (
            <Button
              color="primary"
              size="sm"
              startContent={<FaUserPlus />}
              onPress={onOpen}
            >
              {dict.team.inviteButton}
            </Button>
          )}
        </div>

        {isLoading && !teamMembers?.length ? (
          <TableSkeleton columns={memberColumns.length} rows={5} />
        ) : (
          <InfiniteScrollTable
            aria-label={dict.team.memberListTitle}
            columns={memberColumns}
            emptyContent={dict.team.noMembers}
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
              subtitle={dict.team.invitationListSubtitle}
              title={dict.team.invitationListTitle}
            />
          </div>

          {isLoading && !teamInvitations?.length ? (
            <TableSkeleton columns={invitationColumns.length} rows={3} />
          ) : (
            <InfiniteScrollTable
              aria-label={dict.team.invitationListTitle}
              columns={invitationColumns}
              emptyContent={dict.team.noInvitations}
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
          <ModalHeader>{dict.team.invite.title}</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label={dict.team.inviteModal.emailLabel}
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
                label={dict.team.inviteModal.roleLabel}
                selectedKeys={[inviteRole]}
                onChange={(e) => {
                  startTransition(() => {
                    setInviteRole(e.target.value as UserRole);
                  });
                }}
              >
                {Object.entries(roleConfig(dict))
                  .filter(([role]) => role !== "master")
                  .map(([role, config]) => (
                    <SelectItem
                      key={role}
                      startContent={createElement(config.icon, {
                        className: "w-4 h-4",
                      })}
                      textValue={config.label}
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
              {dict.team.inviteModal.cancel}
            </Button>
            <Button
              color="primary"
              isDisabled={!inviteEmail}
              startContent={<FaUserPlus />}
              onPress={handleInvite}
            >
              {dict.team.inviteModal.send}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
