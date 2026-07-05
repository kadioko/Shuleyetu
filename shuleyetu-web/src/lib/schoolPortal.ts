import { supabaseClient } from "@/lib/supabaseClient";

export type School = {
  id: string;
  name: string;
  region: string | null;
  district: string | null;
  ward: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string | null;
  stream: string | null;
  room: string | null;
  capacity: number | null;
  created_at: string;
};

export type SchoolStudent = {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: "male" | "female" | "other" | null;
  date_of_birth: string | null;
  class_id: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  status: string;
  enrollment_date: string | null;
  created_at: string;
  school_classes: { name: string | null; grade: string | null; stream: string | null } | null;
};

export type SchoolStaff = {
  id: string;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: "admin" | "teacher" | "support";
  subject: string | null;
  status: "active" | "inactive";
  created_at: string;
};

export type SchoolFee = {
  id: string;
  student_id: string;
  description: string;
  amount_tzs: number;
  due_date: string | null;
  status: "pending" | "partial" | "paid" | "waived";
  created_at: string;
  paid_tzs: number;
  balance_tzs: number;
  school_students: {
    admission_number: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export type SchoolAttendance = {
  id: string;
  student_id: string;
  class_id: string | null;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  notes: string | null;
};

export type SchoolAnnouncement = {
  id: string;
  title: string;
  content: string;
  audience: "all" | "parents" | "staff" | "students";
  created_at: string;
  updated_at: string;
};

export type SchoolOverview = {
  classes: number;
  students: number;
  staff: number;
  attendanceToday: number;
  feesDue: number;
  recentStudents: SchoolStudent[];
  recentAnnouncements: SchoolAnnouncement[];
};

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return session?.access_token ?? null;
}

async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const token = await getAccessToken();
  if (!token) {
    return { data: null, error: "Not authenticated" };
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return {
      data: null,
      error: (json.error as string) || `Request failed (${res.status})`,
    };
  }

  return { data: json as T, error: null };
}

export async function createSchool(body: {
  name: string;
  region?: string;
  district?: string;
  ward?: string;
  phone?: string;
  email?: string;
  address?: string;
}) {
  return fetchWithAuth<{ school: School }>("/api/schools/setup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSchool() {
  return fetchWithAuth<{ school: School; role: string; user: { id: string; email: string | null } }>(
    "/api/schools/me",
  );
}

export async function getOverview() {
  return fetchWithAuth<SchoolOverview>("/api/schools/overview");
}

export async function getClasses() {
  return fetchWithAuth<{ classes: SchoolClass[] }>("/api/schools/classes");
}

export async function createClass(body: Omit<SchoolClass, "id" | "created_at">) {
  return fetchWithAuth<{ class: SchoolClass }>("/api/schools/classes", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getStudents(params?: { classId?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.classId) query.set("classId", params.classId);
  if (params?.status) query.set("status", params.status);
  return fetchWithAuth<{ students: SchoolStudent[] }>(
    `/api/schools/students?${query.toString()}`,
  );
}

export async function createStudent(
  body: Omit<SchoolStudent, "id" | "created_at" | "school_classes" | "status">,
) {
  return fetchWithAuth<{ student: SchoolStudent }>("/api/schools/students", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getStaff() {
  return fetchWithAuth<{ staff: SchoolStaff[] }>("/api/schools/staff");
}

export async function createStaff(body: Omit<SchoolStaff, "id" | "created_at" | "status">) {
  return fetchWithAuth<{ staff: SchoolStaff }>("/api/schools/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getFees(params?: { status?: string; studentId?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.studentId) query.set("studentId", params.studentId);
  return fetchWithAuth<{ fees: SchoolFee[] }>(
    `/api/schools/fees?${query.toString()}`,
  );
}

export async function createFee(
  body: Omit<SchoolFee, "id" | "created_at" | "status" | "paid_tzs" | "balance_tzs" | "school_students">,
) {
  return fetchWithAuth<{ fee: SchoolFee }>("/api/schools/fees", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAttendance(params: { classId: string; date?: string }) {
  const query = new URLSearchParams();
  query.set("classId", params.classId);
  if (params.date) query.set("date", params.date);
  return fetchWithAuth<{ date: string; classId: string; students: SchoolStudent[] }>(
    `/api/schools/attendance?${query.toString()}`,
  );
}

export async function saveAttendance(body: {
  student_id: string;
  class_id: string;
  attendance_date: string;
  status: string;
  notes?: string | null;
}) {
  return fetchWithAuth<{ attendance: SchoolAttendance }>("/api/schools/attendance", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getAnnouncements(params?: { audience?: string }) {
  const query = new URLSearchParams();
  if (params?.audience) query.set("audience", params.audience);
  return fetchWithAuth<{ announcements: SchoolAnnouncement[] }>(
    `/api/schools/announcements?${query.toString()}`,
  );
}

export async function createAnnouncement(
  body: Omit<SchoolAnnouncement, "id" | "created_at" | "updated_at">,
) {
  return fetchWithAuth<{ announcement: SchoolAnnouncement }>(
    "/api/schools/announcements",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}
