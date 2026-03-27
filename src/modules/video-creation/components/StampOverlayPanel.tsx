import type { StampOverlay } from '../types/video-project.types'
import { FeatureBadge, WorkspacePanel } from '../../../shared/ui/workspace'

export function StampOverlayPanel({
  stamps,
  onToggleStamp,
}: {
  stamps: StampOverlay[]
  onToggleStamp: (stampId: string) => void
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <FeatureBadge className="bg-white/10 text-white">Stamps</FeatureBadge>
      <h2 className="mt-3 font-display text-[1.8rem] font-black tracking-[-0.05em] text-white">Add overlays for structured teaching</h2>
      <p className="mt-4 text-sm leading-7 text-white/68">
        Keep important notes, lesson identity, and chapter context visible inside the final educational render.
      </p>

      <div className="mt-6 space-y-4">
        {stamps.map((stamp) => (
          <label key={stamp.id} className="flex items-start justify-between gap-4 rounded-[1.5rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
            <div>
              <p className="text-sm font-bold text-white">{stamp.label}</p>
              <p className="mt-2 text-sm leading-6 text-white/64">{stamp.description}</p>
              <div className="mt-3 inline-flex rounded-full bg-black/25 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-white/56 ring-1 ring-white/10">
                {stamp.placement}
              </div>
            </div>
            <input
              type="checkbox"
              checked={stamp.enabled}
              onChange={() => onToggleStamp(stamp.id)}
              className="mt-1 h-4 w-4 accent-[var(--color-watashi-indigo)]"
            />
          </label>
        ))}
      </div>
    </WorkspacePanel>
  )
}
