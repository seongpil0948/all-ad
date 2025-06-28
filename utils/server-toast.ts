import { redirect } from "next/navigation";

export interface ServerToastOptions {
  type: "success" | "error" | "warning" | "info";
  message: string;
  description?: string;
}

export function redirectWithToast(
  path: string,
  toast: ServerToastOptions,
): never {
  const params = new URLSearchParams({
    toast: toast.type,
    message: toast.message,
  });

  if (toast.description) {
    params.set("description", toast.description);
  }

  redirect(`${path}?${params.toString()}`);
}

export function addToastToUrl(url: string, toast: ServerToastOptions): string {
  const hasQuery = url.includes("?");
  const separator = hasQuery ? "&" : "?";

  const params = new URLSearchParams({
    toast: toast.type,
    message: toast.message,
  });

  if (toast.description) {
    params.set("description", toast.description);
  }

  return `${url}${separator}${params.toString()}`;
}
