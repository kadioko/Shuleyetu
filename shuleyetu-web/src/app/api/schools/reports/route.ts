import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireSchoolUser } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const schoolId = auth.schoolId;
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const [
      { data: classes },
      { data: attendance },
      { data: fees },
      { data: payments },
      { data: studentsByClass },
    ] = await Promise.all([
      supabaseServerClient
        .from("school_classes")
        .select("id, name")
        .eq("school_id", schoolId),
      supabaseServerClient
        .from("school_attendance")
        .select("status, class_id")
        .eq("school_id", schoolId)
        .eq("attendance_date", date),
      supabaseServerClient
        .from("school_fees")
        .select("id, amount_tzs, status")
        .eq("school_id", schoolId),
      supabaseServerClient
        .from("school_fee_payments")
        .select("amount_tzs, fee_id, school_fees!inner(id, school_id)")
        .eq("school_fees.school_id", schoolId),
      supabaseServerClient
        .from("school_students")
        .select("class_id, school_classes(name)")
        .eq("school_id", schoolId)
        .eq("status", "active"),
    ]);

    const classById = Object.fromEntries(
      (classes ?? []).map((c) => [c.id, c.name]),
    );

    const attendanceSummary: Record<string, Record<string, number>> = {};
    for (const record of attendance ?? []) {
      const className = classById[record.class_id] ?? "Unassigned";
      if (!attendanceSummary[className]) {
        attendanceSummary[className] = {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }
      attendanceSummary[className][record.status] =
        (attendanceSummary[className][record.status] ?? 0) + 1;
    }

    const totalInvoiced = (fees ?? []).reduce(
      (sum, f) => sum + Number(f.amount_tzs || 0),
      0,
    );
    const totalPaid = (payments ?? []).reduce(
      (sum, p) => sum + Number(p.amount_tzs || 0),
      0,
    );
    const totalDue = Math.max(0, totalInvoiced - totalPaid);

    const enrollmentSummary: Record<string, number> = {};
    for (const record of studentsByClass ?? []) {
      const classRecord = record.school_classes as
        | { name: string | null }[]
        | null;
      const className = classRecord?.[0]?.name ?? "Unassigned";
      enrollmentSummary[className] = (enrollmentSummary[className] ?? 0) + 1;
    }

    return jsonOk({
      date,
      attendanceSummary,
      feeSummary: {
        totalInvoiced,
        totalPaid,
        totalDue,
      },
      enrollmentSummary,
    });
  } catch (error) {
    logError("Unexpected error in school reports", error);
    return jsonError("Internal server error", 500);
  }
}
