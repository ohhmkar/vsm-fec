import { RequestHandler, ErrorRequestHandler } from 'express';

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type AckResponse = { status: 'Success' | 'Failure'; data?: object; message?: string };
type ReqHandler<TReqBody> = RequestHandler<
  object,
  AckResponse,
  TReqBody,
  object
>;
type ErrHandler = ErrorRequestHandler<object, AckResponse, object, object>;

type Stages = 'INVALID' | 'OPEN' | 'CLOSE' | 'OFF' | 'ON';

export interface GameRules {
  noShortSelling?: boolean;
  noInsiderTrading?: boolean;
  noBorrowing?: boolean;
  [key: string]: any;
}

export type IGameState = {
  roundNo: number;
  stage: Stages;
  isPaused: boolean;
  pausedAt?: number;
  pauseRemainingTime?: number | null;
  activeRules?: GameRules;
};

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
