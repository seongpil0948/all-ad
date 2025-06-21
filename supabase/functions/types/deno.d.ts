/// <reference types="https://deno.land/x/types/index.d.ts" />

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.50.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://deno.land/x/redis@v0.31.0/mod.ts" {
  export class Redis {
    constructor(options: { hostname: string; port?: number; password?: string });
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: { ex?: number }): Promise<string>;
    del(key: string): Promise<number>;
    quit(): Promise<void>;
  }
}