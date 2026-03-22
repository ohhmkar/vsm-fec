import type { Request, Response, NextFunction } from 'express';
import type { Schema } from 'zod';
import { BadRequest } from '../errors/index';

export function validatorFactory<T>(schema: Schema<T>) {
  return function (req: Request, res: Response, next: NextFunction) {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const problems = result.error.errors.map((error) => error.path.join('.'));

      throw new BadRequest('Invalid Input', { problems });
    }

    req.body = result.data;
    next();
  };
}
