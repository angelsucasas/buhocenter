import { Module, forwardRef } from '@nestjs/common';
import { EmailsService } from './services/emails.service';
import { PdfsService } from './services/pdf.service';
import { NotificationsController } from './controllers/notifications.controller'
import { ProductsModule } from '../products/products.module'

@Module({
	imports: [ ProductsModule],
    providers: [EmailsService,PdfsService],
    controllers:[NotificationsController],
    exports: [EmailsService],
})
export class NotificationsModule {}
