export type CountedLoopControl = 'break' | 'continue';

export class CountedLoopControlSignal extends Error {
  constructor(
    readonly control: CountedLoopControl,
    readonly output: string,
  ) {
    super(control);
    this.name = 'CountedLoopControlSignal';
  }
}
