export class TemplateExecutionStopSignal extends Error {
  constructor(readonly output: string) {
    super('当前词条拒绝继续执行。');
    this.name = 'TemplateExecutionStopSignal';
  }
}
