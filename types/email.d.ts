// 이메일 관련 타입 정의

export interface EmailTemplateData {
  inviterName: string;
  teamName: string;
  invitationLink: string;
  email?: string;
}
