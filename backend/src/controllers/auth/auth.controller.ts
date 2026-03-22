import type { ReqHandler } from '../../types';
import type { ILoginUserDto, IRegisterUserDto } from './auth.controller.dto';
import {
  BadRequest,
  NotFound,
  Unauthenticated,
  Unauthorized,
} from '../../errors/index';
import { StatusCodes } from 'http-status-codes';
import { db } from '../../services/index';
import { users } from '../../models/index';
import { eq } from 'drizzle-orm';
import { createToken } from '../../common/utils';
import { initializePlayer } from '../../game/helpers/initializers';

type RegisterUserHandler = ReqHandler<IRegisterUserDto>;

export const registerUser: RegisterUserHandler = async function (req, res) {
  const { email, password, u1Name, u2Name, isAdmin } = req.body;
  if (!email || !password || !u1Name) {
    throw new BadRequest('Email, Password, and Player 1 Name are Required');
  }
  await db.insert(users).values({ email, password, u1Name, u2Name, isAdmin });
  res.status(StatusCodes.CREATED).json({
    status: 'Success',
  });
};

type LoginUserHandler = ReqHandler<ILoginUserDto>;

export const loginUser: LoginUserHandler = async function (req, res) {
  const { email, password } = req.body;
  const result = await db.select().from(users).where(eq(users.email, email));
  if (result.length === 0) {
    throw new NotFound('User Not Found');
  }

  const user = result[0];
  if (user.password !== password) {
    throw new Unauthenticated('Invalid Password');
  }

  if (user.isAdmin) {
    throw new Unauthorized('User is an Admin');
  }

  const playerId = await initializePlayer(user.id);

  const token = createToken({ playerId, admin: false });
  res.status(StatusCodes.CREATED).json({
    status: 'Success',
    data: { token },
  });
};

export const loginAdmin: LoginUserHandler = async function (req, res) {
  const { email, password } = req.body;
  const result = await db.select().from(users).where(eq(users.email, email));
  if (result.length === 0) {
    throw new NotFound('User Not Found');
  }

  const user = result[0];
  if (user.password !== password) {
    throw new Unauthenticated('Invalid Password');
  }

  if (!user.isAdmin) {
    throw new Unauthorized('User is not an Admin');
  }

  const token = createToken({ playerId: user.id, admin: true });
  res.status(StatusCodes.CREATED).json({
    status: 'Success',
    data: { token },
  });
};
