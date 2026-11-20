// Screen-reader text for drawings: read, never spoken by Oli, so nothing here needs recording.

export const LABELS = {
  /** Retry: "the computer waited for packets 1 to 4", then the packets that arrived. */
  waited: (total: number) => `הַמַּחְשֵׁב חִכָּה לַחֲבִילוֹת 1 עַד ${total}.`,
  arrived: (numbers: readonly number[]) => `הִגִּיעוּ: ${numbers.join(', ')}.`,
  waitedShort: 'צְרִיכוֹת לְהַגִּיעַ:',
  arrivedShort: 'הִגִּיעוּ:',
} as const
