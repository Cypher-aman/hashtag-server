import { generateUsername } from 'unique-username-generator';
import Jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export const generateUniqueUserName = () => {
  const userName = generateUsername('', 3, 15);
  return userName;
};

export const generateJWTUserToken = (user: User) => {
  const secretKey = 'secretKey@unique#';
  const token = Jwt.sign({ id: user.id, username: user.userName }, secretKey, {
    expiresIn: '1d',
  });

  return token;
};
