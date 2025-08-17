import "../app/globals.css";
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import React from "react";
import { HeroUIProvider } from "@heroui/system";

// Mock dictionary context for tests
const mockDictionary = {
  nav: {
    profile: "Profile",
    settings: "Settings",
    team: "Team",
    analytics: "Analytics",
    help: "Help",
    logout: "Logout",
  },
  common: {
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
  },
};

// Mock dictionary context provider
const DictionaryProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-dictionary={JSON.stringify(mockDictionary)}>{children}</div>;
};

// Mock auth context for tests
const mockAuthUser = {
  id: "test-user-123",
  email: "test.user@example.com",
  user_metadata: {
    full_name: "Test User",
  },
};

// Mock Zustand store
(globalThis as any).__MOCK_AUTH_STATE__ = {
  user: mockAuthUser,
};

// Mock Next.js router
const mockRouter = {
  push: (path: string) => {
    console.log(`Router navigated to: ${path}`);
  },
  replace: (path: string) => {
    console.log(`Router replaced with: ${path}`);
  },
  back: () => {
    console.log("Router went back");
  },
  forward: () => {
    console.log("Router went forward");
  },
  refresh: () => {
    console.log("Router refreshed");
  },
  pathname: "/test",
  query: {},
};

// Mock next/navigation
Object.defineProperty(window, "__NEXT_ROUTER__", {
  value: mockRouter,
  writable: true,
});

// Also mock the useRouter hook
(globalThis as any).__MOCK_USE_ROUTER__ = () => mockRouter;

export type HooksConfig = {
  user?: typeof mockAuthUser;
  dictionary?: typeof mockDictionary;
  theme?: "light" | "dark";
};

beforeMount<HooksConfig>(async ({ App, hooksConfig }) => {
  // Set up mock auth state if provided
  if (hooksConfig?.user) {
    (globalThis as any).__MOCK_AUTH_STATE__ = {
      user: hooksConfig.user,
    };
  }

  // Wrap component with necessary providers
  return (
    <HeroUIProvider>
      <DictionaryProvider>
        <App />
      </DictionaryProvider>
    </HeroUIProvider>
  );
});
