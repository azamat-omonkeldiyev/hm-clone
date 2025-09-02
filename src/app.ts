import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import moduleRoutes from './app/routes';
import globalErrorHandler from './app/middleware/globalErrorHandler';
import notFound from './app/middleware/notFound';

const app: Application = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://real-estate-front-end-two.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running!');
});


// All module routes
app.use('/api', moduleRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
