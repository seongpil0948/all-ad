import { AlertTriangle } from "lucide-react";
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            인증 오류
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            인증 코드가 유효하지 않거나 만료되었습니다.
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              다음과 같은 이유로 인증에 실패할 수 있습니다:
            </p>

            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>인증 링크가 만료되었습니다 (1시간 후 만료)</li>
              <li>인증 링크가 이미 사용되었습니다</li>
              <li>잘못된 링크를 클릭하셨습니다</li>
            </ul>

            <div className="pt-4 border-t border-gray-200">
              <p className="mb-3 text-sm text-gray-700">해결 방법:</p>

              <div className="space-y-2">
                <Button
                  fullWidth
                  as={Link}
                  color="primary"
                  href="/forgot-password"
                >
                  비밀번호 재설정 다시 요청
                </Button>

                <Button fullWidth as={Link} href="/login" variant="bordered">
                  로그인 페이지로 돌아가기
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            문제가 지속되면 고객 지원팀에 문의하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
