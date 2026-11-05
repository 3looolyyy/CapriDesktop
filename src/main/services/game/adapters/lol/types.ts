/** Types for the Live Client Data API and the item advisor. */

export interface LiveClientGameStats {
  gameMode: string
  gameTime: number
  mapName: string
  mapNumber: number
  mapTerrain: string
}

export interface LiveClientActivePlayer {
  summonerName?: string
  riotId?: string
  riotIdGameName?: string
  riotIdTagLine?: string
  level?: number
  currentGold?: number
  abilities?: Record<string, any>
  fullRunes?: {
    keystone?: { id: number; displayName: string }
    primaryRuneTree?: { id: number; displayName: string }
    secondaryRuneTree?: { id: number; displayName: string }
  }
}

export interface LiveClientPlayerScores {
  kills?: number
  deaths?: number
  assists?: number
  creepScore?: number
  wardScore?: number
}

export interface LiveClientPlayer {
  championName: string
  isBot: boolean
  isDead: boolean
  level: number
  position: string
  rawChampionName: string
  summonerName: string
  riotId?: string
  riotIdGameName?: string
  scores?: LiveClientPlayerScores
  team: 'ORDER' | 'CHAOS' | string
  summonerSpells?: Record<string, any>
  runes?: {
    keystone?: { id: number; displayName: string }
    primaryRuneTree?: { id: number; displayName: string }
    secondaryRuneTree?: { id: number; displayName: string }
  }
}

export interface LiveClientEvent {
  EventID: number
  EventName: string
  EventTime: number
  KillerName?: string
  VictimName?: string
  Assisters?: string[]
  KillStreak?: number
  DragonType?: string
  MonsterType?: string
  TurretKilled?: string
  InhibKilled?: string
  Result?: string
  [key: string]: any
}

export interface LiveClientAllGameData {
  activePlayer: LiveClientActivePlayer
  allPlayers: LiveClientPlayer[]
  events: {
    Events: LiveClientEvent[]
  }
  gameData: LiveClientGameStats
}

export interface ItemAdviceRule {
  priority: number
  threshold: number
  es: string
  en: string
}

export interface ChampionAdviceProfile {
  tags: string[]
  reason?: string
}

export interface ItemAdviceConfig {
  version: string
  description: string
  champions: Record<string, ChampionAdviceProfile>
  rules: Record<string, ItemAdviceRule>
}
