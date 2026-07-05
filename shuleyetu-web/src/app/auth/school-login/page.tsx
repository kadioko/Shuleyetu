import { Suspense } from "react";
import { AuthPortalPage } from "../AuthPortalPage";

export default function SchoolLoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPortalPage type="school" />
    </Suspense>
  );
}
