import { db } from '../../clients/db';
import { generateUniqueUserName, generateJWTUserToken } from '../../services';
import axios from 'axios';

const query = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const googleOAuthAPI = new URL('https://oauth2.googleapis.com/tokeninfo');
    googleOAuthAPI.searchParams.set('id_token', token);

    try {
      const { data } = await axios.get<any>(googleOAuthAPI.toString(), {
        responseType: 'json',
      });

      let user = await db.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            firstName: data.given_name,
            lastName: data.family_name,
            userName: generateUniqueUserName(),
            email: data.email,
            profilePicUrl: data.picture,
          },
        });
      }

      const token = generateJWTUserToken(user);

      return token;
    } catch (error: any) {
      console.log(error);
      return error.message;
    }
  },
};

export const resolvers = { query };