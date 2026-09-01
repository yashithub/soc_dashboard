import { SEVERITY, STATUS } from '../constants/threatModel.js'

/**
 * Colour tokens, mirrored from `src/index.css`.
 *
 * Recharts needs literal colour values (it cannot read Tailwind classes), so
 * the hex lives here and the CSS @theme block references the same values.
 * Change both together.
 *
 * Severity ramp validated against the panel surface #111826: adjacent-pair
 * colour-vision separation ΔE 10.9 (protan) and normal-vision ΔE 15.8, all four
 * steps ≥ 3:1 contrast. The ramp deliberately varies in lightness — severity is
 * an ordered scale, so equal visual weight across steps would be wrong.
 */
export const COLORS = {
  surface: '#111826',
  surfaceRaised: '#161f30',
  line: '#212c3f',
  ink: '#e8eef6',
  inkMuted: '#a3b0c2',
  inkFaint: '#6f7f94',
  accent: '#3987e5',
  ok: '#3fb950',
  simulated: '#8b93a7',
}

export const SEVERITY_COLOR = {
  [SEVERITY.CRITICAL]: '#d64545',
  [SEVERITY.HIGH]: '#f79a4a',
  [SEVERITY.MEDIUM]: '#a88300',
  [SEVERITY.LOW]: '#4b93e0',
}

/**
 * Tailwind utility classes per severity, for badges and table accents.
 * Colour is never the only cue — every badge also carries an icon and a label.
 */
export const SEVERITY_STYLE = {
  [SEVERITY.CRITICAL]: {
    badge: 'bg-[#d64545]/15 text-[#f08c8c] ring-1 ring-inset ring-[#d64545]/45',
    bar: 'bg-[#d64545]',
  },
  [SEVERITY.HIGH]: {
    badge: 'bg-[#f79a4a]/15 text-[#f7b075] ring-1 ring-inset ring-[#f79a4a]/40',
    bar: 'bg-[#f79a4a]',
  },
  [SEVERITY.MEDIUM]: {
    badge: 'bg-[#a88300]/20 text-[#d3ae3a] ring-1 ring-inset ring-[#a88300]/45',
    bar: 'bg-[#a88300]',
  },
  [SEVERITY.LOW]: {
    badge: 'bg-[#4b93e0]/15 text-[#7fb3ec] ring-1 ring-inset ring-[#4b93e0]/40',
    bar: 'bg-[#4b93e0]',
  },
}

/**
 * Status is workflow state, not threat severity — kept visually quieter so it
 * never competes with the severity column.
 */
export const STATUS_STYLE = {
  [STATUS.INVESTIGATING]: 'bg-[#3987e5]/12 text-[#8ab8f0] ring-1 ring-inset ring-[#3987e5]/35',
  [STATUS.BLOCKED]: 'bg-[#3fb950]/12 text-[#7ed08a] ring-1 ring-inset ring-[#3fb950]/30',
  [STATUS.RESOLVED]: 'bg-[#8b93a7]/12 text-[#b3bccc] ring-1 ring-inset ring-[#8b93a7]/30',
  [STATUS.PENDING]: 'bg-[#a88300]/15 text-[#d3ae3a] ring-1 ring-inset ring-[#a88300]/35',
}

/**
 * Shared Recharts chrome so all three charts read as one system.
 *
 * The threat-type chart compares one measure across categories, so it uses the
 * single primary hue rather than a categorical palette — colour there would
 * encode nothing the axis labels do not already say.
 */
export const CHART = {
  gridStroke: '#1b2434',
  axisStroke: '#2f3d55',
  tick: { fill: COLORS.inkFaint, fontSize: 11 },
  seriesPrimary: COLORS.accent,
  seriesCritical: SEVERITY_COLOR[SEVERITY.CRITICAL],
}
