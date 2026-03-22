import type { ReqHandler } from '../../types';
import type { ILoginUserDto, IRegisterUserDto } from './auth.controller.dto';
import {
  BadRequest,
  NotFound,
  Unauthenticated,
  Unauthorized,
} from '../../errors/index';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../services/prisma.service';
import { createToken } from '../../common/utils';
import { initializePlayer } from '../../game/helpers/initializers';
import bcrypt from 'bcryptjs';

type RegisterUserHandler = ReqHandler<IRegisterUserDto>;

export const registerUser: RegisterUserHandler = async function (req, res) {
  const { email, password, u1Name, u2Name, isAdmin } = req.body;
  
  if (!email || !password || !u1Name) {
    throw new BadRequest('Email, Password, and Player 1 Name are Required');
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new BadRequest('Email Already Exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      u1Name,
      u2Name,
      isAdmin: isAdmin || false,
    },
  });

  res.status(StatusCodes.CREATED).json({
    status: 'Success',
  });
};

type LoginUserHandler = ReqHandler<ILoginUserDto>;

export const loginUser: LoginUserHandler = async function (req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFound('User Not Found');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Unauthenticated('Invalid Password');
  }

  if (user.isAdmin) {
    throw new Unauthorized(
      'Admin Check: User is an Admin, use appropriate login route.',
    );
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
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFound('User Not Found');
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Unauthenticated('Invalid Password');
  }

  if (!user.isAdmin) {
    throw new Unauthorized('User is not an admin');
  }

  const token = createToken({ playerId: user.id, admin: true });
  res.status(StatusCodes.CREATED).json({
    status: 'Success',
    data: { token },
  });
};
