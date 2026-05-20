export type Phase = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'
export type Role = 'participant' | 'admin' | 'manager'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  alias: string | null
  favorite_team_id: number | null
  paid: boolean
  role: Role
  avatar_perm_id: number | null
  avatar_category: string | null
  country_code: string | null
}

export interface Team {
  id: number
  code: string
  name: string
  group_code: string | null
  flag_emoji: string | null
  iso_code: string | null
  position_in_group: number | null
}

export interface Match {
  id: number
  phase: Phase
  group_code: string | null
  match_number: number
  kickoff_at: string | null
  home_team_id: number | null
  away_team_id: number | null
  home_team_label: string | null
  away_team_label: string | null
  home_score: number | null
  away_score: number | null
  shootout_winner_team_id: number | null
  status: MatchStatus
  stadium: string | null
  manual_override: boolean
  last_synced_at: string | null
}

export interface Entry {
  id: number
  user_id: string
  alias: string
  paid: boolean
  created_at: string
}

export interface Prediction {
  entry_id: number
  match_id: number
  home_score: number | null
  away_score: number | null
  ko_winner_team_id: number | null
}

export interface SpecialPrediction {
  entry_id: number
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_team_id: number | null
  fourth_team_id: number | null
}

export interface Settings {
  id: number
  lock_at: string | null
  pt_exact_group: number
  pt_winner_group: number
  pt_exact_ko: number
  pt_winner_ko: number
  pt_champion: number
  pt_runner_up: number
  pt_third: number
  pt_fourth: number
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_team_id: number | null
  fourth_team_id: number | null
  last_sync_at: string | null
  last_sync_error: string | null
  last_sync_status: string | null
  sync_interval_minutes: number
  api_sync_enabled: boolean
  req_pts_special: number
  req_exact_special: number
  req_pts_premium: number
  req_exact_premium: number
  req_pts_legend: number
  req_exact_legend: number
}

export interface Invitation {
  code: string
  note: string | null
  email: string | null
  used_by: string | null
  used_at: string | null
  expires_at: string | null
}

export interface LeaderboardRow {
  entry_id: number
  user_id: string
  display_name: string | null
  alias: string
  paid: boolean
  avatar_perm_id: number | null
  avatar_category: string | null
  country_code: string | null
  match_points: number
  special_points: number
  total_points: number
  total_exact: number
  ko_winner_count: number
  ko_exact_count: number
  ko_points: number
  correct_champion: number
  correct_runner_up: number
  rank: number
  display_avatar: string
}

export interface MatchScore {
  entry_id: number
  match_id: number
  phase: Phase
  points: number
}

export const PHASE_LABELS: Record<Phase, string> = {
  group: 'Fase de Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semifinales',
  third: 'Tercer Lugar',
  final: 'Final',
}

export const KO_PHASES: Phase[] = ['r32', 'r16', 'qf', 'sf', 'third', 'final']
export const GROUP_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const
