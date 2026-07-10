import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse School Supply Vendors",
  description:
    "Find trusted Tanzanian vendors for textbooks, uniforms, stationery and more. Compare prices and order with mobile money.",
  openGraph: {
    title: "Browse School Supply Vendors | Shuleyetu",
    description:
      "Find trusted Tanzanian vendors for textbooks, uniforms, stationery and more.",
    type: "website",
  },
};

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
