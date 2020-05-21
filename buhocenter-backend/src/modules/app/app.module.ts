import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { SendGridModule } from '@anchan828/nest-sendgrid';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinstonModule } from 'nest-winston';
import { LoggerSettingsService } from '../settings/services/logger.service';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlatformManagementModule } from '../platform-management/platform-management.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesModule } from '../purchases/purchases.module';

import * as dotenv from 'dotenv';
dotenv.config();
import { CartsModule } from '../carts/carts.module'
import { StatussModule } from '../status/status.module'
import { ServicesModule } from '../services/services.module'


import { AddressModule } from '../address/address.module'



@Module({
  imports: [TypeOrmModule.forRoot(),
    UsersModule,
    ProductsModule,
    PurchasesModule,
    NotificationsModule,
    PlatformManagementModule,
    WinstonModule.forRootAsync({
      useClass: LoggerSettingsService,
    }),CartsModule,StatussModule,
    ,AddressModule,
    SendGridModule.forRoot({
      apikey: process.env.SENDGRID_API_KEY,
    }),ServicesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
