import acceptLanguageParser from "accept-language-parser";
import Koa from "koa";

import { Locale } from "./locales.js";

export type LocaleNegotiator<Req> = (req: Req) => Locale | undefined;

export interface NegotiateLocaleOptions {
  queryName?: string;
  cookieName?: string;
  supportedLocales: Iterable<Locale>;
}

export function createKoaLocaleNegotiator(options: NegotiateLocaleOptions): LocaleNegotiator<Koa.Context> {
  const localeSet: LocaleSet = new LocaleSet(options.supportedLocales);
  return function (ctx: Koa.Context): Locale | undefined {
    if (options.queryName !== undefined) {
      const inputLocale: unknown = Reflect.get(ctx.query, options.queryName);
      if (typeof inputLocale === "string") {
        const resolvedLocale: Locale | undefined = localeSet.get(inputLocale);
        if (resolvedLocale !== undefined) {
          if (options.cookieName !== undefined) {
            ctx.cookies.set(options.cookieName, resolvedLocale);
          }
          return resolvedLocale;
        }
      }
    }
    if (options.cookieName !== undefined) {
      const inputLocale: string | undefined = ctx.cookies.get(options.cookieName);
      if (typeof inputLocale === "string") {
        const resolvedLocale: Locale | undefined = localeSet.get(inputLocale);
        if (resolvedLocale !== undefined) {
          return resolvedLocale;
        }
      }
    }
    const languageHeader: string | undefined = ctx.request.headers["accept-language"];
    if (languageHeader !== undefined) {
      for (const {code: lang, region} of acceptLanguageParser.parse(languageHeader)) {
        const localeCode: string = region !== undefined ? `${lang}-${region}` : lang;
        const resolvedLocale: Locale | undefined = localeSet.get(localeCode);
        if (resolvedLocale !== undefined) {
          return resolvedLocale;
        }
      }
    }
    return undefined;
  };
}

/**
 * Checks and normalizes a locale code.
 *
 * Normalization replaces the `_` separator with `-`, converts all letters to lower case and ensures that both the
 * language code and optional region code are 1 to 5 ascii letters strings.
 *
 * If the locale cannot be normalized, `undefined` is returned.
 *
 * Example:
 * - `fR_Ca` -> `fr-ca`
 * - `verylong` -> `undefined`
 * - `invalid$char` -> `undefined`
 *
 * @param input Locale code to normalize.
 * @returns Normalized locale or undefined if normalization failed.
 */
function normalizeLocale(input: unknown): string | undefined {
  if (typeof input !== "string") {
    return undefined;
  }
  const normalized: string = input.toLowerCase().replace(/_/g, "-");
  if (!/^[a-z]{1,5}(?:-[a-z]{1,5})?$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

/**
 * A readonly set of locales
 *
 * It supports both simple locales with only a language code (such as `fr`) and compound locales with a region code
 * such as `fr-FR` or `fr-CA`).
 */
class LocaleSet {
  readonly simple: ReadonlyMap<string, Locale>;
  readonly compound: ReadonlyMap<string, Locale>;

  /**
   * Creates a new locale set from a list of locale codes
   *
   * The list may contain simple (e.g. `fr`) or compound (`fr-FR`) locale codes.
   *
   * The order of the locales is important. If only compound locales are provided for a given language, the default
   * locale to use for this language will be the first one in the list.
   *
   * Examples:
   * - `new LocaleSet(["fr-CA", "fr-FR"]).get("fr")` -> `"fr-CA"`.
   * - `new LocaleSet(["fr-CA", "fr", "fr-FR"]).get("fr")` -> `"fr"`.
   *
   * @param locales Locales to add to the set.
   */
  constructor(locales: Iterable<Locale>) {
    const simple: Map<string, Locale> = new Map();
    const compound: Map<string, Locale> = new Map();
    for (const locale of locales) {
      const normalized: string | undefined = normalizeLocale(locale);
      if (normalized === undefined) {
        throw new Error(`AssertionError: Invalid locale ${locale}`);
      }
      const dashIndex: number = normalized.indexOf("-");
      // TODO: Better support for mixed simple/compound locale codes
      if (dashIndex < 0) {
        simple.set(normalized, locale);
      } else {
        // TODO: Check uniqueness of compound locales
        compound.set(normalized, locale);
        const simpleLocale: string = normalized.substring(0, dashIndex);
        if (!simple.has(simpleLocale)) {
          simple.set(simpleLocale, locale);
        }
      }
    }
    this.simple = simple;
    this.compound = compound;
  }

  /**
   * Retrieves the locale from the set that that satisfies the input locale the best.
   *
   * If the set contains an exact match (after normalization), the value from the set will be returned as expected:
   * - `new Set(["fr-FR", "fr", "es-SP"]).get("fr-FR")` -> `"fr-FR"`
   * - `new Set(["fr-FR", "fr", "es-SP"]).get("fr")` -> `"fr"`
   * - `new Set(["fr-FR", "fr", "es-SP"]).get("es_SP")` -> `"es-SP"`
   *
   * If the input locale only contains a language code (no region code) and there's no generic locale for this language
   * but there are some region-specific locales, it will return the first one as the default:
   * - `new Set(["es-SP", "fr-FR", "fr-CA"]).get("fr")` -> `"fr-FR"`
   *
   * If the input locale has a region code but there's no exact match for this region, it will try to match it against
   * only the language code.
   * - `new Set(["fr-FR", "fr-CA", "fr"]).get("fr-BE")` -> `"fr"`
   * - `new Set(["fr-FR", "fr-CA"]).get("fr-BE")` -> `"fr-FR"`
   *
   * If no match is found, `undefined` is returned:
   * - `new Set(["fr-FR", "fr"]).get("es")` -> `undefined`
   * - `new Set(["fr-FR", "fr"]).get("es-SP")` -> `undefined`
   *
   * @param locale Input locale we are trying to match with this set.
   * @returns Matching locale, or `undefined` if no match is found.
   */
  get(locale: string): Locale | undefined {
    const normalized: string | undefined = normalizeLocale(locale);
    if (normalized === undefined) {
      return undefined;
    }
    const dashIndex: number = normalized.indexOf("-");
    if (dashIndex < 0) {
      return this.simple.get(normalized);
    } else {
      const codeWithRegion: Locale | undefined = this.compound.get(normalized);
      if (codeWithRegion !== undefined) {
        return codeWithRegion;
      }
      return this.simple.get(normalized.substring(0, dashIndex));
    }
  }
}
