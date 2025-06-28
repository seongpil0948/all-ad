import ContactForm from "./ContactForm";

import { title } from "@/components/primitives";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={title({ size: "sm" })}>영업팀 문의</h1>
          <p className="text-sm text-default-500 mt-2">
            엔터프라이즈 솔루션에 대해 문의하시면 영업팀이 연락드리겠습니다.
          </p>
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
