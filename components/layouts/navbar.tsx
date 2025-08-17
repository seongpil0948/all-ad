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
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

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
  const prefersReducedMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (prefersReducedMotion) return; // Avoid scroll-driven motion
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
      <Skeleton
        className="flex rounded-full w-10 h-10"
        data-testid="navbar-user-skeleton"
        aria-label={`${dict.common.loading} ${dict.nav.profile}`}
      />
    ) : user ? (
      <UserDropdown />
    ) : (
      <>
        <Button
          as={NextLink}
          href="/login"
          variant="light"
          data-testid="navbar-login-button"
          aria-label={dict.nav.login}
        >
          {dict.nav.login}
        </Button>
        <Button
          as={NextLink}
          color="primary"
          href="/login"
          variant="flat"
          data-testid="navbar-trial-button"
          aria-label={dict.nav.freeTrial}
        >
          {dict.nav.freeTrial}
        </Button>
      </>
    );

  const effectiveHidden = prefersReducedMotion ? false : hidden;

  return (
    <motion.div
      animate={
        prefersReducedMotion
          ? undefined
          : effectiveHidden
            ? "hidden"
            : "visible"
      }
      className="sticky top-0 z-50"
      transition={
        prefersReducedMotion ? undefined : { duration: 0.3, ease: "easeInOut" }
      }
      variants={prefersReducedMotion ? undefined : navbarVariants}
      data-testid="navbar"
      role="banner"
    >
      <HeroUINavbar
        maxWidth={"xl"}
        isBordered
        isBlurred
        data-testid="main-navbar"
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify={"start"}>
          <NavbarBrand as={"li"} className="gap-3 max-w-fit">
            <NextLink
              className="flex justify-start items-center gap-1"
              href="/"
              aria-label={dict.nav.home}
              data-testid="navbar-logo"
            >
              <p className="font-bold text-inherit text-xl">
                {dict.brand.name}
              </p>
            </NextLink>
          </NavbarBrand>
          <ul
            className="hidden lg:flex gap-4 justify-start ml-8"
            role="navigation"
          >
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium",
                  )}
                  color="foreground"
                  href={item.href}
                  data-testid={`navbar-link-${item.label.toLowerCase().replace(" ", "-")}`}
                  aria-label={getNavLabel(item.label)}
                >
                  {getNavLabel(item.label)}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex basis-1/5 sm:basis-full"
          justify={"end"}
        >
          <NavbarItem className="hidden sm:flex gap-3">
            <Button
              as={NextLink}
              color="primary"
              href="/lab"
              variant="flat"
              data-testid="navbar-lab-button"
              aria-label={dict.nav.lab}
            >
              {dict.nav.lab}
            </Button>
            <LanguageSwitcher />
            <ThemeSwitch />
            <UserOrLogin />
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify={"end"}>
          <Button
            as={NextLink}
            color="primary"
            href="/lab"
            variant="flat"
            data-testid="navbar-mobile-lab-button"
            aria-label={dict.nav.lab}
          >
            {dict.nav.lab}
          </Button>
          <LanguageSwitcher />
          <ThemeSwitch />
          <UserOrLogin />
        </NavbarContent>

        <NavbarMenu data-testid="navbar-mobile-menu">
          <div className="mx-4 mt-2 flex flex-col gap-2" role="navigation">
            {siteConfig.navItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  as={NextLink}
                  className="w-full"
                  color="foreground"
                  href={item.href}
                  size="lg"
                  data-testid={`navbar-mobile-link-${item.label.toLowerCase().replace(" ", "-")}`}
                  aria-label={`Navigate to ${getNavLabel(item.label)}`}
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
                  data-testid="navbar-mobile-login-button"
                  aria-label={dict.nav.login}
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
