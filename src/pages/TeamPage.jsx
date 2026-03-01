import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-[22px] font-extrabold text-zinc-900">Team</h2>
        <p className="text-[13px] text-zinc-400 mt-1">Manage your organization members and roles.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-zinc-100">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
          <Users size={20} className="text-zinc-400" />
        </div>
        <p className="text-[14px] font-semibold text-zinc-700">Coming soon</p>
        <p className="text-[12px] text-zinc-400 mt-1">Team management will be available in the next release.</p>
      </div>
    </div>
  );
}
