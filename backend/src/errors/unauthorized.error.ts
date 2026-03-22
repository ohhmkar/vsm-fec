import { ApplicationError } from './application.error';
import { StatusCodes } from 'http-status-codes';

export class Unauthorized extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.FORBIDDEN);
  }
}
