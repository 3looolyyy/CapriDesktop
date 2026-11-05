import { EventEmitter } from 'events'
import { GameAdapter, GameEvent, GameEventType, GameEventPriority } from '../types'

export class MockGameAdapter extends EventEmitter implements GameAdapter {
  public id = 'mock'
  public name = 'Mock Game Simulator'
  private running = false
  private simulationTimer: NodeJS.Timeout | null = null
  private eventIndex = 0

  private readonly mockSequence: { type: GameEventType; priority: GameEventPriority; payload?: any }[] = [
    { type: 'combat_started', priority: 'normal' },
    { type: 'player_kill', priority: 'high', payload: { victim: 'Arasaka Guard' } },
    { type: 'low_health', priority: 'high', payload: { healthPercent: 18 } },
    { type: 'multikill', priority: 'high', payload: { multikillCount: 2 } },
    { type: 'combat_ended', priority: 'normal' },
    { type: 'implant_changed', priority: 'low', payload: { implant: 'Sandevistan Mk.4' } },
    { type: 'player_died', priority: 'critical', payload: { killer: 'Cyberpsycho' } }
  ]

  public async detect(): Promise<boolean> {
    return this.running
  }

  public async start(): Promise<void> {
    if (this.running) return
    this.running = true
    console.log('[MockGameAdapter] Started mock game adapter.')
  }

  public async stop(): Promise<void> {
    this.running = false
    this.stopSimulation()
    console.log('[MockGameAdapter] Stopped mock game adapter.')
  }

  public isRunning(): boolean {
    return this.running
  }

  /**
   * Emits an explicit simulated game event on demand
   */
  public triggerMockEvent(type: GameEventType, payload: any = {}): GameEvent {
    this.running = true

    let priority: GameEventPriority = 'normal'
    if (type === 'player_died' || type === 'match_ended') {
      priority = 'critical'
    } else if (type === 'multikill' || type === 'player_kill' || type === 'low_health') {
      priority = 'high'
    } else if (type === 'implant_changed' || type === 'level_up') {
      priority = 'low'
    }

    const event: GameEvent = {
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gameId: 'mock',
      type,
      priority,
      payload,
      timestamp: Date.now()
    }

    console.log(`[MockGameAdapter] Emitting mock event: ${type} (priority: ${priority})`)
    this.emit('game_event', event)
    return event
  }

  /**
   * Starts periodic simulation loop for testing continuous reactions
   */
  public startSimulation(intervalMs = 12000): void {
    if (this.simulationTimer) return
    this.running = true
    console.log(`[MockGameAdapter] Starting automatic periodic simulation every ${intervalMs}ms...`)

    this.simulationTimer = setInterval(() => {
      const step = this.mockSequence[this.eventIndex % this.mockSequence.length]
      this.eventIndex++
      this.triggerMockEvent(step.type, step.payload || {})
    }, intervalMs)

    // Trigger first step right away
    const firstStep = this.mockSequence[0]
    this.eventIndex = 1
    this.triggerMockEvent(firstStep.type, firstStep.payload || {})
  }

  public stopSimulation(): void {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer)
      this.simulationTimer = null
      console.log('[MockGameAdapter] Stopped automatic periodic simulation.')
    }
  }

  public isSimulating(): boolean {
    return this.simulationTimer !== null
  }
}

export const mockGameAdapter = new MockGameAdapter()
