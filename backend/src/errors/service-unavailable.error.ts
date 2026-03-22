import { ApplicationError } from './application.error';
import { StatusCodes } from 'http-status-codes';

export class ServiceUnavailable extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.SERVICE_UNAVAILABLE);
  }
}
