"use client";

import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
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

import { useDictionary } from "@/hooks/use-dictionary";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { dictionary: dict } = useDictionary();

  const footerLinks = {
    product: {
      title: dict.footer.product,
      links: [
        { label: dict.footer.features, href: "#features" },
        { label: dict.footer.pricing, href: "/pricing" },
        { label: dict.nav.demo, href: "/demo" },
        { label: dict.footer.integrations, href: "#integrations" },
      ],
    },
    resources: {
      title: dict.footer.resources,
      links: [
        { label: dict.footer.blog, href: "#blog" },
        { label: dict.footer.guides, href: "#guides" },
        { label: dict.footer.apiDocs, href: "#api-docs" },
        { label: dict.faq.title, href: "#faq" },
      ],
    },
    company: {
      title: dict.footer.company,
      links: [
        { label: dict.footer.about, href: "#about" },
        { label: dict.footer.careers, href: "#careers" },
        { label: dict.footer.partners, href: "#partners" },
        { label: dict.footer.contact, href: "/contact" },
      ],
    },
    legal: {
      title: dict.footer.legal,
      links: [
        { label: dict.footer.terms, href: "/terms" },
        { label: dict.footer.privacy, href: "/privacy" },
        { label: dict.footer.refund, href: "/refund-policy" },
        { label: dict.footer.cookies, href: "/cookies" },
        { label: dict.footer.security, href: "#security" },
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
            <h3 className="text-xl font-bold mb-4">
              {dict.footer.companyInfo.name}
            </h3>
            <p className="text-default-600 mb-4">
              {dict.footer.companyInfo.tagline}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-default-600">
                <FaEnvelope className="w-4 h-4" />
                <span className="text-sm">{dict.footer.companyInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <FaPhone className="w-4 h-4" />
                <span className="text-sm">{dict.footer.companyInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-default-600">
                <FaMapMarkerAlt className="w-4 h-4" />
                <span className="text-sm">
                  {dict.footer.companyInfo.address}
                </span>
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
              <h4 className="font-semibold mb-1">
                {dict.footer.newsletter.title}
              </h4>
              <p className="text-sm text-default-600">
                {dict.footer.newsletter.subtitle}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                className="flex-1 md:w-64"
                placeholder={dict.footer.newsletter.placeholder}
                type="email"
                variant="flat"
              />
              <Button color="primary" variant="solid">
                {dict.footer.newsletter.subscribe}
              </Button>
            </div>
          </div>
        </div>

        <Divider className="mb-6" />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-default-600">
            {dict.footer.companyInfo.copyright
              .replace("{{year}}", currentYear.toString())
              .replace("{{company}}", dict.footer.companyInfo.name)}
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
