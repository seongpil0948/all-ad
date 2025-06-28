"use client";

import type { Dictionary, Locale } from "@/app/[lang]/dictionaries";

import { createContext, useContext } from "react";

const DictionaryContext = createContext<{
  dictionary: Dictionary;
  locale: Locale;
} | null>(null);

export function DictionaryProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <DictionaryContext.Provider value={{ dictionary, locale }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const context = useContext(DictionaryContext);

  if (!context) {
    throw new Error("useDictionary must be used within a DictionaryProvider");
  }

  return context;
}
