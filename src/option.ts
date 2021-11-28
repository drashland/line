interface IOptionOptions {
  signatures: string[];
  description: string;
}

export class Option {
  #options: IOptionOptions;

  #allowed_flags: string[] = [];

  constructor(options: IOptionOptions) {
    this.#options = options;
    this.#setUp();
  }

  contains(signature: string): boolean {
    if (this.#allowed_flags.indexOf(signature) != -1) {
      return true;
    }

    return false;
  }

  #setUp(): void {
    this.#options.signatures.forEach((signature: string) => {
      this.#allowed_flags.push(signature);
    });
  }
}
