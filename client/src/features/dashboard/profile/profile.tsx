"use client";

import { Mail, Shield, User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F6F7FB] p-6">
      <div className="mx-2 w-full">
        {/* Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0EA56D] to-[#047857] p-8 text-white">
            <div className="flex items-center gap-5">

              {/* Avatar (NO IMAGE, only initials) */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-bold text-emerald-700 shadow-md">
                SB
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Syed Bilal Haider
                </h2>
                <p className="text-sm text-white/80">
                  Building Energy Manager
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="grid gap-6 p-8 md:grid-cols-2">

            {/* Personal Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-5 text-sm font-semibold text-slate-900">
                Personal Information
              </h3>

              <div className="space-y-4">

                <InfoRow icon={<User size={18} />} label="First Name" value="Syed" />
                <InfoRow icon={<User size={18} />} label="Last Name" value="Haider" />
                <InfoRow icon={<Mail size={18} />} label="Email" value="bilal@example.com" />

              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="mb-5 text-sm font-semibold text-slate-900">
                Account Information
              </h3>

              <div className="space-y-4">

                <InfoRow icon={<Shield size={18} />} label="Role" value="Administrator" />
                <InfoRow icon={<Shield size={18} />} label="Department" value="Energy Operations" />
                <InfoRow icon={<Shield size={18} />} label="Status" value="Active" />

              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-slate-200 bg-white p-6">

            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
              Edit Profile
            </button>

            <button className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Change Password
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

/* Reusable Row */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3 text-slate-600">
        <span className="text-emerald-600">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>

      <span className="text-sm font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}