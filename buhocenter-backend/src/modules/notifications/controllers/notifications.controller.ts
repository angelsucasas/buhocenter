import {
    Controller,
    Get,
    Post,
    Res,
    Body,
    HttpStatus,
    Inject,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AuthGuard } from '@nestjs/passport';
import { PdfsService } from '../services/pdf.service'

//@UseGuards(AuthGuard('jwt'))
@Controller('notificacion')
export class NotificationsController {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,        
        private readonly pdfsService: PdfsService,
    ) {}

    @Get('/:id')
    async validateAddress(
        @Res() res: Response,
        @Param('id') paymentId: number,
    ): Promise<any> {
        this.logger.info(`validateAddress: validating address []`, {
            context: NotificationsController.name,
        });
        
        let response = await this.pdfsService.createPdf(paymentId);
        
        const fs = require('fs');
        const path = require('path');        
        const filePath = './src/modules/notifications/pdf/document.pdf';
  
        const stream = fs.createReadStream(filePath);

        res.writeHead(200, {
            'Content-disposition': 'attachment; filename="' + encodeURIComponent(path.basename(filePath))  + '"',
            'Content-type': 'application/pdf',
        });        

        stream.pipe(res);        
    }
}
