"use client";

import { Accordion, AccordionItem } from "@heroui/accordion";
import { Card, CardBody } from "@heroui/card";
import { Code } from "@heroui/code";
import { Divider } from "@heroui/divider";
import { Link } from "@heroui/link";
import { Chip } from "@heroui/chip";
import React from "react";

interface SetupGuideSection {
  title: string;
  type?: "error" | "warning" | "info" | "success";
  content: React.ReactNode;
}

interface QuickLink {
  label: string;
  url: string;
}

interface Note {
  type: "warning" | "info";
  content: string;
}

export interface PlatformSetupGuideProps {
  platform: string;
  title: string;
  icon?: string;
  themeColor: "amber" | "blue" | "green" | "purple" | "red";
  sections: SetupGuideSection[];
  quickLinks?: QuickLink[];
  notes?: Note[];
  defaultExpanded?: boolean;
}

const colorMap = {
  amber: "bg-amber-50 border-amber-200",
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  red: "bg-red-50 border-red-200",
};

const sectionColorMap = {
  error: "text-red-600",
  warning: "text-orange-600",
  info: "text-blue-600",
  success: "text-green-600",
};

const noteColorMap = {
  warning: "bg-orange-50 border-orange-200 text-orange-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

export function PlatformSetupGuide({
  platform,
  title,
  icon = "🔧",
  themeColor,
  sections,
  quickLinks,
  notes,
  defaultExpanded = false,
}: PlatformSetupGuideProps) {
  const defaultKeys = defaultExpanded ? [`${platform}-guide`] : [];

  return (
    <Accordion defaultExpandedKeys={defaultKeys}>
      <AccordionItem
        key={`${platform}-guide`}
        aria-label={title}
        title={
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="font-medium">{title}</span>
          </div>
        }
      >
        <Card className={`${colorMap[themeColor]} border`}>
          <CardBody className="space-y-4">
            {/* Quick Links */}
            {quickLinks && quickLinks.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((link, index) => {
                    const REL_EXTERNAL = "noopener noreferrer" as const;
                    const TARGET_BLANK = "_blank" as const;
                    return (
                      <Link
                        key={index}
                        href={link.url}
                        rel={REL_EXTERNAL}
                        target={TARGET_BLANK}
                      >
                        <Chip color="primary" variant="flat">
                          {link.label}
                        </Chip>
                      </Link>
                    );
                  })}
                </div>
                <Divider />
              </>
            )}

            {/* Sections */}
            {sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h4
                  className={`font-semibold ${section.type ? sectionColorMap[section.type] : ""}`}
                >
                  {section.title}
                </h4>
                <div className="space-y-2">{section.content}</div>
                {index < sections.length - 1 && <Divider className="my-4" />}
              </div>
            ))}

            {/* Notes */}
            {notes && notes.length > 0 && (
              <>
                <Divider />
                <div className="space-y-2">
                  {notes.map((note, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${noteColorMap[note.type]}`}
                    >
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </AccordionItem>
    </Accordion>
  );
}

// Helper components for common patterns
export function GuideCodeBlock({ children }: { children: string }) {
  return <Code className="text-xs">{children}</Code>;
}

export function GuideList({
  items,
  ordered = false,
}: {
  items: React.ReactNode[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag
      className={`${ordered ? "list-decimal" : "list-disc"} list-inside space-y-1 text-sm`}
    >
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}
