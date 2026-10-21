// Données du guide audio : fourchettes, consignes vocales (durées en s), côtés et descriptions
// mode : 'reps' (répétitions) | 'hold' (exercice tenu, en secondes)
export const GUIDE = {
  'assis-debout': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Monte",2],["Redescends lentement",3]],
    intro: "Assis-debout. Assieds-toi au bord d'une chaise stable, les pieds à la largeur des hanches. Lève-toi en poussant dans les talons. Puis redescends lentement, en trois secondes, jusqu'à effleurer la chaise, sans t'asseoir."
  },
  'pont-fessier': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Monte les hanches",2],["Tiens",1.5],["Redescends lentement",2.5]],
    intro: "Pont fessier. Couche-toi sur le dos, les genoux pliés, les pieds à plat. Monte le bassin en serrant les fessiers, jusqu'à aligner les épaules, les hanches et les genoux. Fais une pause, puis redescends lentement. Ne cambre pas le bas du dos."
  },
  'souleve-roumain': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Recule les hanches, dos plat",3],["Remonte en poussant les hanches",2]],
    intro: "Soulevé de terre roumain. Debout, un haltère dans chaque main devant les cuisses, les genoux légèrement fléchis et fixes. Pousse les hanches vers l'arrière en gardant le dos plat, et fais glisser les haltères le long des jambes. Puis remonte en poussant les hanches vers l'avant. Le mouvement vient des hanches, pas du dos."
  },
  'marche-laterale': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["vers la droite","vers la gauche"],
    cues: [["Pas de côté",1.5]],
    intro: "Marche latérale avec élastique. L'élastique est autour des cuisses, juste au-dessus des genoux, les genoux légèrement fléchis. Fais des pas de côté en gardant l'élastique tendu, puis reviens. Garde les pieds parallèles, et ne laisse pas les genoux rentrer vers l'intérieur."
  },
  'extension-terminale-genou': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["jambe droite","jambe gauche"],
    cues: [["Redresse la jambe, contracte la cuisse",1.5],["Tiens",1],["Relâche lentement",2.5]],
    intro: "Extension terminale du genou. L'élastique est fixé derrière toi, à hauteur du genou, et passe derrière le genou. Le genou est légèrement fléchi. Redresse la jambe en contractant le muscle de la cuisse, tiens une seconde, puis relâche lentement. Ne verrouille pas le genou brusquement."
  },
  'mollets': {
    mode: 'reps', min: 10, max: 15, def: 12,
    cues: [["Monte sur la pointe des pieds",1.5],["Tiens",1],["Redescends lentement",2.5]],
    intro: "Élévations des mollets. Debout, les mains sur un comptoir pour l'équilibre. Monte sur la pointe des pieds, tiens une seconde, puis redescends lentement."
  },
  'dead-bug': {
    mode: 'reps', min: 6, max: 10, def: 8,
    sides: ["bras droit et jambe gauche","bras gauche et jambe droite"],
    cues: [["Allonge le bras et la jambe opposée",2.5],["Reviens lentement",2.5]],
    intro: "Dead bug. Couché sur le dos, les bras vers le plafond, les hanches et les genoux à quatre-vingt-dix degrés. Abaisse lentement un bras et la jambe opposée vers le sol, sans cambrer le dos, puis reviens. Garde le bas du dos plaqué au sol, et respire normalement."
  },
  'bird-dog': {
    mode: 'reps', min: 6, max: 10, def: 8,
    sides: ["bras droit et jambe gauche","bras gauche et jambe droite"],
    cues: [["Tends le bras et la jambe opposée",2],["Tiens",2],["Reviens",2]],
    intro: "Bird dog. À quatre pattes sur un tapis, les mains sous les épaules, les genoux sous les hanches. Tends un bras et la jambe opposée, garde le corps stable, tiens deux secondes, puis reviens. Si les genoux sont inconfortables, mets un coussin dessous."
  },
  'rowing-halteres': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["bras droit","bras gauche"],
    cues: [["Tire le coude vers l'arrière",2],["Redescends lentement",3]],
    intro: "Rowing à l'haltère. Penche-toi depuis les hanches, une main appuyée sur une chaise stable, le dos plat. Tire l'haltère vers la hanche, le coude près du corps, puis redescends lentement. Tire avec le dos, pas avec le bras."
  },
  'rowing-elastique': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Tire vers ton ventre",2],["Serre les omoplates",1],["Reviens lentement",3]],
    intro: "Rowing à l'élastique. Assis par terre, les jambes tendues, l'élastique autour des pieds. Tire vers ton ventre, les coudes près du corps, et rapproche les omoplates. Garde le dos droit, et reviens lentement."
  },
  'developpe-couche-sol': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Pousse et expire",2],["Redescends lentement",3]],
    intro: "Développé couché au sol. Couché sur le dos, les genoux pliés, les pieds à plat, les haltères au-dessus de la poitrine. Descends les coudes jusqu'à toucher le sol, puis pousse. Expire en poussant."
  },
  'developpe-epaules': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Pousse au-dessus de la tête",2],["Redescends lentement",3]],
    intro: "Développé d'épaules assis. Assis sur une chaise, le dos droit, les haltères à hauteur des épaules. Pousse au-dessus de la tête sans cambrer, puis redescends lentement. Expire en poussant, et ne retiens jamais ton souffle."
  },
  'abduction-hanche': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["côté droit","côté gauche"],
    cues: [["Lève la jambe",2],["Tiens",1],["Redescends lentement",2.5]],
    intro: "Abduction de hanche. Couché sur le côté, les jambes tendues dans l'axe du corps. Lève la jambe du dessus, la pointe du pied vers l'avant, tiens une seconde, puis redescends lentement. Garde le bassin stable, sans basculer vers l'arrière."
  },
  'pallof-press': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["élastique à ta droite","élastique à ta gauche"],
    cues: [["Pousse les bras devant",2],["Tiens",2],["Ramène",2]],
    intro: "Pallof press. L'élastique est fixé sur le côté, à hauteur de poitrine. Debout de profil, les mains à la poitrine. Tends les bras droit devant toi, tiens deux secondes, puis ramène. Ne te laisse pas faire pivoter par l'élastique."
  },
  'marche-fermier': {
    mode: 'hold', min: 30, max: 40, def: 35,
    start: "Marche.", stop: "Stop.",
    intro: "Marche du fermier. Un haltère dans chaque main, les bras le long du corps, les épaules basses, grande taille. Marche à pas réguliers, en gardant une posture droite, sans retenir ton souffle."
  },
  'step-up-bas': {
    mode: 'reps', min: 8, max: 10, def: 8,
    sides: ["jambe droite","jambe gauche"],
    cues: [["Monte",2],["Redescends lentement",3]],
    intro: "Montée sur une petite marche. Utilise une marche basse, de dix à quinze centimètres. Pose tout le pied dessus, monte en poussant avec la jambe d'appui, puis redescends lentement. Garde le genou dans l'axe du pied. Une main sur un mur ou une rampe, au besoin."
  },
  'pont-fessier-avance': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["jambe droite levée","jambe gauche levée"],
    cues: [["Monte les hanches",2],["Tiens",3],["Redescends lentement",2.5]],
    intro: "Pont fessier à une jambe. Même mouvement que le pont fessier, avec une jambe tendue en l'air. Monte le bassin, tiens trois secondes en haut, puis redescends lentement. Garde le bassin à l'horizontale."
  },
  'pompes-inclinees': {
    mode: 'reps', min: 8, max: 12, def: 10,
    cues: [["Descends la poitrine",3],["Repousse",2]],
    intro: "Pompes inclinées. Les mains sur un comptoir solide, à la largeur des épaules, le corps droit de la tête aux talons. Fléchis les coudes, approche la poitrine du comptoir, puis repousse. Garde le ventre contracté."
  },
  'curl-ischio-elastique': {
    mode: 'reps', min: 8, max: 12, def: 10,
    sides: ["jambe droite","jambe gauche"],
    cues: [["Plie le genou, talon vers la fesse",2],["Reviens lentement",3]],
    intro: "Curl des ischio-jambiers. Debout, une main sur une chaise. L'élastique est fixé bas devant toi et attaché à ta cheville. Plie le genou en ramenant le talon vers la fesse, puis reviens lentement. La cuisse reste immobile."
  },
  'planche': {
    mode: 'hold', min: 20, max: 40, def: 30,
    start: "Tiens.", stop: "Relâche.",
    intro: "Planche. Sur les avant-bras, le corps droit de la tête aux talons, le ventre contracté. Ne creuse pas le dos et respire normalement. Si c'est trop difficile, appuie tes avant-bras sur un comptoir."
  }
}
