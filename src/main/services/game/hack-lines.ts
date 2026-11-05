/**
 * Quickhack voice lines (V hacking someone / an enemy netrunner hacking V).
 * Kept as fixed lists so they can be pre-synthesized with the selected TTS voice
 * and play instantly in combat.
 */
export const PLAYER_QUICKHACK_LINES: Record<string, string[]> = {
  short_circuit: [
    'Short Circuit uploaded! High voltage right into their implants!',
    'Short Circuit sent! Watch their cyberware pop and smoke, {name}!',
    'Fried their capacitors with Short Circuit! Clean hit!'
  ],
  overheat: [
    'Overheat uploading! Their chrome is cooking from the inside out, {name}!',
    'Thermal surge sent! Let them burn in their own cyberware!',
    'Overheat cooking their heatsinks! They cannot vent that fire, choom!'
  ],
  contagion: [
    'Contagion daemon injected! Spreading through their neural subnet!',
    'Contagion viral packet deployed! Watch it jump to the next choomba!',
    'Toxic loop running! The whole squad is catching that virus, {name}!'
  ],
  cyberware_malfunction: [
    'Cyberware Malfunction active! Their chrome is jammed solid, finish them!',
    'Neural link desynced! Their implants are completely shut down, {name}!',
    'Glitching their cyberware! They are dead in the water, take the shot!'
  ],
  synapse_burnout: [
    'Synapse Burnout uploaded! Clean brain fry, beautiful hack {name}!',
    'Synapse Burnout tearing through their frontal lobe! Lights out!',
    'Neural overload! Fried their brainstem clean through, choom!'
  ],
  system_collapse: [
    'System Collapse initiated! Dropped them like a sack of scrap!',
    'Total system shutdown! Clean sleep hack, zero alarms, {name}.',
    'System Collapse executed! Out cold before they hit the pavement!'
  ],
  reboot_optics: [
    'Reboot Optics uploaded! They are shooting completely blind, {name}!',
    'Optic feed corrupted! They cannot see you, take your shot!',
    'Blind as a bat! Optics rebooting, carve them up, choomba!'
  ],
  weapon_glitch: [
    'Weapon Glitch deployed! Their triggers are jammed tight!',
    'Jammed their smart-link! They are pulling a dead trigger, {name}!',
    'Weapon firmware crashed! They cannot shoot back, push forward!'
  ],
  memory_wipe: [
    'Memory Wipe active! Combat loop reset, they lost track of us!',
    'Memory Wipe sent! They do not even remember who shot at them, choom.',
    'Mind wiped clean! Sneak right past or execute, your call {name}.'
  ],
  cyberpsychosis: [
    'Cyberpsychosis daemon uploaded! Watch them turn on their own squad!',
    'Rogue combat subroutine forced! They are tearing each other apart, beautiful!',
    'Total psychotic break induced! Chaos on their subnet, {name}!'
  ],
  suicide: [
    'Forced override protocol sent! Grim execution, but lethal.',
    'Cyberware override complete. Cold-blooded kill, {name}.'
  ],
  locomotion_malfunction: [
    'Locomotion Malfunction injected! Knees locked, they are frozen in place!',
    'Motor servos disabled! Sitting ducks, take the shot {name}!'
  ],
  ping: [
    'Ping deployed! Local subnet mapped, enemy positions lit up on your HUD!',
    'Ping packet resolved! Highlighting every target through the walls, {name}.'
  ],
  blackwall: [
    'Blackwall breach deployed! Rogue AI tearing through their cyberware!',
    'Erebus protocol active! The Blackwall is consuming their soul, {name}!'
  ],
  detonate_grenade: [
    'Detonate Grenade! Their own frag just went off in their pocket, ha!',
    'Boom! Popped the grenade on their belt, nasty one {name}!'
  ],
  distract: [
    'Distraction sent! Now they are looking the other way, sneak in, choom.',
    'Distract Enemies uploaded! Perfect window to slip past them.'
  ],
  generic: [
    'ICE breached! Daemon uploaded clean into their cyberdeck, {name}!',
    'Neural link penetrated! Their implants are completely scrambled, choomba.',
    'Uploaded the daemon straight to their neural core! Preem netrunning!'
  ]
}

export const BEING_HACKED_LINES: Record<string, string[]> = {
  overheat: [
    'Warning! Enemy netrunner uploading Overheat to your chrome! Find cover and cool down, {name}!',
    'They are cooking us with Overheat! Break line of sight before we roast, choom!'
  ],
  contagion: [
    'ICE breach! Contagion packet spreading through our rig! Kill that netrunner fast!',
    'Viral Contagion in our system! Flatline the runner before it eats our health, {name}!'
  ],
  cyberware_malfunction: [
    'Enemy netrunner jamming our cyberware! Counter-hack or flatline that runner now!',
    'Cyberware Malfunction incoming! Our implants are going offline, choom!'
  ],
  reboot_optics: [
    'Optic feed glitching! Enemy netrunner is rebooting our optics, watch out {name}!',
    'We are going blind! Reboot Optics uploaded, get to cover now!'
  ],
  weapon_glitch: [
    'They are hacking our weapon smartlink! Clear the breach before the trigger locks!',
    'Weapon Glitch on us! Switch guns or go melee, choom!'
  ],
  locomotion_malfunction: [
    'Our legs are locking up! Cripple Movement uploaded, kill that netrunner!',
    'Locomotion hack on us! We are a sitting duck, {name}, find that runner!'
  ],
  short_circuit: [
    'Short Circuit incoming! They are frying our implants, {name}!',
    'High voltage hack on us! Find the runner before they fry us again!'
  ],
  synapse_burnout: [
    'Synapse Burnout on our brain! That one hurts, flatline that runner NOW!',
    'They are melting our synapses, choom! Break the link!'
  ],
  system_collapse: ['System Collapse uploading on us! Interrupt it or we are going down, {name}!'],
  trace: [
    'Someone is tracing us! An enemy netrunner is locking onto our position, choom!',
    'Netrunner trace in progress! Find them before they finish the upload, {name}!'
  ],
  generic: [
    'Incoming quickhack on our ICE! Break line of sight or zero that runner now!',
    'Enemy netrunner locked onto our subnet! Trace their signal and drop them, {name}!',
    'ICE under attack! Disconnect their uplink or flatline that netrunner now!'
  ]
}

/** Maps a raw status-effect / record string to a line key when the mod sent no explicit hack type */
export function hackKeyFromEffect(eff: string, table: Record<string, string[]>): string {
  const e = eff.toLowerCase()
  const checks: [string, string[]][] = [
    ['short_circuit', ['shortcircuit', 'emp']],
    ['overheat', ['overheat']],
    ['contagion', ['contagion']],
    ['cyberware_malfunction', ['cyberwaremalfunction', 'cyberware']],
    ['synapse_burnout', ['synapseburnout', 'synapse']],
    ['system_collapse', ['systemcollapse']],
    ['reboot_optics', ['rebootoptics', 'blind', 'optic']],
    ['weapon_glitch', ['weaponglitch', 'weaponmalfunction', 'weapon']],
    ['memory_wipe', ['memorywipe']],
    ['cyberpsychosis', ['cyberpsychosis']],
    ['suicide', ['suicide']],
    ['locomotion_malfunction', ['locomotionmalfunction', 'locomotion', 'cripple']],
    ['ping', ['statuseffect.ping']],
    ['blackwall', ['blackwall', 'canto']],
    ['trace', ['reveal', 'trace']]
  ]
  for (const [key, kws] of checks) {
    if (table[key] && kws.some((k) => e.includes(k))) return key
  }
  return 'generic'
}

export function pickLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)]
}

export const ALL_HACK_LINES: string[] = [
  ...Object.values(PLAYER_QUICKHACK_LINES).flat(),
  ...Object.values(BEING_HACKED_LINES).flat()
]
