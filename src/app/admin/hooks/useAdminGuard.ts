// hooks/useAdminGuard.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/app/constants/constant";

export const useAdminGuard = (account: any) => {
  const router = useRouter();

  useEffect(() => {
    if (!account) return;
    if (!isAdmin(account.address)) {
      router.replace("/campaigns");
    }
  }, [account, router]);

  return !!account && isAdmin(account.address);
};
