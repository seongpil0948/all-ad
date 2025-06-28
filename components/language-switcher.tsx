"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select, SelectItem } from "@heroui/select";
import { Globe } from "lucide-react";

import { useDictionary } from "@/hooks/use-dictionary";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useDictionary();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLanguageChange = (keys: any) => {
    const selectedKeys = keys instanceof Set ? keys : new Set([keys]);
    const newLocale = Array.from(selectedKeys)[0];

    if (newLocale && newLocale !== locale) {
      const segments = pathname.split("/");

      segments[1] = newLocale;
      router.push(segments.join("/"));
    }
  };

  return (
    <Select
      aria-label="Select language"
      className="w-[140px]"
      defaultSelectedKeys={[locale]}
      startContent={<Globe className="w-4 h-4" />}
      onSelectionChange={handleLanguageChange}
    >
      {languages.map((lang) => (
        <SelectItem key={lang.code} textValue={lang.name}>
          <span className="flex items-center gap-2">
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </span>
        </SelectItem>
      ))}
    </Select>
  );
}
