"use client";

import { type FC } from "react";
import { Navigate } from "react-router";
import { useUser } from "@growchief/frontend/utils/store";
import { AdminIcon } from "@growchief/frontend/components/icons/admin.icon.tsx";
import { ViewasComponentInner } from "@growchief/frontend/components/layout/super.admin.component.tsx";

export const AdminComponent: FC = () => {
  const data = useUser();

  if (!data?.isSuperAdmin) {
    return <Navigate to="/analytics" replace />;
  }

  return (
    <div className="flex flex-col gap-8 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#2a2a2a] text-[#FD7302]">
          <AdminIcon />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Super Admin
          </h1>
          <p className="text-sm text-secondary">
            Manage users and billing across all organizations
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2a2a2a] bg-innerBackground p-4">
        <h2 className="text-base font-medium text-primary mb-2">
          Admin features
        </h2>
        <ul className="text-sm text-secondary space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-primary">View as user</strong> — Impersonate
            any user to see the app as they see it (support/debugging)
          </li>
          <li>
            <strong className="text-primary">Assign billing package</strong> —
            Grant a subscription plan to users who don't have one
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-[#2a2a2a] bg-innerBackground p-6">
        <h2 className="text-base font-medium text-primary mb-4">
          View as user & assign package
        </h2>
        <ViewasComponentInner
          viewingAs={data?.viewas ?? ""}
          subscription={data?.org?.subscription}
          embedded
        />
      </div>
    </div>
  );
};
