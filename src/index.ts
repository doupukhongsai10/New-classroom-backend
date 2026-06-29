import express from 'express';
import { subjects } from './db/schema/app';
import subjectsRouter from './routes/subject';

import cors from 'cors'


const app=express();
const PORT=8000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

app.use('/api/subjects', subjectsRouter)

app.get('/',(req,res)=>{
    res.send('Hello!, Welcome to classroom API');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});