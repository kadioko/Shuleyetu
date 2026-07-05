import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SchoolProvider } from "./SchoolContext";

export const metadata: Metadata = {
  title: "School Portal",
  description:
    "Manage your school on Shuleyetu — classes, students, staff, attendance, fees, and announcements.",
};

export default function SchoolPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SchoolProvider>
      <div className="min-h-screen">{children}</div>
    </SchoolProvider>
  );
}
