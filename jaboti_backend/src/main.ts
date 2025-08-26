import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { PrismaService } from './prisma/prisma.service';
import * as express from 'express';
import { UPLOADS_CONFIG } from './uploads/uploads.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    cors: {
      origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:3522',  // Frontend rodando na porta 3522
        'http://192.168.100.46:3000',
        'http://192.168.100.46:3522'  // Frontend rodando na porta 3522
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    },
    bodyParser: true,
  });
  
  // Configurar limites de upload para arquivos grandes
  const maxSize = `${UPLOADS_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}mb`;
  app.use(express.json({ limit: maxSize }));
  app.use(express.urlencoded({ limit: maxSize, extended: true }));
  
  // Configurar timeout para uploads grandes
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setTimeout(UPLOADS_CONFIG.UPLOAD_TIMEOUT); // Usar configuração centralizada
    next();
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // app.use(helmet()); // Temporariamente desabilitado para resolver problema de CORS
  app.use(compression());

  const config = new DocumentBuilder()
    .setTitle('Jaboti API')
    .setDescription('API multiempresa de atendimento Jaboti')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Seed removido para otimizar startup em desenvolvimento
  // Para criar usuário admin, usar: npm run prisma:seed

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3523;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`);
}

bootstrap();
