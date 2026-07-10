import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Back-to-School Checklist Generator",
  description:
    "Generate a personalised school supply checklist for your child. Get exactly what you need for each grade level in Tanzania.",
  openGraph: {
    title: "Back-to-School Checklist Generator | Shuleyetu",
    description:
      "Generate a personalised school supply checklist for your child. Get exactly what you need for each grade level in Tanzania.",
    type: "website",
  },
};

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
