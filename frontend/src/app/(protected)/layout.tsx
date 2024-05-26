"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LINKS } from "~/shared/constants/links";
import useAuth from "~/shared/hooks/auth/auth";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (auth.status == "success" && !auth.isLogin) {
      router.push(LINKS.AUTH);
    }
  }, [router, auth.status, auth.isLogin]);
  return (
    <>
      {auth.status == "pending" ? (
        <div>Loading...</div>
      ) : (
        <>{auth.isLogin ? <>{children}</> : <div>Not logged in</div>}</>
      )}
    </>
  );
};

export default ProtectedLayout;
