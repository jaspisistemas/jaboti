import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
// UsersModule removed after unification into PessoasModule
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
// import { DepartmentsModule } from './departments/departments.module'; // deprecated (English)
import { DepartamentosModule } from './departamentos/departamentos.module';
// removed ClientsModule
import { PessoasModule } from './pessoas/pessoas.module';
import { AtendimentosModule } from './atendimentos/atendimentos.module';
import { UploadsModule } from './uploads/uploads.module';
import { UploadsMiddleware } from './uploads/uploads.middleware';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, PessoasModule, AuthModule, CompaniesModule, DepartamentosModule, AtendimentosModule, UploadsModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UploadsMiddleware)
      .forRoutes({ path: 'uploads/*', method: RequestMethod.GET });
  }
}
