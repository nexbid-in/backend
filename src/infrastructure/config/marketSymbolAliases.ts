/**
 * Bidirectional symbol rename/alias groups surfaced during live feed matching
 * so renamed corporate tickers remain backward-compatible without editing gateway code.
 */
export const DEFAULT_SYMBOL_ALIAS_GROUPS: ReadonlyArray<readonly string[]> = [
  ["TATAMOTORS", "TMCV"],
  ["TMPV", "TATAMOTORSPASSENGER"],
  ["ZOMATO", "ETERNAL"],
  ["ICICIPRULI", "ICICILIFE"],
  ["LTIM", "LTM"],
];

export type SymbolAliasLookup = ReadonlyMap<string, ReadonlySet<string>>;

export function buildSymbolAliasLookup(
  aliasGroups: ReadonlyArray<readonly string[]> = DEFAULT_SYMBOL_ALIAS_GROUPS
): SymbolAliasLookup {
  const lookup = new Map<string, Set<string>>();

  for (const group of aliasGroups) {
    const normalized = group.map((sym) => sym.toUpperCase().trim());
    for (const sym of normalized) {
      let aliases = lookup.get(sym);
      if (!aliases) {
        aliases = new Set<string>();
        lookup.set(sym, aliases);
      }
      for (const peer of normalized) {
        if (peer !== sym) {
          aliases.add(peer);
        }
      }
    }
  }

  return lookup;
}
