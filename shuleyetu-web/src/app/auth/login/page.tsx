import { Suspense } from "react";
import { AuthPortalChooser } from "../AuthPortalPage";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthPortalChooser />
    </Suspense>
  );
}
