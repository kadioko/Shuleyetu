import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema, ZodError } from "zod";
import { jsonError } from "./apiUtils";

export type ValidationResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: ZodError };

export function safeParse<T>(schema: ZodSchema<T>, value: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  return { success: false, error: parsed.error };
}

export function formatZodErrors(error: ZodError): string {
  return error.issues.map((e) => `${e.path.join(".") || "input"}: ${e.message}`).join("; ");
}

export async function validateRequest<TBody, TQuery extends Record<string, unknown>>(
  request: NextRequest,
  options: { body: ZodSchema<TBody>; query: ZodSchema<TQuery> }
): Promise<
  | { ok: true; body: TBody; query: TQuery }
  | { ok: false; response: NextResponse<{ error: string; details?: string }> }
>;
export async function validateRequest<TBody>(
  request: NextRequest,
  options: { body: ZodSchema<TBody> }
): Promise<
  | { ok: true; body: TBody }
  | { ok: false; response: NextResponse<{ error: string; details?: string }> }
>;
export async function validateRequest<TQuery extends Record<string, unknown>>(
  request: NextRequest,
  options: { query: ZodSchema<TQuery> }
): Promise<
  | { ok: true; query: TQuery }
  | { ok: false; response: NextResponse<{ error: string; details?: string }> }
>;
export async function validateRequest<TBody = unknown, TQuery extends Record<string, unknown> = Record<string, unknown>>(
  request: NextRequest,
  options: {
    body?: ZodSchema<TBody>;
    query?: ZodSchema<TQuery>;
  }
): Promise<
  | { ok: true; body?: TBody; query?: TQuery }
  | { ok: false; response: NextResponse<{ error: string; details?: string }> }
> {
  let body: unknown = undefined;
  if (options.body) {
    try {
      body = await request.json().catch(() => null);
    } catch {
      body = null;
    }
    const parsed = safeParse(options.body, body);
    if (!parsed.success) {
      return {
        ok: false,
        response: jsonError("Invalid request body", 400, {
          details: formatZodErrors(parsed.error),
        }),
      };
    }
    body = parsed.data;
  }

  let query: unknown = undefined;
  if (options.query) {
    const searchParams = new URL(request.url).searchParams;
    const obj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    const parsed = safeParse(options.query, obj);
    if (!parsed.success) {
      return {
        ok: false,
        response: jsonError("Invalid query parameters", 400, {
          details: formatZodErrors(parsed.error),
        }),
      };
    }
    query = parsed.data;
  }

  return { ok: true, body: body as TBody | undefined, query: query as TQuery | undefined };
}

// Common schemas
export const emailSchema = z.string().email("Invalid email address").max(254);
export const uuidSchema = z.string().uuid("Invalid identifier");
export const phoneSchema = z.string().regex(/^\+?[\d\s\-()]{7,20}$/, "Invalid phone number").optional();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const statusSchema = z.enum(["active", "inactive", "transferred", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]);

// Contact
export const contactSubjectSchema = z.enum([
  "General Inquiry",
  "Vendor Partnership",
  "Order Support",
  "Technical Issue",
  "Feedback",
  "Other",
]);

export const contactBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: emailSchema,
  subject: contactSubjectSchema,
  message: z.string().min(1, "Message is required").max(2000),
});

// Newsletter
export const newsletterBodySchema = z.object({
  email: emailSchema,
});

// Vendor reviews
export const reviewBodySchema = z.object({
  vendor_id: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
