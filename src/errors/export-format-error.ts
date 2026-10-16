export class ExportFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportFormatError';
  }
}
