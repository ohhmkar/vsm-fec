import { ApplicationError } from './application.error';
import { StatusCodes } from 'http-status-codes';

export class NotFound extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND);
  }
}
