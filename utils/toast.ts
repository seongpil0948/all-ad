import { addToast as heroUIAddToast } from "@heroui/toast";

import log from "@/utils/logger";

export type ToastColor =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger";
export type ToastVariant = "solid" | "bordered" | "flat";

interface ToastOptions {
  title: string;
  description?: string;
  color?: ToastColor;
  variant?: ToastVariant;
  timeout?: number;
}

export const toast = {
  success: (options: Omit<ToastOptions, "color">) => {
    log.info("Toast success:", { message: options.title });
    heroUIAddToast({
      ...options,
      color: "success",
      variant: options.variant || "flat",
      timeout: options.timeout || 4000,
    });
  },

  error: (options: Omit<ToastOptions, "color">) => {
    log.error("Toast error:", { message: options.title });
    heroUIAddToast({
      ...options,
      color: "danger",
      variant: options.variant || "flat",
      timeout: options.timeout || 6000,
    });
  },

  warning: (options: Omit<ToastOptions, "color">) => {
    log.warn("Toast warning:", { message: options.title });
    heroUIAddToast({
      ...options,
      color: "warning",
      variant: options.variant || "flat",
      timeout: options.timeout || 5000,
    });
  },

  info: (options: Omit<ToastOptions, "color">) => {
    log.info("Toast info:", { message: options.title });
    heroUIAddToast({
      ...options,
      color: "primary",
      variant: options.variant || "flat",
      timeout: options.timeout || 4000,
    });
  },

  promise: async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
  ): Promise<T> => {
    const loadingToast = heroUIAddToast({
      title: messages.loading,
      color: "default",
      variant: "flat",
      promise: promise,
    });

    try {
      const result = await promise;
      const successMessage =
        typeof messages.success === "function"
          ? messages.success(result)
          : messages.success;

      heroUIAddToast({
        title: successMessage,
        color: "success",
        variant: "flat",
        timeout: 4000,
      });

      return result;
    } catch (error) {
      const errorMessage =
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error;

      heroUIAddToast({
        title: errorMessage,
        color: "danger",
        variant: "flat",
        timeout: 6000,
      });

      throw error;
    }
  },

  custom: (options: ToastOptions) => {
    log.info("Toast custom:", { message: options.title });
    heroUIAddToast({
      ...options,
      variant: options.variant || "flat",
      timeout: options.timeout || 4000,
    });
  },
};

export const showToast = toast;
