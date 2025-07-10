export enum HTTP_CODES {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  LOCKED = 423,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

export class APIResponse {
  constructor(
    public status: string,
    public message: string,
    public payload?: any
  ) {
    this.status = status;
    this.message = message;
    this.payload = payload;
  }
}

// export type ApiFeatures = {
//   limit: number;
//   page: number;
//   sort: string;
//   fields: string;
// };
