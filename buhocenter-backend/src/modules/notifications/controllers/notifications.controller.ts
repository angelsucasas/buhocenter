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

    @Post('/:id')
    async validateAddress(
        @Res() res: Response,
        @Param('id') paymentId: number,
    ): Promise<any> {
        this.logger.info(`validateAddress: validating address []`, {
            context: NotificationsController.name,
        });
        
        let response = await this.pdfsService.sendPdf(paymentId);
        return res.status(HttpStatus.OK).send(response);
    }
}
