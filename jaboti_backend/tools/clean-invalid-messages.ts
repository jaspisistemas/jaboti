import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInvalidMessages() {
  console.log('🧹 Iniciando limpeza de mensagens com valores padrão inválidos...');
  
  const invalidDefaultValues = [
    'Imagem', 'imagem', 'IMAGEM',
    'Vídeo', 'vídeo', 'Video', 'video', 'VIDEO', 'VÍDEO',
    'Documento', 'documento', 'DOCUMENTO',
    'Arquivo', 'arquivo', 'ARQUIVO',
    'Mídia', 'mídia', 'Media', 'media', 'MEDIA', 'MÍDIA',
    'File', 'file', 'FILE',
    'Image', 'image', 'IMAGE',
    '"Imagem"', '"imagem"', '"IMAGEM"',
    '"Vídeo"', '"vídeo"', '"Video"', '"video"', '"VIDEO"', '"VÍDEO"',
    '"Documento"', '"documento"', '"DOCUMENTO"'
  ];

  // Encontrar mensagens problemáticas
  const problematicMessages = await prisma.message.findMany({
    where: {
      AND: [
        { mediaType: { not: null } },
        { content: { in: invalidDefaultValues } }
      ]
    },
    select: {
      id: true,
      content: true,
      mediaType: true,
      senderType: true,
      timestamp: true
    }
  });

  console.log(`📊 Encontradas ${problematicMessages.length} mensagens com valores inválidos:`);
  problematicMessages.forEach(msg => {
    console.log(`  - ID: ${msg.id}, Content: "${msg.content}", MediaType: ${msg.mediaType}`);
  });

  if (problematicMessages.length > 0) {
    console.log('🔧 Corrigindo mensagens...');
    
    const updateResult = await prisma.message.updateMany({
      where: {
        AND: [
          { mediaType: { not: null } },
          { content: { in: invalidDefaultValues } }
        ]
      },
      data: {
        content: ''
      }
    });

    console.log(`✅ ${updateResult.count} mensagens corrigidas!`);
  } else {
    console.log('✅ Nenhuma mensagem problemática encontrada!');
  }
}

cleanInvalidMessages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
