import { Suspense } from "react";
import { AuthPortalPage } from "../AuthPortalPage";

export default function VendorLoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPortalPage type="vendor" />
    </Suspense>
  );
}
