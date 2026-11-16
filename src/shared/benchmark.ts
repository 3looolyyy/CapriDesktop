export const BENCHMARK_LLM_PROMPTS: readonly string[] = [
  'Hey Capri, how are you doing today?',
  'Give me a quick tip to stay focused while I work.\nKeep it to one or two sentences.',
  'I have a long day ahead of me.\nCan you suggest a short plan for the morning?\nKeep it friendly and brief.'
]

export const BENCHMARK_VOICE_PHRASES: readonly string[] = [
  'Hey choomba, systems are online and I am ready.',
  'All done on my side. If you want, we can go over the plan together and pick the first thing to tackle.'
]

export const BENCHMARK_RECORD_MS = 4000

export type BenchmarkStep = 'stt' | 'llm' | 'voice' | 'vision'

export interface BenchmarkRequest {
  step: BenchmarkStep
  index?: number
  audio?: ArrayBuffer | Uint8Array
}

export interface BenchmarkResult {
  success: boolean
  ms?: number
  detail?: string
  engine?: string
  error?: string
}
