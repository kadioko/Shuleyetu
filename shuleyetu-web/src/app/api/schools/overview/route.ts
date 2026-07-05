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
    const today = new Date().toISOString().slice(0, 10);

    const [
      { count: classCount },
      { count: studentCount },
      { count: staffCount },
      { count: attendanceToday },
      { data: feesDue },
      { data: recentStudents },
      { data: recentAnnouncements },
    ] = await Promise.all([
      supabaseServerClient
        .from("school_classes")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId),
      supabaseServerClient
        .from("school_students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "active"),
      supabaseServerClient
        .from("school_staff")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "active"),
      supabaseServerClient
        .from("school_attendance")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("attendance_date", today),
      supabaseServerClient
        .from("school_fees")
        .select("amount_tzs")
        .eq("school_id", schoolId)
        .in("status", ["pending", "partial"]),
      supabaseServerClient
        .from("school_students")
        .select("id, first_name, last_name, admission_number, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseServerClient
        .from("school_announcements")
        .select("id, title, audience, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const feesDueTotal = (feesDue ?? []).reduce(
      (sum, f) => sum + Number(f.amount_tzs || 0),
      0,
    );

    return jsonOk({
      classes: classCount ?? 0,
      students: studentCount ?? 0,
      staff: staffCount ?? 0,
      attendanceToday: attendanceToday ?? 0,
      feesDue: feesDueTotal,
      recentStudents: recentStudents ?? [],
      recentAnnouncements: recentAnnouncements ?? [],
    });
  } catch (error) {
    logError("Unexpected error in school overview", error);
    return jsonError("Internal server error", 500);
  }
}
