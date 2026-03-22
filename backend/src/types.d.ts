import { RequestHandler, ErrorRequestHandler } from 'express';

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type AckResponse = { status: 'Success' | 'Failure'; data?: object };
type ReqHandler<TReqBody> = RequestHandler<
  object,
  AckResponse,
  TReqBody,
  object
>;
type ErrHandler = ErrorRequestHandler<object, AckResponse, object, object>;

type Stages = 'INVALID' | 'OPEN' | 'CLOSE' | 'OFF' | 'ON';
type IGameState = { roundNo: number; stage: Stages };

interface RequestUserProp {
  playerId: string;
  admin: boolean;
}

declare global {
  namespace Express {
    interface Request {
      player: RequestUserProp;
    }
  }
}

declare module 'jsonwebtoken' {
  interface JwtPayload extends RequestUserProp {}
}
