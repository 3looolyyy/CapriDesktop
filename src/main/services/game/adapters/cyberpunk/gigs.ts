import { app } from 'electron'
/** Gig catalog (names, fixers, districts, descriptions) used for recommendations. */

export interface CyberpunkGig {
  id: string
  name: string
  district: string
  fixer: string
  x: number
  y: number
  z: number
  description: string
  hookPhrase?: string
  paths?: string[]
  facts?: string[]
  status?: 'available' | 'active' | 'completed' | 'failed'
}

export const CYBERPUNK_GIGS: CyberpunkGig[] = [
  {
    id: 'monster_hunt',
    name: 'Monster Hunt',
    district: 'Watson (Kabuki)',
    fixer: 'Regina Jones',
    x: -1280.4,
    y: 1390.2,
    z: 18.5,
    description:
      'Jotaro Shobo, a ruthless Tyger Claw boss running illegal braindance torture studios in the Ho-Oh club. Regina wants his head on a spike, or stuffed in the trunk of a car. Total scum, choom!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'woman_of_la_mancha',
    name: 'Woman of La Mancha',
    district: 'Watson (Kabuki)',
    fixer: 'Regina Jones',
    x: -1345.0,
    y: 1475.0,
    z: 22.0,
    description:
      'Anna Hamill, an honest NCPD detective digging way too deep into department corruption. Her own precinct wants her zeroed, but Regina wants us to convince her to drop it and leave town alive.',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'hippocratic_oath',
    name: 'Hippocratic Oath',
    district: 'Watson (Northside)',
    fixer: 'Regina Jones',
    x: -1930.0,
    y: 2240.0,
    z: 12.0,
    description:
      'Maelstrom borgs took a ripperdoc named Lucy hostage to patch up one of their flatlining psychos. Infiltrate their clinic, flatline the borgs, and escort Lucy out in one piece!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'flight_of_the_cheetah',
    name: 'Flight of the Cheetah',
    district: 'Watson (Northside)',
    fixer: 'Regina Jones',
    x: -1720.0,
    y: 2110.0,
    z: 15.0,
    description:
      'Clinton Cruz, a loudmouth bodybuilder who pissed off the Tyger Claws, is trapped in a cheap motel. Help him slip past the hit squad waiting outside and reach his getaway ride.',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'psychofan',
    name: 'Psychofan',
    district: 'Heywood (The Glen)',
    fixer: "Sebastian 'Padre' Ibarra",
    x: -1640.0,
    y: -690.0,
    z: 16.0,
    description:
      "Break into the high-rise penthouse of an obsessed Kerry Eurodyne stalker and steal Kerry's iconic vintage guitar. High security, lasers, and preem music history!",
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'eye_for_an_eye',
    name: 'Eye for an Eye',
    district: 'Heywood (The Glen)',
    fixer: "Sebastian 'Padre' Ibarra",
    x: -1520.0,
    y: -810.0,
    z: 14.0,
    description:
      'Tucker Albach, an Arasaka executive who killed a young girl in a hit-and-run and bought off the judges. Padre says God forgives, but the streets do not. Zero her!',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'olive_branch',
    name: 'Olive Branch',
    district: 'Westbrook (Japantown)',
    fixer: 'Wakako Okada',
    x: -780.0,
    y: 1020.0,
    z: 15.0,
    description:
      'Sergei Karasinsky wants us to deliver a car to the Tyger Claws as an apology gift. Only twist: there is a live Arasaka netrunner locked in the trunk!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'until_death_do_us_part',
    name: 'Until Death Do Us Part',
    district: 'Westbrook (Charter Hill)',
    fixer: 'Wakako Okada',
    x: -510.0,
    y: 680.0,
    z: 32.0,
    description:
      'Infiltrate a luxury penthouse in Charter Hill and steal a datashard containing juicy divorce dirt before the corporate lawyers can sanitize it.',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'cuckoos_nest',
    name: "Cuckoo's Nest",
    district: 'Santo Domingo (Rancho Coronado)',
    fixer: "Muamar 'El Capitán' Reyes",
    x: 180.0,
    y: -1350.0,
    z: 16.0,
    description:
      'Jasmine Dixon, a brilliant Kang Tao engineer, was forcibly admitted to an asylum to scrub her memory clean. Break into the facility and bust her out before they fry her brain!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'severance_package',
    name: 'Severance Package',
    district: 'Santo Domingo (Arroyo)',
    fixer: "Muamar 'El Capitán' Reyes",
    x: -550.0,
    y: -1120.0,
    z: 14.0,
    description:
      'Infiltrate a heavily guarded Militech factory in Arroyo, bypass security cams, and steal confidential weapon prototypes right off their server.',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'guinea_pigs',
    name: 'Guinea Pigs',
    district: 'City Center (Downtown)',
    fixer: 'Dino Dinovic',
    x: -1420.0,
    y: -280.0,
    z: 25.0,
    description:
      'Joanne Koch, a Biotech executive who poisoned an entire nomad clan during unauthorized field trials. She is hiding in her luxury hotel suite. Dino wants her flatlined!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'radar_love',
    name: 'Radar Love',
    district: 'Badlands (Red Peaks)',
    fixer: 'Dakota Smith',
    x: 1750.0,
    y: -620.0,
    z: 115.0,
    description:
      'Militech set up an unauthorized radar surveillance post tracking nomad family convoys. Sneak into the compound, steal their radar transmitter, and ghost out.',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  },
  {
    id: 'prototype_in_the_scraper',
    name: 'Prototype in the Scraper',
    district: 'Dogtown (Heavy Hearts)',
    fixer: 'Mr. Hands',
    x: -1050.0,
    y: -2510.0,
    z: 19.0,
    description:
      'Zetatech engineered a prototype optic stealth implant inside an abandoned skyscraper guarded by Barghest. Infiltrate, snatch the tech, or talk your way through!',
    hookPhrase: 'HEY, HOW ABOUT THIS ONE?!'
  },
  {
    id: 'waiting_for_dodger',
    name: 'Waiting for Dodger',
    district: 'Dogtown (Longshore Stacks)',
    fixer: 'Mr. Hands',
    x: -1290.0,
    y: -2620.0,
    z: 12.0,
    description:
      'Two bumbling cops got themselves trapped by Barghest commander Dodger. Infiltrate the precinct and get those two gonks out alive without sparking a turf war!',
    hookPhrase: 'EY, WHAT ABOUT THIS ONE?!'
  }
]

import * as fs from 'fs';
import * as path from 'path';

// Path to persisted gig state (outside source tree to avoid accidental commits)
const STATE_PATH = path.join(app.getPath('userData'), 'cyberpunk_gig_state.json');

// Load persisted state if it exists
let completedGigIds = new Set<string>();
if (fs.existsSync(STATE_PATH)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) as string[];
    completedGigIds = new Set(data);
  } catch {
    // ignore corrupted file
  }
}

const saveState = () => {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify([...completedGigIds]), 'utf-8');
  } catch {}
};

// Original declaration replaced
// const completedGigIds = new Set<string>();
let lastGigIndex = -1

export function markGigCompleted(id: string): void {
  completedGigIds.add(id)
}

export function resetCompletedGigs(): void {
  completedGigIds.clear()
}

/**
 * Gets the next recommended gig, avoiding completed gigs and repeating the previous gig
 */
export function getNextGig(preferredDistrict?: string): CyberpunkGig {
  let pool = CYBERPUNK_GIGS.filter((g) => !completedGigIds.has(g.id))

  // If all gigs in catalog were completed, reset filter
  if (pool.length === 0) {
    pool = CYBERPUNK_GIGS
  }

  if (preferredDistrict) {
    const distLower = preferredDistrict.toLowerCase()
    const filtered = pool.filter((g) => g.district.toLowerCase().includes(distLower))
    if (filtered.length > 0) {
      pool = filtered
    }
  }

  let nextIndex: number
  if (pool.length === 1) {
    nextIndex = 0
  } else {
    do {
      nextIndex = Math.floor(Math.random() * pool.length)
    } while (nextIndex === lastGigIndex && pool.length > 1)
  }

  lastGigIndex = nextIndex
  return pool[nextIndex]
}
