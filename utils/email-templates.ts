/**
 * Email templates for the AllAd platform
 */

import { EmailTemplateData } from "@/types/email";

const baseStyles = {
  container: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
  `,
  header: `
    text-align: center;
    padding: 30px 0;
    border-bottom: 1px solid #e5e7eb;
  `,
  logo: `
    font-size: 28px;
    font-weight: bold;
    color: #3b82f6;
    text-decoration: none;
  `,
  title: `
    color: #111827;
    font-size: 24px;
    font-weight: 600;
    margin: 30px 0 20px;
    text-align: center;
  `,
  paragraph: `
    color: #4b5563;
    font-size: 16px;
    line-height: 24px;
    margin: 16px 0;
  `,
  button: `
    display: inline-block;
    background-color: #3b82f6;
    color: white;
    padding: 12px 32px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 16px;
    margin: 24px 0;
  `,
  buttonContainer: `
    text-align: center;
    margin: 32px 0;
  `,
  link: `
    color: #6b7280;
    word-break: break-all;
    font-size: 14px;
  `,
  footer: `
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  `,
  highlight: `
    color: #3b82f6;
    font-weight: 600;
  `,
};

export function getTeamInvitationEmailTemplate(
  data: EmailTemplateData,
): string {
  const { inviterName, teamName, invitationLink } = data;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Team Invitation - AllAd</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="${baseStyles.container}">
        <!-- Header -->
        <div style="${baseStyles.header}">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://allad.com"}" style="${baseStyles.logo}">
            AllAd
          </a>
        </div>

        <!-- Content -->
        <h1 style="${baseStyles.title}">팀 초대장</h1>
        
        <p style="${baseStyles.paragraph}">
          안녕하세요,
        </p>
        
        <p style="${baseStyles.paragraph}">
          <span style="${baseStyles.highlight}">${inviterName}</span>님이 
          <span style="${baseStyles.highlight}">${teamName}</span> 팀에 
          귀하를 초대했습니다.
        </p>
        
        <p style="${baseStyles.paragraph}">
          AllAd는 여러 광고 플랫폼을 하나의 대시보드에서 관리할 수 있는 
          통합 광고 관리 솔루션입니다. 팀원들과 함께 효율적으로 
          광고 캠페인을 관리하고 성과를 분석할 수 있습니다.
        </p>

        <!-- CTA Button -->
        <div style="${baseStyles.buttonContainer}">
          <a href="${invitationLink}" style="${baseStyles.button}">
            초대 수락하기
          </a>
        </div>
        
        <p style="${baseStyles.paragraph}">
          또는 아래 링크를 브라우저에 복사하여 붙여넣으세요:
        </p>
        
        <p style="${baseStyles.link}">
          ${invitationLink}
        </p>
        
        <p style="${baseStyles.paragraph}">
          이 초대장은 7일 후에 만료됩니다.
        </p>

        <!-- Footer -->
        <div style="${baseStyles.footer}">
          <p style="margin: 8px 0;">
            이 초대를 받을 예정이 아니었다면, 이 이메일을 무시하셔도 됩니다.
          </p>
          <p style="margin: 8px 0;">
            © ${new Date().getFullYear()} AllAd. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getWelcomeEmailTemplate(data: {
  userName: string;
  teamName: string;
}): string {
  const { userName, teamName } = data;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AllAd</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="${baseStyles.container}">
        <!-- Header -->
        <div style="${baseStyles.header}">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://allad.com"}" style="${baseStyles.logo}">
            AllAd
          </a>
        </div>

        <!-- Content -->
        <h1 style="${baseStyles.title}">AllAd에 오신 것을 환영합니다!</h1>
        
        <p style="${baseStyles.paragraph}">
          안녕하세요 ${userName}님,
        </p>
        
        <p style="${baseStyles.paragraph}">
          <span style="${baseStyles.highlight}">${teamName}</span> 팀의 일원이 되신 것을 환영합니다!
        </p>
        
        <p style="${baseStyles.paragraph}">
          이제 팀원들과 함께 광고 캠페인을 관리하고, 
          실시간으로 성과를 모니터링하며, 
          데이터 기반의 의사결정을 내릴 수 있습니다.
        </p>

        <h2 style="color: #374151; font-size: 18px; margin-top: 32px;">
          시작하기
        </h2>
        
        <ul style="color: #4b5563; font-size: 16px; line-height: 28px;">
          <li>광고 플랫폼 연동하기</li>
          <li>대시보드 커스터마이징</li>
          <li>팀원들과 협업하기</li>
          <li>리포트 생성 및 공유</li>
        </ul>

        <!-- CTA Button -->
        <div style="${baseStyles.buttonContainer}">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://allad.com"}/dashboard" style="${baseStyles.button}">
            대시보드로 이동
          </a>
        </div>

        <!-- Footer -->
        <div style="${baseStyles.footer}">
          <p style="margin: 8px 0;">
            도움이 필요하시면 언제든지 문의해주세요.
          </p>
          <p style="margin: 8px 0;">
            © ${new Date().getFullYear()} AllAd. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailTemplate(data: {
  resetLink: string;
}): string {
  const { resetLink } = data;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - AllAd</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="${baseStyles.container}">
        <!-- Header -->
        <div style="${baseStyles.header}">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://allad.com"}" style="${baseStyles.logo}">
            AllAd
          </a>
        </div>

        <!-- Content -->
        <h1 style="${baseStyles.title}">비밀번호 재설정</h1>
        
        <p style="${baseStyles.paragraph}">
          비밀번호 재설정을 요청하셨습니다. 
          아래 버튼을 클릭하여 새로운 비밀번호를 설정하세요.
        </p>

        <!-- CTA Button -->
        <div style="${baseStyles.buttonContainer}">
          <a href="${resetLink}" style="${baseStyles.button}">
            비밀번호 재설정
          </a>
        </div>
        
        <p style="${baseStyles.paragraph}">
          또는 아래 링크를 브라우저에 복사하여 붙여넣으세요:
        </p>
        
        <p style="${baseStyles.link}">
          ${resetLink}
        </p>
        
        <p style="${baseStyles.paragraph}">
          이 링크는 1시간 후에 만료됩니다. 
          비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.
        </p>

        <!-- Footer -->
        <div style="${baseStyles.footer}">
          <p style="margin: 8px 0;">
            보안을 위해 이 이메일의 링크를 다른 사람과 공유하지 마세요.
          </p>
          <p style="margin: 8px 0;">
            © ${new Date().getFullYear()} AllAd. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
