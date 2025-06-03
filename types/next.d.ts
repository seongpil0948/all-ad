// Next.js 15 page component types
export interface PageProps<
  TParams = Record<string, string>,
  TSearchParams = Record<string, string | string[] | undefined>,
> {
  params: Promise<TParams>;
  searchParams: Promise<TSearchParams>;
}

// For static params
export interface StaticPageProps<TParams = Record<string, string>> {
  params: Promise<TParams>;
}

// Legacy types for migration
export interface LegacyPageProps<
  TParams = Record<string, string>,
  TSearchParams = Record<string, string | string[] | undefined>,
> {
  params: TParams;
  searchParams: TSearchParams;
}
