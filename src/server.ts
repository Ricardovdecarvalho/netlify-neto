import express from 'express';
import { wordpressApi } from './api/wordpressApi';

const app = express();
const PORT = process.env.PORT || 3000;

// Monta a API do WordPress em /api/wp
app.use('/', wordpressApi);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});