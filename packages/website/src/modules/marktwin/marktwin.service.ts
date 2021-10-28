import { Grammar } from "@eternal-twin/marktwin/grammar";

export interface Range {
  start: number;
  end: number;
}

export interface TextAndRange {
  text: string;
  range: Range;
}

export abstract class MarktwinService {
  readonly #marktwin: typeof import("@eternal-twin/marktwin");

  protected constructor(marktwin: typeof import("@eternal-twin/marktwin")) {
    this.#marktwin = marktwin;
  }

  public renderMarktwin(grammar: Readonly<Grammar>, input: string): string {
    return this.#marktwin.renderMarktwin(grammar, input);
  }

  public toggleStrong(grammar: Readonly<Grammar>, text: string, range: Readonly<Range>): TextAndRange {
    if (!grammar.strong) {
      return {text, range};
    }
    return toggleInline(text, range, "**");
  }

  public toggleEmphasis(grammar: Readonly<Grammar>, text: string, range: Readonly<Range>): TextAndRange {
    if (!grammar.emphasis) {
      return {text, range};
    }
    return toggleInline(text, range, "_");
  }

  public toggleSpoiler(grammar: Readonly<Grammar>, text: string, range: Readonly<Range>): TextAndRange {
    if (!grammar.spoiler) {
      return {text, range};
    }
    return toggleInline(text, range, "||");
  }

  public toggleStrikethrough(grammar: Readonly<Grammar>, text: string, range: Readonly<Range>): TextAndRange {
    if (!grammar.strikethrough) {
      return {text, range};
    }
    return toggleInline(text, range, "~~");
  }
}

function toggleInline(text: string, {start, end}: Readonly<Range>, token: string): TextAndRange {
  // Normalize range to be inside of tokens
  if ((end - start) >= 2 * token.length && text.substr(start, token.length) === token && text.substr(end - token.length, token.length) === token) {
    // text <selection> token text token </selection> text
    start += token.length;
    end -= token.length;
    // text token <selection> text </selection> token text
  }

  if (text.substr(start - token.length, token.length) === token && text.substr(end, token.length) === token) {
    // text token <selection> text </selection> token text
    text = text.substr(0, start - token.length) + text.substring(start, end) + text.substr(end + token.length);
    start -= token.length;
    end -= token.length;
    // text <selection> text </selection> text
  } else {
    // text <selection> text </selection> text
    text = text.substr(0, start) + token + text.substring(start, end) + token + text.substr(end);
    start += token.length;
    end += token.length;
    // text token <selection> text </selection> token text
  }

  return {
    text,
    range: {start, end}
  };
}
