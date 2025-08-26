import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function run(){
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('Jaboti API')
    .setDescription('API multiempresa de atendimento Jaboti')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  writeFileSync('swagger.json', JSON.stringify(doc, null, 2));
  await app.close();
  // eslint-disable-next-line no-console
  console.log('Swagger exportado para swagger.json');
}
run().catch(e=>{ console.error(e); process.exit(1); });
