/** Counter-item advice based on the enemy team composition. Read-only. */

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { ItemAdviceConfig, ItemAdviceRule } from './types'
import { normalizeChampionKey } from './champion-reactions'

const FALLBACK_CONFIG: ItemAdviceConfig = {
  version: '1.0.0',
  description: 'Fallback counter-build configuration',
  champions: {
    aatrox: { tags: ['heavy_healing'], reason: 'cura masiva' },
    warwick: { tags: ['heavy_healing'], reason: 'curación descontrolada en baja vida' },
    vladimir: { tags: ['heavy_healing', 'ap_burst'], reason: 'regeneración y burst AP' },
    drmundo: { tags: ['heavy_healing', 'tank_hp'], reason: 'regeneración extrema y vida masiva' },
    mundo: { tags: ['heavy_healing', 'tank_hp'], reason: 'regeneración extrema y vida masiva' },
    soraka: { tags: ['heavy_healing'], reason: 'curaciones globales continuas' },
    yuumi: { tags: ['heavy_healing', 'heavy_shields'], reason: 'sustain parasitario constante' },
    briar: { tags: ['heavy_healing'], reason: 'robo de vida extremo' },
    swain: { tags: ['heavy_healing'], reason: 'drenaje de vida en área' },
    sylas: { tags: ['heavy_healing', 'ap_burst'], reason: 'curación súbita con la W' },
    sett: { tags: ['heavy_shields'], reason: 'escudo colosal por daño recibido' },
    shen: { tags: ['heavy_shields', 'tank_hp'], reason: 'escudo global y bloqueo de ataques' },
    lulu: { tags: ['heavy_shields'], reason: 'escudos potenciados y polimorfia' },
    karma: { tags: ['heavy_shields'], reason: 'escudos grupales acelerados' },
    tahmkench: { tags: ['heavy_shields', 'tank_hp'], reason: 'vida gris convertible en escudo gigante' },
    sion: { tags: ['tank_hp', 'tank_armor'], reason: 'vida infinita por farmeo' },
    chogath: { tags: ['tank_hp'], reason: 'vida descomunal por festines' },
    zac: { tags: ['tank_hp', 'heavy_healing'], reason: 'vida y regeneración por partículas' },
    zed: { tags: ['ad_assassin'], reason: 'asesino AD de sombras y burst de marca' },
    talon: { tags: ['ad_assassin'], reason: 'rotaciones y letalidad de área' },
    qiyana: { tags: ['ad_assassin'], reason: 'letalidad explosiva en paredes' },
    khazix: { tags: ['ad_assassin'], reason: 'letalidad y daño por aislamiento' },
    rengar: { tags: ['ad_assassin'], reason: 'saltos invisibles con daño crítico' },
    evelynn: { tags: ['ap_assassin'], reason: 'camuflaje y ejecución mágica repentina' },
    leblanc: { tags: ['ap_assassin'], reason: 'distorsión rápida y ráfagas mágicas' },
    syndra: { tags: ['ap_burst'], reason: 'bombardeo concentrado de esferas' },
    veigar: { tags: ['ap_burst', 'heavy_cc'], reason: 'jaula de choque y poder mágico infinito' },
    morgana: { tags: ['heavy_cc'], reason: 'atadura oscura prolongada y escudo negro' },
    leona: { tags: ['heavy_cc', 'tank_hp'], reason: 'cadena continua de aturdimientos' },
    nautilus: { tags: ['heavy_cc', 'tank_hp'], reason: 'anclaje ineludible e impacto abisal' }
  },
  rules: {
    heavy_healing: {
      priority: 1,
      threshold: 1,
      es: 'Tienen mucha curación con {champs}. Te conviene priorizar cortacuración temprano (Llamado del Verdugo, Chaleco de Zarzas o Orbe del Olvido).',
      en: 'Heavy healing detected on {champs}. Rush anti-heal early (Executioner\'s Calling, Bramble Vest, or Oblivion Orb).'
    },
    heavy_shields: {
      priority: 2,
      threshold: 2,
      es: 'Tienen escudos pesados ({champs}). Si sos AD considerá Colmillo de Serpiente; para magos, Llama Sombría rinde genial.',
      en: 'Heavy shields on enemy squad ({champs}). Consider Serpent\'s Fang for physical damage or Shadowflame for AP penetration.'
    },
    tank_hp: {
      priority: 3,
      threshold: 2,
      es: 'Veo tanques con una tonelada de vida ({champs}). Ítems de porcentaje de vida como Rey Arruinado, Liandry o Recuerdos de Lord Dominik van a derretirlos.',
      en: 'High health tanks detected ({champs}). Max-HP shred items like Blade of the Ruined King, Liandry\'s, or Lord Dominik\'s will melt them down.'
    },
    ad_assassin: {
      priority: 4,
      threshold: 2,
      es: 'Tienen varios asesinos AD con letalidad ({champs}). Un Zhonya para magos o un Ángel Guardián temprano te va a salvar el pellejo.',
      en: 'Multiple AD assassins with lethality ({champs}). Early Zhonya\'s Hourglass or Guardian Angel will keep your chrome intact.'
    },
    ap_burst: {
      priority: 5,
      threshold: 2,
      es: 'Ojo con el daño mágico explosivo de {champs}. Resistencia mágica como Fauces de Malmortius, Fuerza de la Naturaleza o Velo del Hada son claves.',
      en: 'Burst magic threat from {champs}. Magic resist items like Maw of Malmortius, Force of Nature, or Banshee\'s Veil are key.'
    },
    heavy_cc: {
      priority: 6,
      threshold: 2,
      es: 'Tienen mucho control de masas ({champs}). Botas de Mercurio o Fajín de Mercurio van a ser tus mejores amigos en las peleas.',
      en: 'Heavy crowd control on their side ({champs}). Mercury\'s Treads or Quicksilver Sash will keep you mobile in teamfights.'
    }
  }
}

export class ItemAdvisor {
  private static instance: ItemAdvisor
  private config: ItemAdviceConfig | null = null
  private configPath: string
  private hasAdvisedThisMatch = false

  public static getInstance(): ItemAdvisor {
    if (!ItemAdvisor.instance) {
      ItemAdvisor.instance = new ItemAdvisor()
    }
    return ItemAdvisor.instance
  }

  constructor() {
    let basePath = process.cwd()
    try {
      if (app && app.isPackaged) {
        basePath = process.resourcesPath
      }
    } catch {}
    this.configPath = path.join(basePath, 'assets', 'game_data', 'lol_item_advice.json')
    this.loadConfig()
  }

  public resetMatchAdvice(): void {
    this.hasAdvisedThisMatch = false
  }

  public setAdvisedThisMatch(value: boolean): void {
    this.hasAdvisedThisMatch = value
  }

  public isAdvisedThisMatch(): boolean {
    return this.hasAdvisedThisMatch
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8')
        this.config = JSON.parse(raw)
        console.log(`[ItemAdvisor] Loaded custom item advice configuration from ${this.configPath}`)
        return
      }
    } catch (err: any) {
      console.warn('[ItemAdvisor] Failed to load custom item advice config, falling back to defaults:', err.message)
    }
    this.config = FALLBACK_CONFIG
  }

  /**
   * Analyzes an enemy team roster and produces top 1-2 tactical item recommendations
   */
  public analyzeRoster(
    enemyChampionNames: string[],
    _activePlayerChampion?: string,
    lang: 'es' | 'en' = 'es'
  ): string[] {
    if (!this.config) {
      this.loadConfig()
    }
    const cfg = this.config || FALLBACK_CONFIG

    // Map tags -> matched champion names
    const tagMatches: Map<string, string[]> = new Map()

    for (const rawName of enemyChampionNames) {
      if (!rawName) continue
      const normKey = normalizeChampionKey(rawName)
      const champProfile =
        cfg.champions[normKey] ||
        cfg.champions[rawName.toLowerCase()]

      if (champProfile && champProfile.tags) {
        for (const tag of champProfile.tags) {
          const list = tagMatches.get(tag) || []
          if (!list.includes(rawName)) {
            list.push(rawName)
          }
          tagMatches.set(tag, list)
        }
      }
    }

    // Evaluate rules
    interface MatchedRule {
      ruleKey: string
      priority: number
      champs: string[]
      rule: ItemAdviceRule
    }

    const matchedRules: MatchedRule[] = []

    for (const [ruleKey, rule] of Object.entries(cfg.rules)) {
      const champs = tagMatches.get(ruleKey) || []
      if (champs.length >= rule.threshold) {
        matchedRules.push({
          ruleKey,
          priority: rule.priority,
          champs,
          rule
        })
      }
    }

    // Sort by priority (lowest number = highest priority)
    matchedRules.sort((a, b) => a.priority - b.priority)

    // Select top 2 recommendations
    const topRules = matchedRules.slice(0, 2)
    const results: string[] = []

    for (const item of topRules) {
      const template = lang === 'es' ? item.rule.es : item.rule.en
      const champList = item.champs.join(', ')
      const formatted = template.replace('{champs}', champList)
      results.push(formatted)
    }

    return results
  }
}

export const itemAdvisor = ItemAdvisor.getInstance()
