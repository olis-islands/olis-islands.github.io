import { defineGame, type GameDef, type GenContext, type IslandDef } from '../../core/engine/types'
import { PickGame } from '../../ui/pick/PickGame'
import type { PickQ } from '../../ui/pick/types'
import { OrderGame } from '../reading/games'
import { registerCodingArt } from './art'
import { DEBUG, FOLLOW, LEVELS, REPEAT_LEVELS } from './content/boards'
import { PATTERNS } from './content/patterns'
import { STORIES } from './content/stories'
import { ProgramGame } from './games-program'
import { AdvancedProgramGame } from './games-advanced'
import { BalanceGame, BinaryGame, ConditionGame, CounterGame, EventGame, SearchGame } from './games-advanced-puzzles'
import {
  balanceAccepts, balanceQuestion, binaryAccepts, binaryQuestion, conditionAccepts, conditionQuestion, counterAccepts,
  counterQuestion, eventAccepts, eventQuestion, facingAccepts, facingQuestion, functionAccepts, functionQuestion,
  searchAccepts, searchQuestion,
} from './advanced-generators'
import { BALANCE_SCENARIOS, CONDITION_SCENARIOS, COUNTER_SCENARIOS, EVENT_SCENARIOS, SEARCH_SCENARIOS } from './content/advanced-scenarios'
import { FACING_BOARDS, FUNCTION_BOARDS } from './content/advanced-boards'
import { BINARY_TARGETS } from './content/advanced-puzzles'
import * as g from './generators'
import { phrases } from './phrases'
import type { ProgramQ } from './types'
import type {
  AdvancedProgramQ, BalanceQ, BinaryQ, ConditionQ, CounterQ, EventQ, SearchQ,
} from './advanced-types'

// Skills follow docs/specs/coding.md (Stage 8a, pre-K to grade 2). Story algorithms reuse OrderGame and PickGame;
// building and fixing programs is ProgramGame. Board drawings register with the shared art registry (D15).
registerCodingArt()

// Labels for the parents' page (D18): plain Hebrew. Boards and patterns are numbered; stories are named.
const STORY_NAMES: Record<string, string> = {
  teeth: 'צחצוח שיניים', hands: 'רחיצת ידיים', sandwich: 'הכנת כריך', seed: 'שתילת זרע', shoes: 'נעילת נעליים', road: 'חציית כביש',
  cake: 'הכנת עוגה', pet: 'האכלת חיית מחמד', sleep: 'ללכת לישון', popcorn: 'הכנת פופקורן', fruit: 'אכילת תפוח',
}
const storyLabel = (key: string) => {
  const m = /^(?:(bug|missing):)?([a-z]+)$/.exec(key)
  const name = m && STORY_NAMES[m[2]!]
  if (!name) return undefined
  return m[1] === 'bug' ? `${name}: שלב שגוי` : m[1] === 'missing' ? `${name}: שלב חסר` : name
}
/** Keys look like 'follow:f3' or 'program:l12'; the label is the number: "לוח 12". */
const numbered = (prefix: string, title: string) => (key: string) => {
  const n = new RegExp(`^${prefix}:[a-z]+(\\d+)$`).exec(key)?.[1]
  return n ? `${title} ${n}` : undefined
}

const pick = (id: string, title: string, icon: string, generate: (ctx: GenContext) => PickQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: PickGame, generate, accepts })

const program = (id: string, title: string, icon: string, generate: (ctx: GenContext) => ProgramQ, accepts: (k: string) => boolean): GameDef =>
  defineGame({ id, title, icon, component: ProgramGame, generate, accepts })

const advancedProgram = (
  id: string, title: string, icon: string,
  generate: (ctx: GenContext) => AdvancedProgramQ,
  accepts: (key: string) => boolean,
): GameDef =>
  defineGame({
    id, title, icon, component: AdvancedProgramGame,
    generate, accepts,
  })

const advancedEvent = (id: string, title: string, generate: (ctx: GenContext) => EventQ): GameDef =>
  defineGame({ id, title, icon: '🔔', component: EventGame, generate, accepts: eventAccepts })
const advancedCondition = (id: string, title: string, generate: (ctx: GenContext) => ConditionQ): GameDef =>
  defineGame({ id, title, icon: '🌦️', component: ConditionGame, generate, accepts: conditionAccepts })
const advancedCounter = (id: string, title: string, generate: (ctx: GenContext) => CounterQ): GameDef =>
  defineGame({ id, title, icon: '🎒', component: CounterGame, generate, accepts: counterAccepts })
const advancedBinary = (id: string, title: string, generate: (ctx: GenContext) => BinaryQ): GameDef =>
  defineGame({ id, title, icon: '💡', component: BinaryGame, generate, accepts: binaryAccepts })
const advancedBalance = (id: string, title: string, generate: (ctx: GenContext) => BalanceQ): GameDef =>
  defineGame({ id, title, icon: '⚖️', component: BalanceGame, generate, accepts: balanceAccepts })
const advancedSearch = (id: string, title: string, generate: (ctx: GenContext) => SearchQ): GameDef =>
  defineGame({ id, title, icon: '🔎', component: SearchGame, generate, accepts: searchAccepts })

export const island: IslandDef = {
  id: 'coding',
  order: 7,
  tier: 'advanced',
  title: 'אִי הַתִּכְנוּת',
  icon: '🤖',
  color: '--code',
  homeTip: 'לבקש מהילד לתאר בסדר את שלבי הפעולות היומיומיות, כמו צחצוח שיניים או הכנת כריך, ולשחק יחד "רובוט" שמבצע הוראות',
  phrases,
  skills: [
    {
      id: 'code.steps', title: 'מָה קֹדֶם?', grade: -1, requires: [], sticker: '🪥', describeItem: storyLabel,
      games: [defineGame({ id: 'order', title: 'מָה קֹדֶם?', icon: '🪥', component: OrderGame, generate: ctx => g.stepsQuestion(ctx, STORIES), accepts: g.stepsAccepts })],
    },
    {
      id: 'code.bug-steps', title: 'מָה לֹא בְּסֵדֶר?', grade: 0, requires: ['code.steps'], sticker: '🐞', describeItem: storyLabel,
      games: [pick('pick-bug', 'מָה לֹא בְּסֵדֶר?', '🐞', ctx => g.bugQuestion(ctx, STORIES), g.bugAccepts)],
    },
    {
      id: 'code.follow', title: 'לְאָן הוּא יַגִּיעַ?', grade: 0, requires: [], sticker: '🗺️', describeItem: numbered('follow', 'לוח'),
      games: [pick('follow', 'לְאָן הוּא יַגִּיעַ?', '🗺️', ctx => g.followQuestion(ctx, FOLLOW), g.followAccepts)],
    },
    {
      id: 'code.arrows', title: 'מְתַכְנְתִים צַעַד צַעַד', grade: 1, requires: ['code.follow'], sticker: '🤖', describeItem: numbered('program', 'לוח'),
      games: [program('program', 'מְתַכְנְתִים', '🤖', ctx => g.programQuestion(ctx, LEVELS), g.programAccepts)],
    },
    {
      id: 'code.debug', title: 'מְתַקְּנִים בָּאג', grade: 1, requires: ['code.arrows', 'code.bug-steps'], sticker: '🔧', describeItem: numbered('debug', 'לוח'),
      games: [program('fix', 'מְתַקְּנִים בָּאג', '🔧', ctx => g.debugQuestion(ctx, DEBUG), g.debugAccepts)],
    },
    {
      id: 'code.patterns', title: 'מָה חוֹזֵר?', grade: 2, requires: ['code.arrows'], sticker: '🔁', describeItem: numbered('loop', 'דפוס'),
      games: [pick('pick-loop', 'מָה חוֹזֵר?', '🔁', ctx => g.loopQuestion(ctx, PATTERNS), g.loopAccepts)],
    },
    {
      id: 'code.repeat', title: 'חוֹזְרִים עַל זֶה', grade: 2, requires: ['code.patterns'], sticker: '🌀', describeItem: numbered('repeat', 'לוח'),
      games: [program('program-repeat', 'חוֹזְרִים עַל זֶה', '🌀', ctx => g.repeatQuestion(ctx, REPEAT_LEVELS), g.repeatAccepts)],
    },
    {
      id: 'code.facing', title: 'פּוֹנִים וְזוֹזִים', grade: 3, requires: ['code.arrows'], sticker: '🧭',
      describeItem: numbered('facing', 'לוח'),
      games: [advancedProgram('facing', 'פּוֹנִים וְזוֹזִים', '🧭', ctx => facingQuestion(ctx, FACING_BOARDS), facingAccepts)],
    },
    {
      id: 'code.events', title: 'כְּשֶׁקּוֹרֶה מַשֶּׁהוּ', grade: 4, requires: ['code.facing'], sticker: '🔔',
      describeItem: numbered('event', 'סימן'),
      games: [advancedEvent('signal', 'כְּשֶׁהַסִּימָן מוֹפִיעַ', ctx => eventQuestion(ctx, EVENT_SCENARIOS))],
    },
    {
      id: 'code.conditions', title: 'בּוֹחֲרִים לְפִי תְּנַאי', grade: 4, requires: ['code.facing'], sticker: '🌦️',
      describeItem: numbered('condition', 'כלל'),
      games: [advancedCondition('weather', 'מַתְאִימִים פְּעֻלָּה לַמַּצָּב', ctx => conditionQuestion(ctx, CONDITION_SCENARIOS))],
    },
    {
      id: 'code.variables', title: 'מִסְפָּרִים שֶׁמִּשְׁתַּנִּים', grade: 5, requires: ['code.conditions'], sticker: '🎒',
      describeItem: numbered('variable', 'ספירה'),
      games: [advancedCounter('counter', 'סוֹפְרִים וּמְשַׁנִּים', ctx => counterQuestion(ctx, COUNTER_SCENARIOS))],
    },
    {
      id: 'code.functions', title: 'מְשַׁתְּפִים רֶצֶף', grade: 6, requires: ['code.repeat'], sticker: '🧩',
      describeItem: numbered('function', 'מסלול'),
      games: [advancedProgram('function', 'מְשַׁתְּפִים רֶצֶף', '🧩', ctx => functionQuestion(ctx, FUNCTION_BOARDS), functionAccepts)],
    },
    {
      id: 'code.binary', title: 'אוֹר וּמִסְפָּר', grade: 6, requires: [], sticker: '💡',
      describeItem: key => key.startsWith('binary:') ? `מספר ${key.slice('binary:'.length)}` : undefined,
      games: [advancedBinary('binary', 'מַדְלִיקִים לְפִי עֵרֶךְ', ctx => binaryQuestion(ctx, BINARY_TARGETS))],
    },
    {
      id: 'code.sort', title: 'מְסַדְּרִים לְפִי מִשְׁקָל', grade: 6, requires: [], sticker: '⚖️',
      describeItem: numbered('sort', 'סדר'),
      games: [advancedBalance('balance', 'מֵהַקָּל אֶל הַכָּבֵד', ctx => balanceQuestion(ctx, BALANCE_SCENARIOS))],
    },
    {
      id: 'code.search', title: 'מְחַפְּשִׂים בֵּין קֻפְּסָאוֹת', grade: 6, requires: ['code.sort'], sticker: '🔎',
      describeItem: numbered('search', 'חיפוש'),
      games: [advancedSearch('search', 'מְצִיאַת הַקֻּפְּסָה הָאֶמְצָעִית', ctx => searchQuestion(ctx, SEARCH_SCENARIOS))],
    },
  ],
}
