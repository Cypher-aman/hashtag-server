import initServer from './app';
import * as dotenv from 'dotenv';

dotenv.config();

const init = async () => {
  const app = await initServer();
  app.listen(8000, () => {
    console.log('Server is up and running');
  });
};

init();
