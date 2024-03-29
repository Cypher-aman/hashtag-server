import Jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const generateUniqueUserName = () => {
  const userName = Math.random().toString(36).slice(4);
  return userName;
};

export const generateJWTUserToken = (user: User) => {
  const secretKey = 'secretKey@unique#';
  const token = Jwt.sign({ id: user.id, username: user.userName }, secretKey);

  return token;
};

export const verifyJWTUserToken = (token: string) => {
  if (token === 'null' || !token) return null;
  const secretKey = 'secretKey@unique#';
  const decoded = Jwt.verify(token, secretKey);
  return decoded;
};

export const generateRandomOTP = (max: number, min: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};
