// Données du plan d'entraînement : bibliothèque d'exercices, séances et configuration des semaines

export const REST_TEXT = 'repos 60-90 s'

export const PROGRESSION_RULE =
  'Quand tu réussis le haut de la fourchette (12 répétitions) sur toutes les séries, en gardant 2 répétitions en réserve, augmente un peu la charge et reprends à 8.'

export const SAFETY_RULES = [
  'Expire pendant l\'effort et ne retiens jamais ton souffle.',
  'Mouvements contrôlés, jamais d\'effort maximal.',
  'Après un exercice au sol, relève-toi lentement.',
  'Une douleur articulaire légère (jusqu\'à 3 sur 10) est acceptable si elle redescend en 24 h. Si elle monte ou persiste, allège ou remplace l\'exercice.',
  'À éviter : fentes profondes, squats très creux, sauts.',
  'Ces exercices sont généraux : fais-les valider par ton médecin ou un kinésiologue.'
]

// role : 'principal' | 'appoint' (appoint = 2 séries maximum)
// unite : 'series' (défaut) | 'passages'
export const EXERCISES = {
  'assis-debout': {
    name: 'Assis-debout depuis une chaise',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Assis au bord d\'une chaise stable, pieds à la largeur des hanches. Lève-toi en poussant dans les talons, puis redescends lentement (environ 3 secondes) jusqu\'à effleurer la chaise.',
    points: ['genoux dans l\'axe des pieds', 'amplitude sans douleur', 'expire en montant'],
    progression: 'tenir un haltère contre la poitrine, <strong>seulement si aucune douleur</strong>.'
  },
  'pont-fessier': {
    name: 'Pont fessier',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Couché sur le dos, genoux pliés, pieds à plat. Monte le bassin en serrant les fessiers jusqu\'à aligner épaules, hanches et genoux. Pause 1-2 s, redescends lentement.',
    points: ['ne cambre pas le bas du dos', 'pousse dans les talons'],
    progression: 'poser un haltère sur le bassin.'
  },
  'souleve-roumain': {
    name: 'Soulevé de terre roumain aux haltères',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Debout, un haltère dans chaque main devant les cuisses, genoux légèrement fléchis et fixes. Pousse les hanches vers l\'arrière en gardant le dos plat, fais glisser les haltères le long des jambes (jusqu\'à mi-tibia ou tant que le dos reste plat), puis remonte en poussant les hanches vers l\'avant.',
    points: ['dos neutre, le mouvement vient des hanches, pas du dos', 'charges légères au début'],
    progression: 'augmenter doucement la charge (voir la règle de progression plus bas).'
  },
  'marche-laterale': {
    name: 'Marche latérale avec élastique',
    reps: '8-12 pas de chaque côté',
    role: 'principal',
    consigne: 'Élastique autour des cuisses juste au-dessus des genoux, genoux légèrement fléchis. Fais des pas de côté en gardant l\'élastique tendu, puis reviens.',
    points: ['pieds parallèles', 'genoux qui ne rentrent pas vers l\'intérieur'],
    progression: 'élastique plus résistant.'
  },
  'extension-terminale-genou': {
    name: 'Extension terminale du genou (élastique)',
    reps: '8-12 rép. par jambe',
    role: 'principal',
    consigne: 'Élastique fixé à un support solide derrière toi, à hauteur du genou, boucle derrière le genou. Genou légèrement fléchi, redresse la jambe en contractant le muscle de la cuisse, tiens 1 s, relâche lentement.',
    points: ['mouvement lent et contrôlé', 'ne pas verrouiller brusquement le genou'],
    progression: 'élastique plus résistant.'
  },
  'mollets': {
    name: 'Élévations des mollets',
    reps: '10-15 rép.',
    role: 'appoint',
    consigne: 'Debout, mains sur un comptoir pour l\'équilibre. Monte sur la pointe des pieds, tiens 1 s, redescends lentement.',
    points: ['montée complète', 'descente contrôlée'],
    progression: 'une jambe à la fois, si c\'est facile.'
  },
  'dead-bug': {
    name: 'Dead bug',
    reps: '6-10 rép. par côté',
    role: 'appoint',
    consigne: 'Couché sur le dos, bras vers le plafond, hanches et genoux à 90°. Abaisse lentement un bras et la jambe opposée vers le sol sans cambrer le dos, reviens, alterne.',
    points: ['bas du dos plaqué au sol', 'respire normalement'],
    progression: 'mouvement plus lent, ou jambe plus tendue.'
  },
  'bird-dog': {
    name: 'Bird dog',
    reps: '6-10 rép. par côté',
    role: 'appoint',
    consigne: 'À quatre pattes sur un tapis, tends un bras et la jambe opposée, garde le corps stable, tiens 2 s, alterne.',
    points: ['hanches et épaules à niveau', 'mouvement lent'],
    note: 'Si la position à quatre pattes gêne les genoux, mets un coussin sous les genoux ou remplace par le dead bug.'
  },
  'rowing-halteres': {
    name: 'Rowing à l\'haltère (ou à l\'élastique)',
    reps: '8-12 rép. par côté',
    role: 'principal',
    consigne: 'Debout, penché depuis les hanches, une main appuyée sur une chaise stable. Tire l\'haltère vers la hanche, coude près du corps, puis redescends lentement. Version élastique possible.',
    points: ['dos plat', 'tire avec le dos, pas avec le bras'],
    progression: 'haltère un peu plus lourd.'
  },
  'rowing-elastique': {
    name: 'Rowing assis à l\'élastique',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Assis par terre, jambes tendues, élastique autour des pieds. Tire vers le ventre, coudes près du corps, rapproche les omoplates en fin de mouvement.',
    points: ['dos droit tout le long', 'mouvement contrôlé'],
    progression: 'élastique plus résistant.'
  },
  'developpe-couche-sol': {
    name: 'Développé couché au sol aux haltères',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Couché sur le dos, genoux pliés, pieds à plat, haltères au-dessus de la poitrine. Descends les coudes jusqu\'à toucher le sol (environ 45° du corps), puis pousse.',
    points: ['expire en poussant', 'poignets droits'],
    progression: 'haltères un peu plus lourds.'
  },
  'developpe-epaules': {
    name: 'Développé d\'épaules assis aux haltères',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Assis sur une chaise, dos droit, haltères à hauteur des épaules. Pousse au-dessus de la tête sans cambrer, redescends lentement.',
    points: ['expire en poussant, <strong>ne jamais retenir son souffle</strong>', 'ventre légèrement contracté'],
    progression: 'haltères un peu plus lourds.'
  },
  'abduction-hanche': {
    name: 'Abduction de hanche couché sur le côté',
    reps: '8-12 rép. par côté',
    role: 'principal',
    consigne: 'Couché sur le côté, jambes tendues dans l\'axe du corps. Lève la jambe du dessus (pointe vers l\'avant), tiens 1 s, redescends lentement.',
    points: ['bassin stable, sans basculer vers l\'arrière'],
    progression: 'élastique autour des cuisses.'
  },
  'pallof-press': {
    name: 'Pallof press à l\'élastique',
    reps: '8-12 rép. par côté',
    role: 'appoint',
    consigne: 'Élastique fixé à hauteur de poitrine sur un support solide, debout de profil. Mains à la poitrine, tends les bras droit devant, tiens 2 s, ramène. Ne te laisse pas faire pivoter par l\'élastique.',
    points: ['tronc immobile', 'respiration normale'],
    progression: 'élastique plus résistant, ou place-toi plus loin du support.'
  },
  'marche-fermier': {
    name: 'Marche du fermier',
    reps: '30-40 s',
    unite: 'passages',
    role: 'principal',
    consigne: 'Un haltère dans chaque main, bras le long du corps, épaules basses et grande taille. Marche à pas réguliers.',
    points: ['posture droite', 'ne pas retenir son souffle'],
    progression: 'haltères un peu plus lourds, ou 40 s.'
  },
  'step-up-bas': {
    name: 'Montée sur une petite marche',
    reps: '8-10 rép. par jambe',
    role: 'principal',
    consigne: 'Marche basse (10-15 cm, une marche d\'escalier est souvent trop haute). Pose tout le pied dessus, monte en poussant avec la jambe d\'appui, redescends lentement. Main sur une rampe ou un mur au besoin.',
    points: ['genou dans l\'axe du pied', 'hauteur sans douleur'],
    progression: 'marche un peu plus haute, <strong>seulement si aucune douleur</strong>.'
  },
  'pont-fessier-avance': {
    name: 'Pont fessier à une jambe ou avec pause',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Même mouvement que le pont fessier, avec une jambe tendue en l\'air, ou en tenant 3 s en haut.',
    points: ['bassin horizontal', 'ne pas cambrer'],
    progression: 'haltère sur le bassin.'
  },
  'pompes-inclinees': {
    name: 'Pompes inclinées (mains sur un comptoir)',
    reps: '8-12 rép.',
    role: 'principal',
    consigne: 'Mains sur un comptoir ou une table solide, à la largeur des épaules, corps droit de la tête aux talons. Fléchis les coudes (environ 45° du corps), approche la poitrine, repousse.',
    points: ['ventre contracté', 'plus le support est bas, plus c\'est difficile'],
    progression: 'support un peu plus bas.'
  },
  'curl-ischio-elastique': {
    name: 'Curl des ischio-jambiers à l\'élastique',
    reps: '8-12 rép. par jambe',
    role: 'principal',
    consigne: 'Debout, une main sur une chaise. Élastique fixé bas devant toi et attaché à la cheville. Plie le genou en ramenant le talon vers la fesse, puis reviens lentement.',
    points: ['cuisse immobile', 'mouvement lent'],
    progression: 'élastique plus résistant.'
  },
  'planche': {
    name: 'Planche',
    reps: '20-40 s',
    role: 'appoint',
    consigne: 'Sur les avant-bras (ou avant-bras sur un comptoir pour la version facile), corps droit de la tête aux talons, ventre contracté.',
    points: ['ne pas creuser le dos', 'respirer normalement'],
    progression: '40 à 60 s.'
  }
}

export const SEANCES = {
  cc1: {
    type: 'muscu',
    title: 'Musculation 1 — corps complet',
    exercises: ['assis-debout', 'pont-fessier', 'rowing-elastique', 'developpe-couche-sol', 'marche-laterale', 'dead-bug']
  },
  cc2: {
    type: 'muscu',
    title: 'Musculation 2 — corps complet',
    exercises: ['souleve-roumain', 'developpe-epaules', 'extension-terminale-genou', 'rowing-halteres', 'abduction-hanche', 'bird-dog']
  },
  a: {
    type: 'muscu',
    title: 'Musculation A — bas du corps + tronc',
    exercises: ['assis-debout', 'pont-fessier', 'souleve-roumain', 'marche-laterale', 'extension-terminale-genou', 'mollets', 'dead-bug']
  },
  b: {
    type: 'muscu',
    title: 'Musculation B — haut du corps + hanches',
    exercises: ['rowing-halteres', 'developpe-couche-sol', 'developpe-epaules', 'abduction-hanche', 'pallof-press', 'marche-fermier']
  },
  c: {
    type: 'muscu',
    title: 'Musculation C — corps complet',
    exercises: ['step-up-bas', 'rowing-elastique', 'pont-fessier-avance', 'pompes-inclinees', 'curl-ischio-elastique', 'planche']
  },
  ellipt: {
    type: 'ellipt',
    title: 'Elliptique — Zone 2 (30-40 min)',
    exercises: [],
    desc: '5 min d\'échauffement progressif, 20 à 30 min en Zone 2 (tu peux parler en phrases complètes), 3 à 5 min de retour au calme. Résistance faible à modérée, foulée naturelle.'
  }
}

const PHASE_NAMES = { 1: 'Phase 1 · Adaptation', 2: 'Phase 2 · Construction', 3: 'Phase 3 · Consolidation' }
const LIGHT_WEEKS = [4, 8, 12, 16, 20, 24]
const LAST_WEEK = 24

function phaseOf(weekId) {
  if (weekId <= 4) return 1
  if (weekId <= 12) return 2
  return 3
}

// Nombre de séries d'un exercice pour une semaine donnée (appoint : 2 maximum)
export function seriesFor(exercise, weekConfig) {
  return exercise.role === 'appoint' ? Math.min(2, weekConfig.series) : weekConfig.series
}

// Série × répétitions affichées pour un exercice, ex. « 3 × 8-12 rép. »
export function setsLabel(exercise, weekConfig) {
  const n = seriesFor(exercise, weekConfig)
  return exercise.unite === 'passages' ? `${n} passages × ${exercise.reps}` : `${n} × ${exercise.reps}`
}

function describeSeance(seance, weekConfig) {
  if (seance.type === 'ellipt') return seance.desc

  const duration = weekConfig.phase === 1 ? '30-40 min' : '35-45 min'
  const n = seance.exercises.length
  const hasAppoint = seance.exercises.some(id => EXERCISES[id].role === 'appoint')
  const appoint = hasAppoint && weekConfig.series > 2 ? ' (appoint : 2)' : ''
  return `${duration} · ${n} exercices · ${weekConfig.series} séries${appoint} · ${REST_TEXT}`
}

export function getWeekConfig(weekId) {
  const phase = phaseOf(weekId)
  const allegee = LIGHT_WEEKS.includes(weekId)
  const bilan = weekId === LAST_WEEK
  const series = phase === 1 || allegee ? 2 : 3
  const reserve = allegee ? 3 : 2

  const ids = phase === 1 ? ['cc1', 'ellipt', 'cc2', 'ellipt'] : ['a', 'b', 'c', 'ellipt']

  let label = PHASE_NAMES[phase]
  if (bilan) label += ' — semaine bilan'
  else if (allegee) label += ' — semaine allégée'

  const config = { weekId, phase, allegee, bilan, series, reserve, label }
  config.seances = ids.map(id => {
    const seance = SEANCES[id]
    return {
      id,
      type: seance.type,
      title: seance.title,
      desc: describeSeance(seance, config),
      exercises: seance.exercises
    }
  })
  return config
}
