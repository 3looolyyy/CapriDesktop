/**
 * Cyberpunk 2077 Integration & Telemetry Types
 */

export * from './gigs'

export type CyberpunkDistrict =
  | 'Watson'
  | 'Westbrook'
  | 'Pacifica'
  | 'Heywood'
  | 'Santo Domingo'
  | 'City Center'
  | 'Badlands'
  | 'Dogtown'
  | 'Kabuki'
  | 'Japantown'
  | string

export interface CyberpunkRawEvent {
  event:
    | 'combat_started'
    | 'combat_ended'
    | 'player_kill'
    | 'player_died'
    | 'low_health'
    | 'implant_changed'
    | 'wanted_level'
    | 'district_entered'
    | 'match_started'
    | 'match_ended'
    | 'civilian_killed'
    | 'high_speed_driving'
    | 'extreme_speed'
    | 'vehicle_crash'
    | 'sandevistan_activated'
    | 'kerenzikov_activated'
    | 'synaptic_accelerator_activated'
    | 'overclock_activated'
    | 'berserk_activated'
    | 'player_quickhack'
    | 'player_being_hacked'
    | 'poi_marked'
    | 'gig_marked'
    | 'custom'
  victim?: string
  killer?: string
  implant?: string
  district?: CyberpunkDistrict
  wantedStars?: number
  healthPercent?: number
  customPhrase?: string
  gang?: string
  speed?: number
  effect?: string
  hack?: string
  category?: string
  name?: string
  fixer?: string
  description?: string
  gig?: any
  distance?: number
  seq?: number
  timestamp?: number
}
