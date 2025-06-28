"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Skeleton } from "@heroui/skeleton";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useShallow } from "zustand/shallow";
import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

import { navbarVariants } from "@/utils/animations";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { UserDropdown } from "@/components/user-dropdown";
import { useAuthStore } from "@/stores/useAuthStore";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useDictionary } from "@/hooks/use-dictionary";

export const Navbar = () => {
  const { dictionary: dict } = useDictionary();
  const { user, isLoading, isInitialized } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
      isInitialized: state.isInitialized,
    })),
  );

  const getNavLabel = (label: string) => {
    const navMap: Record<string, string> = {
      홈: dict.nav.home,
      데모: dict.nav.demo,
      요금제: dict.nav.pricing,
      "고객 지원": dict.nav.support,
    };

    return navMap[label] || label;
  };

  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const [lastScrollY, setLastScrollY] = useState(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const difference = latest - lastScrollY;

    if (latest > 100 && difference > 0) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setLastScrollY(latest);
  });

  const UserOrLogin = () =>
    !isInitialized || isLoading ? (
      <Skeleton className="flex rounded-full w-10 h-10" />
    ) : user ? (
      <UserDropdown />
    ) : (
      <>
        <Button as={NextLink} href="/login" variant="light">
          {dict.nav.login}
        </Button>
        <Button as={NextLink} color="primary" href="/login" variant="flat">
          {dict.nav.freeTrial}
        </Button>
      </>
    );

  return (
    <motion.div
      animate={hidden ? "hidden" : "visible"}
      className="sticky top-0 z-50"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      variants={navbarVariants}
    >
      <HeroUINavbar maxWidth="xl">
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink
              className="flex justify-start items-center gap-1"
              href="/"
            >
              <p className="font-bold text-inherit text-xl">A.ll + Ad</p>
            </NextLink>
          </NavbarBrand>
          <ul className="hidden lg:flex gap-4 justify-start ml-8">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {getNavLabel(item.label)}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex basis-1/5 sm:basis-full"
          justify="end"
        >
          <NavbarItem className="hidden sm:flex gap-3">
            <Button as={NextLink} color="primary" href="/lab" variant="flat">
              {dict.nav.lab}
            </Button>
            <LanguageSwitcher />
            <ThemeSwitch />
            <UserOrLogin />
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          <Button as={NextLink} color="primary" href="/lab" variant="flat">
            {dict.nav.lab}
          </Button>
          <LanguageSwitcher />
          <ThemeSwitch />
          <UserOrLogin />
        </NavbarContent>

        <NavbarMenu>
          <div className="mx-4 mt-2 flex flex-col gap-2">
            {siteConfig.navItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  as={NextLink}
                  className="w-full"
                  color="foreground"
                  href={item.href}
                  size="lg"
                >
                  {getNavLabel(item.label)}
                </Link>
              </NavbarMenuItem>
            ))}
            {!user ? (
              <NavbarMenuItem>
                <Button
                  as={NextLink}
                  className="w-full mt-4"
                  color="primary"
                  href="/login"
                  variant="flat"
                >
                  {dict.nav.login}
                </Button>
              </NavbarMenuItem>
            ) : (
              <UserDropdown />
            )}
          </div>
        </NavbarMenu>
      </HeroUINavbar>
    </motion.div>
  );
};
