import dotenv from 'dotenv';
import { environmentSchema } from './environment.schema.js';

dotenv.config();

export const environment = environmentSchema.parse(process.env);
