export type Phase = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'
export type MatchStatus = 'scheduled' | 'live' | 'finished'
export type Role = 'participant' | 'admin'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  alias: string | null
  favorite_team_id: number | null
  paid: boolean
  role: Role
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
  top_scorer: string | null
  mvp: string | null
  best_goalkeeper: string | null
  revelation_team_id: number | null
  disappointment_team_id: number | null
}

export interface Settings {
  id: number
  lock_at: string | null
  pt_exact_group: number
  pt_winner_group: number
  pt_exact_ko: number
  pt_winner_ko: number
  pt_round_of_16: number
  pt_quarters: number
  pt_semis: number
  pt_champion: number
  pt_runner_up: number
  pt_third: number
  pt_fourth: number
  pt_top_scorer: number
  pt_mvp: number
  pt_goalkeeper: number
  pt_revelation: number
  pt_disappointment: number
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_team_id: number | null
  fourth_team_id: number | null
  top_scorer: string | null
  mvp: string | null
  best_goalkeeper: string | null
  revelation_team_id: number | null
  disappointment_team_id: number | null
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
  match_points: number
  special_points: number
  total_points: number
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
