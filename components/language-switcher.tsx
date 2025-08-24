"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { locale, dictionary: dict } = useDictionary();

  // Hydration: avoid mismatch by not relying on defaultSelectedKeys (which is only initial) and
  // instead moving to a controlled selectedKeys once mounted. This prevents React Aria from
  // regenerating a differing internal id mapping between SSR and CSR phases.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      aria-label={`${dict.common.select} ${dict.common.language}`}
      className="w-[140px]"
      // Use controlled selection after mount to keep SSR markup stable
      selectedKeys={mounted ? new Set([locale]) : new Set()}
      startContent={<Globe className="w-4 h-4" aria-hidden={true} />}
      onSelectionChange={handleLanguageChange}
      data-testid="language-switcher"
      variant="flat"
      size="sm"
    >
      {languages.map((lang) => (
        <SelectItem
          key={lang.code}
          textValue={lang.name}
          data-testid={`language-option-${lang.code}`}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden={true}>{lang.flag}</span>
            <span>{lang.name}</span>
          </span>
        </SelectItem>
      ))}
    </Select>
  );
}
