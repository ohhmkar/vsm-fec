import { ApplicationError } from './application.error';
import { StatusCodes } from 'http-status-codes';

export class UnprocessableEntity extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY);
  }
}
