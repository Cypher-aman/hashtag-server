import initServer from './app';

const init = async () => {
  const app = await initServer();
  app.listen(8000, () => {
    console.log('Server is up and running');
  });
};

init();
