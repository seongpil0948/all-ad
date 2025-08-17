// Public content is static, with periodic revalidation
export const revalidate = 3600; // 1 hour
// Opt into Partial Prerendering for this segment tree
export const experimental_ppr = true;

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
