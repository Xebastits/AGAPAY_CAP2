"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

const PUBLIC_PATHS = ["/", "/campaigns", "/login"];

export default function AuthGuard() {
  const account = useActiveAccount();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (account === undefined) return;
    if (!account?.address && !PUBLIC_PATHS.includes(pathname)) {
      router.push("/login");
    }
    setChecked(true);
  }, [account, pathname, router]);

  if (!checked) return null;

  return null;
}