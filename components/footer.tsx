"use client";

import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: {
      title: "제품",
      links: [
        { label: "기능", href: "#features" },
        { label: "요금제", href: "/pricing" },
        { label: "데모", href: "/demo" },
        { label: "통합", href: "#integrations" },
      ],
    },
    resources: {
      title: "리소스",
      links: [
        { label: "블로그", href: "#blog" },
        { label: "가이드", href: "#guides" },
        { label: "API 문서", href: "#api-docs" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    company: {
      title: "회사",
      links: [
        { label: "소개", href: "#about" },
        { label: "채용", href: "#careers" },
        { label: "파트너", href: "#partners" },
        { label: "문의하기", href: "/contact" },
      ],
    },
    legal: {
      title: "법적 정보",
      links: [
        { label: "이용약관", href: "#terms" },
        { label: "개인정보처리방침", href: "#privacy" },
        { label: "쿠키 정책", href: "#cookies" },
        { label: "보안", href: "#security" },
      ],
    },
  };

  const socialLinks = [
    { icon: <FaFacebook />, href: "#facebook", label: "Facebook" },
    { icon: <FaTwitter />, href: "#twitter", label: "Twitter" },
    { icon: <FaLinkedin />, href: "#linkedin", label: "LinkedIn" },
    { icon: <FaInstagram />, href: "#instagram", label: "Instagram" },
  ];

  return (
    <footer className="bg-default-50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company info */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">올애드</h3>
            <p className="text-default-600 mb-4">
              모든 광고 플랫폼을 하나로. 광고 관리의 새로운 기준을 만들어갑니다.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-default-600">
                <FaEnvelope className="w-4 h-4" />
                <span className="text-sm">support@allad.co.kr</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <FaPhone className="w-4 h-4" />
                <span className="text-sm">02-1234-5678</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <FaMapMarkerAlt className="w-4 h-4" />
                <span className="text-sm">서울특별시 강남구 테헤란로 123</span>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      as={NextLink}
                      className="text-sm text-default-600 hover:text-primary"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="bg-default-100 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">뉴스레터 구독</h4>
              <p className="text-sm text-default-600">
                최신 업데이트와 팁을 이메일로 받아보세요
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                className="px-4 py-2 rounded-lg bg-white dark:bg-default-50 flex-1 md:w-64"
                placeholder="이메일 주소"
                type="email"
              />
              <Button color="primary" variant="solid">
                구독하기
              </Button>
            </div>
          </div>
        </div>

        <Divider className="mb-6" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-default-600">
            © {currentYear} 올애드. All rights reserved.
          </p>

          {/* Social links */}
          <div className="flex gap-3">
            {socialLinks.map((social) => (
              <Button
                key={social.label}
                isIconOnly
                aria-label={social.label}
                as={Link}
                href={social.href}
                size="sm"
                variant="light"
              >
                {social.icon}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
