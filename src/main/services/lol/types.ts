/** Types for the League client (LCU) local API. Pre-game helpers only. */

export interface LcuCredentials {
  port: number
  token: string
  protocol: 'http' | 'https'
  processId: number
}

export interface ReadyCheckState {
  state: 'Invalid' | 'InProgress' | 'EveryoneReady' | 'StrangerNotReady' | 'PartyNotReady' | string
  playerResponse: 'None' | 'Accepted' | 'Declined' | string
  timer: number
}

export interface ChampSelectAction {
  id: number
  actorCellId: number
  championId: number
  type: 'pick' | 'ban' | 'vote'
  completed: boolean
  isInProgress: boolean
  pickTurn?: number
}

export interface ChampSelectTeamMember {
  cellId: number
  championId: number
  summonerId: number
  team: number
  /** top / jungle / middle / bottom / utility; empty in blind pick and ARAM */
  assignedPosition?: string
}

export interface ChampSelectSession {
  localPlayerCellId: number
  actions: ChampSelectAction[][]
  myTeam: ChampSelectTeamMember[]
  theirTeam: ChampSelectTeamMember[]
  bans?: {
    myTeamBans?: number[]
    theirTeamBans?: number[]
  }
  timer?: {
    phase: string
    adjustedTimeLeftInPhase: number
  }
}

export interface LolAutomationPlan {
  startMatchmaking?: boolean
  autoAccept?: boolean
  pickChampion?: string | null
  banChampion?: string | null
  pickCompleted?: boolean
  banCompleted?: boolean
  /** The pick request was already counted in the user's champion ranking */
  requestRecorded?: boolean
  /** Champions the client refused to lock in during this champ select */
  failedPickIds?: number[]
  createdAt?: number
}

export interface LcuActionResult {
  success: boolean
  message: string
  status:
    | 'ok'
    | 'client_not_running'
    | 'not_in_champ_select'
    | 'not_in_ready_check'
    | 'not_your_turn'
    | 'champion_not_found'
    | 'champion_unavailable'
    | 'no_lobby'
    | 'already_searching'
    | 'error'
  data?: any
}
