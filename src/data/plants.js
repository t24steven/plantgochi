export const PLANTS = [
  {
    id:     'cactus',
    name:   'Cactus',
    origin: 'Mexico and regions of Mesoamerica',
    family: 'Cactaceae',
    use:    'Food, medicinal, ornamental, and fruit production, human consumption, and adaptation to arid climates.',
    assets: {
      default: '/assets/plants/cactus/default.png',
      happy:   '/assets/plants/cactus/happy.png',
      sad:     '/assets/plants/cactus/sad.png',
      dead:    '/assets/plants/cactus/dead.png',
    },
    stats: { water: 80, sun: 60, fertilizer: 40, happiness: 100 },
  },
  {
    id:     'snakeplant',
    name:   'Snake Plant',
    origin: 'West Africa',
    family: 'Asparagaceae',
    use:    'Ornamental, indoor decoration, and air purification.',
    assets: {
      default: '/assets/plants/snakeplant/default.png',
      happy:   '/assets/plants/snakeplant/happy.png',
      sad:     '/assets/plants/snakeplant/sad.png',
      dead:    '/assets/plants/snakeplant/dead.png',
    },
    stats: { water: 60, sun: 50, fertilizer: 50, happiness: 100 },
  },
  {
    id:     'sunflower',
    name:   'Sunflower',
    origin: 'North America',
    family: 'Asteraceae',
    use:    'Ornamental, food production (seeds and oil), and ecological benefits.',
    assets: {
      default: '/assets/plants/sunflower/default.png',
      happy:   '/assets/plants/sunflower/happy.png',
      sad:     '/assets/plants/sunflower/sad.png',
      dead:    '/assets/plants/sunflower/dead.png',
    },
    stats: { water: 70, sun: 90, fertilizer: 60, happiness: 100 },
  },
];
