export class LinkedInApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number | null = null,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
