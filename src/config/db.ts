import { MongooseModule } from '@nestjs/mongoose';

export const databaseProviders = [
  MongooseModule.forRootAsync({
    useFactory: () => {
      const uri = process.env.MONGODB_URI;
      return {
        uri,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
      };
    },
  }),
];
