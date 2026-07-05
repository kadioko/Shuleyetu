import { NextRequest } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServer";
import { requireSchoolUser } from "@/lib/schoolAuth";
import { jsonError, jsonOk } from "@/lib/apiUtils";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const demoClassNames = ["Form 1A", "Form 2B", "Form 3C", "Kindergarten 1"];

const demoStaff = [
  {
    employee_id: "TCH-001",
    first_name: "John",
    last_name: "Bwire",
    email: "john.bwire@school.demo",
    phone: "+255 712 111 000",
    role: "admin" as const,
    subject: "Administration",
  },
  {
    employee_id: "TCH-002",
    first_name: "Grace",
    last_name: "Musa",
    email: "grace.musa@school.demo",
    phone: "+255 712 222 000",
    role: "teacher" as const,
    subject: "Mathematics",
  },
  {
    employee_id: "TCH-003",
    first_name: "Peter",
    last_name: "Kato",
    email: "peter.kato@school.demo",
    phone: "+255 712 333 000",
    role: "teacher" as const,
    subject: "Science",
  },
  {
    employee_id: "SUP-001",
    first_name: "Amina",
    last_name: "Juma",
    email: "amina.juma@school.demo",
    phone: "+255 712 444 000",
    role: "support" as const,
    subject: "Office",
  },
];

const studentData = [
  { first_name: "Asha", last_name: "Musa", gender: "female" as const, class_name: "Form 1A" },
  { first_name: "Juma", last_name: "Kato", gender: "male" as const, class_name: "Form 1A" },
  { first_name: "Grace", last_name: "Bwire", gender: "female" as const, class_name: "Form 1A" },
  { first_name: "David", last_name: "Okello", gender: "male" as const, class_name: "Form 2B" },
  { first_name: "Mary", last_name: "Ncube", gender: "female" as const, class_name: "Form 2B" },
  { first_name: "Samuel", last_name: "Mwangi", gender: "male" as const, class_name: "Form 2B" },
  { first_name: "Zainab", last_name: "Hassan", gender: "female" as const, class_name: "Form 3C" },
  { first_name: "Emmanuel", last_name: "Tesfaye", gender: "male" as const, class_name: "Form 3C" },
  { first_name: "Joyce", last_name: "Mensah", gender: "female" as const, class_name: "Form 3C" },
  { first_name: "Ibrahim", last_name: "Said", gender: "male" as const, class_name: "Kindergarten 1" },
  { first_name: "Linda", last_name: "Kibet", gender: "female" as const, class_name: "Kindergarten 1" },
  { first_name: "Brian", last_name: "Oduor", gender: "male" as const, class_name: "Kindergarten 1" },
];

const feeTemplates = [
  { description: "Tuition Term 2", amount: 150000 },
  { description: "Exam Fee", amount: 25000 },
  { description: "Sports & Activities", amount: 15000 },
];

const attendanceStatuses = ["present", "present", "absent", "late", "excused"] as const;

const announcements = [
  {
    title: "Welcome to the new school portal",
    content: "All staff and parents can now track attendance, fees, and announcements in one place.",
    audience: "all" as const,
  },
  {
    title: "Mid-term exams start next Monday",
    content: "Please ensure students arrive on time and have all required materials.",
    audience: "parents" as const,
  },
  {
    title: "Staff meeting Friday 3 PM",
    content: "Attendance is required for all teaching and administrative staff.",
    audience: "staff" as const,
  },
];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSchoolUser(request);
    if (!auth.ok) return auth.response;

    const schoolId = auth.schoolId;

    // Prevent duplicate demo data
    const { data: existingClasses } = await supabaseServerClient
      .from("school_classes")
      .select("id")
      .eq("school_id", schoolId)
      .in("name", demoClassNames)
      .limit(1);

    if (existingClasses && existingClasses.length > 0) {
      return jsonError(
        "Demo data has already been loaded for this school.",
        409,
      );
    }

    // Insert classes
    const { data: classes, error: classError } = await supabaseServerClient
      .from("school_classes")
      .insert(
        demoClassNames.map((name, index) => ({
          school_id: schoolId,
          name,
          grade: name.split(" ")[0],
          stream: name.split(" ")[1] ?? null,
          capacity: 40,
        })),
      )
      .select("id, name");

    if (classError || !classes) {
      logError("Error creating demo classes", classError, { schoolId });
      return jsonError("Failed to create demo classes", 500);
    }

    const classByName = Object.fromEntries(
      classes.map((c) => [c.name, c.id]),
    );

    // Insert staff
    const { error: staffError } = await supabaseServerClient
      .from("school_staff")
      .insert(
        demoStaff.map((s) => ({
          school_id: schoolId,
          ...s,
          status: "active",
        })),
      );

    if (staffError) {
      logError("Error creating demo staff", staffError, { schoolId });
      return jsonError("Failed to create demo staff", 500);
    }

    // Insert students
    const studentsToInsert = studentData.map((s, index) => ({
      school_id: schoolId,
      admission_number: `DEMO-${String(index + 1).padStart(3, "0")}`,
      first_name: s.first_name,
      last_name: s.last_name,
      gender: s.gender,
      class_id: classByName[s.class_name],
      date_of_birth: `2010-01-${String((index % 28) + 1).padStart(2, "0")}`,
      parent_name: `${s.last_name} Parent`,
      parent_phone: `+255 712 ${String(100000 + index).slice(1)}`,
      parent_email: `${s.first_name.toLowerCase()}.parent@demo.com`,
      address: "Dar es Salaam, Tanzania",
      status: "active",
      enrollment_date: "2026-01-15",
    }));

    const { data: students, error: studentError } = await supabaseServerClient
      .from("school_students")
      .insert(studentsToInsert)
      .select("id, class_id");

    if (studentError || !students) {
      logError("Error creating demo students", studentError, { schoolId });
      return jsonError("Failed to create demo students", 500);
    }

    // Group students by class for attendance
    const today = new Date().toISOString().slice(0, 10);
    const attendanceRecords = students.map((student, index) => ({
      school_id: schoolId,
      student_id: student.id,
      class_id: student.class_id,
      attendance_date: today,
      status: attendanceStatuses[index % attendanceStatuses.length],
      notes: index % 5 === 2 ? "Reported sick" : null,
    }));

    const { error: attendanceError } = await supabaseServerClient
      .from("school_attendance")
      .insert(attendanceRecords);

    if (attendanceError) {
      logError("Error creating demo attendance", attendanceError, { schoolId });
      return jsonError("Failed to create demo attendance", 500);
    }

    // Insert fees for each student
    const feeRecords = students.flatMap((student, studentIndex) =>
      feeTemplates.map((template, feeIndex) => ({
        school_id: schoolId,
        student_id: student.id,
        description: template.description,
        amount_tzs: template.amount,
        due_date: "2026-07-31",
        status:
          (studentIndex + feeIndex) % 4 === 0
            ? "paid"
            : (studentIndex + feeIndex) % 3 === 0
              ? "partial"
              : "pending",
      })),
    );

    const { data: fees, error: feeError } = await supabaseServerClient
      .from("school_fees")
      .insert(feeRecords)
      .select("id, status");

    if (feeError || !fees) {
      logError("Error creating demo fees", feeError, { schoolId });
      return jsonError("Failed to create demo fees", 500);
    }

    // Record a payment for paid and partial fees
    const paymentRecords = fees
      .filter((f) => f.status === "paid" || f.status === "partial")
      .map((f) => ({
        fee_id: f.id,
        amount_tzs: f.status === "paid" ? 150000 : 75000,
        payment_method: "mobile_money" as const,
        reference: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      }));

    if (paymentRecords.length > 0) {
      const { error: paymentError } = await supabaseServerClient
        .from("school_fee_payments")
        .insert(paymentRecords);

      if (paymentError) {
        logError("Error creating demo fee payments", paymentError, { schoolId });
        return jsonError("Failed to create demo fee payments", 500);
      }
    }

    // Insert announcements
    const { error: announcementError } = await supabaseServerClient
      .from("school_announcements")
      .insert(
        announcements.map((a) => ({
          school_id: schoolId,
          ...a,
        })),
      );

    if (announcementError) {
      logError("Error creating demo announcements", announcementError, {
        schoolId,
      });
      return jsonError("Failed to create demo announcements", 500);
    }

    return jsonOk({
      message: "Demo data loaded successfully",
      classes: classes.length,
      students: students.length,
      fees: feeRecords.length,
    });
  } catch (error) {
    logError("Unexpected error in school seed", error);
    return jsonError("Internal server error", 500);
  }
}
