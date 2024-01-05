import { generateUsername } from 'unique-username-generator';
import Jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const generateUniqueUserName = () => {
  const userName = generateUsername('', 3, 20);
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
