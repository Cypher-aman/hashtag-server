import nodemailer from 'nodemailer';
import { generateRandomOTP } from '../utils/helper';
import redisClient from '../clients/redis';
import { Post, User } from '@prisma/client';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.APP_USER,
    pass: process.env.APP_PASSWORD,
  },
});

class NodemailerServices {
  static async sendEmail(to: string) {
    const randomOTP = generateRandomOTP(10000, 1001);
    try {
      await redisClient.setex(
        `SIGN_UP_OTP:${to}`,
        60 * 10,
        JSON.stringify(randomOTP)
      );
      await transporter.sendMail({
        from: {
          name: 'Hashtag Team',
          address: process.env.APP_USER as string,
        },
        to: to,
        subject: 'OTP Verification',
        text: `Your OTP is ${randomOTP}`,
      });
    } catch (error: any) {
      console.log(error.message);
      throw new Error(error.message);
    }
  }

  static async verifyOTP(to: string, otp: number) {
    try {
      const redisOTP = await redisClient.get(`SIGN_UP_OTP:${to}`);
      const parsedRedisOTP = parseInt(redisOTP as string);
      if (parsedRedisOTP === otp) {
        await redisClient.del(`SIGN_UP_OTP:${to}`);
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      console.log(error.message);
      throw new Error(error.message);
    }
  }

  static async sendAccounCreationUpdateEmail(user: Partial<User>) {
    try {
      await transporter.sendMail({
        from: {
          name: 'Hashtag Team',
          address: process.env.APP_USER as string,
        },
        to: process.env.APP_USER,
        subject: 'New Account Created',
        text: `A new account has been created for ${user.email}`,
      });
    } catch (error) {
      console.log(error);
    }
  }

  static async sendPostCreationUpdateEmail(post: Partial<Post>) {
    try {
      await transporter.sendMail({
        from: {
          name: 'Hashtag Team',
          address: process.env.APP_USER as string,
        },
        to: process.env.APP_USER,
        subject: 'New Post Created',
        text: `A new post has been created - ${post?.content}`,
      });
    } catch (error) {
      console.log(error);
    }
  }
}

export default NodemailerServices;
