import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Shuleyetu",
  description:
    "Get in touch with the Shuleyetu team. We help Tanzanian families find school supplies and connect vendors with customers.",
  openGraph: {
    title: "Contact Shuleyetu",
    description:
      "Get in touch with the Shuleyetu team. We help Tanzanian families find school supplies and connect vendors with customers.",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
