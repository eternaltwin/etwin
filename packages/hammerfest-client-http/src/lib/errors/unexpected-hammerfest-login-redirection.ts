export class UnexpectedHammerfestLoginRedirection extends Error {
  public location: string | undefined;

  public constructor(location: string | undefined) {
    const message: string = `Unexpected Hammerfest login redirection: ${typeof location === "string" ? JSON.stringify(location) : "(missing-location)"}`;
    super(message);
    this.location = location;
  }
}
