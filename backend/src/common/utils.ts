import type { RequestUserProp } from '../types';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config();

export function getHash(str: string) {
  return createHash('md5').update(str).digest('hex').slice(0, 32);
}

export function verifyToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, process.env.AUTH_TOKEN_SECRET!) as jwt.JwtPayload;
}

export function createToken(payload: RequestUserProp) {
  return jwt.sign(payload, process.env.AUTH_TOKEN_SECRET!, {
    expiresIn: process.env.AUTH_TOKEN_LIFETIME,
  });
}

export function arrayToMap<T, K extends keyof T>(
  arr: T[],
  key: K,
): Map<T[K], T> {
  return new Map(arr.map((item) => [item[key], item]));
}

export function roundTo2Places(num: number) {
  return Math.round(num * 100) / 100;
}
