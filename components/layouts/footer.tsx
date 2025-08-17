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
import { Container } from "@/components/layouts/Container";

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
    <footer
      className="bg-default-50 pt-16 pb-8"
      data-testid="footer"
      role="contentinfo"
      aria-label={dict.footer.company}
    >
      <Container>
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company info */}
          <div className="lg:col-span-2" data-testid="footer-company-info">
            <h3 className="text-xl font-bold mb-4">
              {dict.footer.companyInfo.name}
            </h3>
            <p className="text-default-600 mb-4">
              {dict.footer.companyInfo.tagline}
            </p>
            <div
              className="space-y-2"
              role="list"
              aria-label={dict.footer.contact}
            >
              <div
                className="flex items-center gap-2 text-default-600"
                role="listitem"
              >
                <FaEnvelope className="w-4 h-4" aria-hidden={true} />
                <a
                  href={`mailto:${dict.footer.companyInfo.email}`}
                  className="text-sm hover:text-primary"
                  aria-label={`${dict.footer.contact}: ${dict.footer.companyInfo.email}`}
                  data-testid="footer-email-link"
                >
                  {dict.footer.companyInfo.email}
                </a>
              </div>
              <div
                className="flex items-center gap-2 text-default-600"
                role="listitem"
              >
                <FaPhone className="w-4 h-4" aria-hidden={true} />
                <a
                  href={`tel:${dict.footer.companyInfo.phone}`}
                  className="text-sm hover:text-primary"
                  aria-label={`${dict.footer.contact}: ${dict.footer.companyInfo.phone}`}
                  data-testid="footer-phone-link"
                >
                  {dict.footer.companyInfo.phone}
                </a>
              </div>
              <div
                className="flex items-center gap-2 text-default-600"
                role="listitem"
              >
                <FaMapMarkerAlt className="w-4 h-4" aria-hidden={true} />
                <address className="text-sm not-italic">
                  {dict.footer.companyInfo.address}
                </address>
              </div>
            </div>
          </div>

          {/* Links sections */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key} data-testid={`footer-section-${key}`}>
              <h4 className="font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2" role="list" aria-label={section.title}>
                {section.links.map((link) => (
                  <li key={link.label} role="listitem">
                    <Link
                      as={NextLink}
                      className="text-sm text-default-600 hover:text-primary"
                      href={link.href}
                      data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
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
        <div
          className="bg-default-100 rounded-xl p-6 mb-8"
          data-testid="footer-newsletter"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold mb-1">
                {dict.footer.newsletter.title}
              </h4>
              <p className="text-sm text-default-600">
                {dict.footer.newsletter.subtitle}
              </p>
            </div>
            <form
              className="flex gap-2 w-full md:w-auto"
              data-testid="newsletter-form"
            >
              <Input
                className="flex-1 md:w-64"
                placeholder={dict.footer.newsletter.placeholder}
                type="email"
                variant="flat"
                name="email"
                aria-label={dict.footer.newsletter.placeholder}
                data-testid="newsletter-email-input"
                required
              />
              <Button
                color="primary"
                variant="solid"
                type="submit"
                data-testid="newsletter-subscribe-button"
                aria-label={dict.footer.newsletter.subscribe}
              >
                {dict.footer.newsletter.subscribe}
              </Button>
            </form>
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
          <div
            className="flex gap-3"
            role="list"
            aria-label={dict.footer.resources}
          >
            {socialLinks.map((social) => (
              <Button
                key={social.label}
                isIconOnly
                aria-label={social.label}
                as={Link}
                href={social.href}
                size="sm"
                variant="light"
                role="listitem"
                data-testid={`footer-social-${social.label.toLowerCase()}`}
              >
                <span aria-hidden={true}>{social.icon}</span>
              </Button>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
};
