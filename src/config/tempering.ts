/**
 * The tempering guide (src/pages/templado.astro): one entry per chocolate with the
 * three temperatures it goes through. Edit the numbers here; the charts follow.
 * Ranges are in °C for couverture tempered by seeding or tabling; the bag always wins.
 */
export type TempRange = [number, number];

/**
 * Which look the guide wears. Both are kept while choosing:
 *   cabinet  wrappers and notes lying in a wooden drawer (src/components/CabinetGuide.astro)
 *   board    chalk curves on a chalkboard (src/components/TemperingGuide.astro)
 */
export const TEMPERING_STYLE: 'cabinet' | 'board' = 'cabinet';

export interface Wrapper {
  /** The wrapper's paper colour. */
  paper: string;
  /** What is printed on it: the label, the curve, the numbers. */
  ink: string;
  /** Metallic foil instead of paper. */
  foil?: boolean;
  /** The small word after the name on the label; "cobertura" unless said otherwise. */
  kind?: string;
}

export interface Chocolate {
  /** Used in element ids and the table; keep it URL-safe. */
  key: string;
  name: string;
  /** Chalk colour of this chocolate's curve on the chalkboard. */
  chalk: string;
  /** How its wrapper looks in the cabinet drawer. */
  wrap: Wrapper;
  /** Fully melted, every crystal gone. */
  melt: TempRange;
  /** Cooled while stirring until it thickens: stable crystals form. */
  cool: TempRange;
  /** Warmed back up to the working temperature. */
  work: TempRange;
  note?: string;
}

export const CHOCOLATES: Chocolate[] = [
  { key: 'negro',   name: 'Negro',            chalk: '#E8945A', wrap: { paper: '#3A2418', ink: '#F2E3CE' },
    melt: [45, 50], cool: [27, 28], work: [31, 32],
    note: 'Cuanto más cacao, más alto el rango de trabajo.' },
  { key: 'leche',   name: 'Con leche',        chalk: '#D8B08C', wrap: { paper: '#B97C45', ink: '#2B1B12' },
    melt: [40, 45], cool: [26, 27], work: [29, 30],
    note: 'La leche en polvo se quema: no pases de 45 °C.' },
  { key: 'blanco',  name: 'Blanco',           chalk: '#FBF3E6', wrap: { paper: '#F5ECDD', ink: '#4A2C1D' },
    melt: [40, 45], cool: [25, 26], work: [28, 29],
    note: 'El más delicado; funde con calor suave.' },
  { key: 'ruby',    name: 'Ruby',             chalk: '#F09AB0', wrap: { paper: '#E59CAA', ink: '#4A1F2A' },
    melt: [40, 45], cool: [26, 27], work: [28.5, 29.5],
    note: 'Se trabaja como el blanco, medio grado más.' },
  { key: 'gold',    name: 'Caramelizado',     chalk: '#F1DC66', wrap: { paper: '#D9B25C', ink: '#3E2A0C', foil: true },
    melt: [40, 45], cool: [26, 27], work: [29, 30],
    note: 'Blanco caramelizado (gold): mismas cifras que el chocolate con leche.' },
  { key: 'manteca', name: 'Manteca de cacao', chalk: '#A9CBD9', wrap: { paper: '#F1E4B8', ink: '#5A4318', kind: 'pura' },
    melt: [45, 50], cool: [27, 28], work: [30, 32],
    note: 'Para pintar moldes; con pistola, un grado más caliente.' },
];

/** Where the temperature axis starts and ends. Every range above must fit inside. */
export const TEMP_AXIS: TempRange = [20, 55];

/** The temperature the chocolate starts at before melting. */
export const ROOM_TEMP = 22;
