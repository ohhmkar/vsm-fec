export class ApplicationError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public data?: object,
  ) {
    super(message);
  }
}
