export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function createHttpError(status: number, message: string): HttpError {
  return new HttpError(status, message);
}
