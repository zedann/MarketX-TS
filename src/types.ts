export enum HTTP_CODES {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export class APIResponse {
  constructor(
    public status: string,
    public message: string,
    public data?: any
  ) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
