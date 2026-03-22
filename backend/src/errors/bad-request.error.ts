import { StatusCodes } from 'http-status-codes';
import { ApplicationError } from './application.error';

export class BadRequest extends ApplicationError {
  constructor(message: string, data?: object) {
    super(message, StatusCodes.BAD_REQUEST, data);
  }
}
