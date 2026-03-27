import type { LessonBindingOption, LessonBindingType } from '../types/video-project.types'
import { FeatureBadge, WorkspacePanel } from '../../../shared/ui/workspace'

export function LessonBindingPanel({
  bindingType,
  bindingTargetId,
  bindingOptions,
  selectedBinding,
  onBindingTypeChange,
  onBindingTargetChange,
}: {
  bindingType: LessonBindingType
  bindingTargetId: string
  bindingOptions: LessonBindingOption[]
  selectedBinding: LessonBindingOption | undefined
  onBindingTypeChange: (nextType: LessonBindingType) => void
  onBindingTargetChange: (value: string) => void
}) {
  return (
    <WorkspacePanel className="bg-[linear-gradient(180deg,#121922,#0d141b)] text-white ring-[color-mix(in_oklab,white_10%,transparent)]">
      <FeatureBadge className="bg-white/10 text-white">Publish</FeatureBadge>
      <h2 className="mt-3 font-display text-[1.7rem] font-black tracking-[-0.05em] text-white">Attach the final video to a lesson or course</h2>
      <p className="mt-4 text-sm leading-7 text-white/68">
        Make the publishing target explicit before render so the module stays focused on structured educational content, not general media editing.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-white/6 p-1 ring-1 ring-white/8">
        {([
          { key: 'lesson', label: 'Lesson' },
          { key: 'course', label: 'Course' },
        ] as const).map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onBindingTypeChange(option.key)}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
              bindingType === option.key
                ? 'bg-white text-slate-950 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)]'
                : 'text-white/68'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="text-[11px] font-black uppercase tracking-[0.22em] text-white/42">Destination</span>
        <select
          value={bindingTargetId}
          onChange={(event) => onBindingTargetChange(event.target.value)}
          className="mt-2 w-full rounded-[1.3rem] border-none bg-white/6 px-4 py-3 text-sm font-semibold text-white outline-none ring-1 ring-white/8"
        >
          {bindingOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-5 rounded-[1.5rem] bg-white/6 px-4 py-4 ring-1 ring-white/8">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[var(--color-watashi-emerald)]">Selected target</p>
        <p className="mt-2 text-sm font-bold text-white">{selectedBinding?.title ?? 'Choose a lesson or course'}</p>
        <p className="mt-2 text-sm leading-6 text-white/66">{selectedBinding?.detail ?? 'Publishing target will appear here.'}</p>
      </div>
    </WorkspacePanel>
  )
}
