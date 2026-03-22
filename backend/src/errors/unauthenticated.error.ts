import { ApplicationError } from './application.error';
import { StatusCodes } from 'http-status-codes';

export class Unauthenticated extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.UNAUTHORIZED);
  }
}
