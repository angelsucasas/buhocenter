import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { SendGridService } from '@anchan828/nest-sendgrid';
import { Logger } from 'winston';
import { ProductsService } from '../../products/services/products.service'

@Injectable()
export class PdfsService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,       
        private readonly ProductsService: ProductsService,
    ) {}

  
    /**
     * Send the welcome email to user
     * @param to string
     * @param name string
     * @returns Promise<void>
     */
    public async createPdf(paymentId: number): Promise<any> {
        this.logger.debug(`sendPdf: creating pdf of order... []`, {
            context: PdfsService.name,
        });

        try{
            let pdfClienteData = await this.ProductsService.getPdfClientData(paymentId);        
            console.log(`pdfClienteData: ${JSON.stringify(pdfClienteData)}`);
            let pdfCartData = await this.ProductsService.getPdfCartData(paymentId);    
            let today = new Date;    
            let currentTime = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate(); 

            const path = require('path');

            // Define font files
            var fonts = {
              Roboto: {
                normal: path.resolve('src','modules','notifications','fonts', 'Roboto-Light.ttf'),
                bold:  path.resolve('src','modules','notifications','fonts', 'Roboto-Medium.ttf'),
                italics:  path.resolve('src','modules','notifications','fonts', 'Roboto-Italic.ttf'),
                bolditalics:  path.resolve('src','modules','notifications','fonts', 'Roboto-MediumItalic.ttf'),
              }
            };

            var PdfPrinter = require('pdfmake');
            var printer = new PdfPrinter(fonts);
            var fs = require('fs');
            let prueba= 'sucasas';

            var docDefinition = {  
            /// playground requires you to assign document definition to a variable called dd

            	content: [
            	    {
                        style: 'footer',
                        table: {
                            headerRows: 1,
                            widths: [ 200, 100, 200],
                            heights:[ 10, 10, 10],
                            body: [
                                ['',{text: 'Buhocenter', style: 'tableHeader',alignment: 'center'},''],
                                ['',{},''],
                            ]
                        },
                        layout: 'headerLineOnly'
                    },
            		{
            			style: 'tableExample',
            			color: '#444',
            			table: {
            				widths: [ '*', '*'],
            				headerRows: 2,
            				// keepWithHeaderRows: 1,
            				body: [
            					[{text: `facture`, style: 'tableHeader', alignment: 'left', colSpan: 2}, ''],
            					[{text: `client ID: ${pdfClienteData[0].id}`, style: 'tableHeader', alignment: 'left'}, {text: `facture ID: ${pdfCartData[0].id}`, style: 'tableHeader', alignment: 'left'}],
            					[{text: `date: ${currentTime}`, style: 'tableHeader', alignment: 'left'},{text: `transaction ID: ${pdfClienteData[0].transaction_id}`, style: 'tableHeader', alignment: 'left' }],
            				]
            			},
            			layout:{fillColor: function (rowIndex, node, columnIndex) {
            					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
            			}}
            		},
            		{
            			style: 'fisrtTable',
            			color: '#444',
            			table: {
            				widths: [ '*', '*'],
            				headerRows: 2,
            				// keepWithHeaderRows: 1,
            				body: [
            					[{text: `client data`, style: 'tableHeader', alignment: 'left', colSpan: 2}, ''],
            					[{text: `name: ${pdfClienteData[0].name}`, style: 'tableHeader', alignment: 'left'}, {text: `last name: ${pdfClienteData[0].last_name}`, style: 'tableHeader', alignment: 'left'}],
            					[{text: `email: ${pdfClienteData[0].email}`, style: 'tableHeader', alignment: 'left', colSpan: 2 },''],
            				]
            			},
            			layout:{fillColor: function (rowIndex, node, columnIndex) {
            					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
            			}}
            		},
            		
            		{
            			style: 'tableExample',
            			color: '#444',
            			table: {
            				
            				widths: [ '*', '*'],
            				// keepWithHeaderRows: 1,
            				body: [
            					[{text: 'address', style: 'tableHeader'}, {text: `zip code: ${pdfClienteData[0].zip_code}`, style: 'tableHeader'}],
            					[{text: `first street: ${pdfClienteData[0].first_street}`, style: 'tableHeader', alignment: 'left'}, {text: `second street: ${pdfClienteData[0].second_street}`, style: 'tableHeader'}],
            					[{text: `city : ${pdfClienteData[0].city}`, style: 'tableHeader', alignment: 'left'}, {text: `state: ${pdfClienteData[0].state}`, style: 'tableHeader'}],
            				]
            			},
            			layout:{fillColor: function (rowIndex, node, columnIndex) {
            					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
            				}}
            		},

            		{
            			style: 'tableExample',
            			color: '#444',
            			table: {
            				widths: [ '*', 50, 80, 80, 100],
            				headerRows: 2,
            				// keepWithHeaderRows: 1,
            				body: [
            					[{text: 'products', style: 'header', colSpan: 5, alignment: 'center'}, {}, {},'',{}],
            					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'discount', style: 'tableHeader', alignment: 'center'},{text: 'import', style: 'tableHeader', alignment: 'center'}],        					
            				]
            			},
            			layout: {
            				fillColor: function (rowIndex, node, columnIndex) {
            					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
            				}
            			}
            		},
            		
            		{
            			style: 'leftTable',
            			color: '#444',
            			alignment: 'center',
            			table: {
            				widths: [ 100, 100],
            				
            				// keepWithHeaderRows: 1,
            				
            				body: [
            					[{text: `total:`, style: 'tableHeader', alignment: 'left'}, {text: `${pdfClienteData[0].total}`, style: 'tableHeader', alignment: 'center'}],
                                [{text: `total cryp:`, style: 'tableHeader', alignment: 'left'}, {text: `${pdfClienteData[0].total_cryptocurrency}`, style: 'tableHeader', alignment: 'center'}],
            				]
            			},
            			layout:{fillColor: function (rowIndex, node, columnIndex) {
            					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
            			}}
            		},
            		
            	],
            	styles: {
            		header: {
            			fontSize: 13,
            			bold: true,
            			margin: [0, 0, 0, 5],
            			color:'black'
            		},
            		subheader: {
            			fontSize: 16,
            			bold: true,
            			margin: [0, 10, 0, 5]
            		},
            		tableExample: {
            			margin: [0, 5, 0, 15]
            		},
            		tableHeader: {
            			bold: true,
            			fontSize: 13,
            			color: 'black'
            		},
            		leftTable: {
            			margin: [298, 5, 0, 15]
            		},
            	
                	defaultStyle: {
                		// alignment: 'justify'
                	},
                	footer: {
                		margin: [0, 0, 0, 15]
                	},
                	
                	fisrtTable: {
                		margin: [0, 30, 0, 15]
                	},
            	}
            };
            let totalPrice;

            pdfCartData.forEach(product =>             
                docDefinition.content[4].table.body.push([{text: `${product.name}`, style: 'tableHeader', alignment: 'center'}, {text: `${product.quantity}`, style: 'tableHeader', alignment: 'center'}, {text: `${product.product_price}`, style: 'tableHeader', alignment: 'center'},{text: `${product.offer_price}`, style: 'tableHeader', alignment: 'center'},{text: `${(product.price*product.quantity).toFixed(2)}`, style: 'tableHeader', alignment: 'center'}],)
            );
            
            var options = {
              // ...
            }

            var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
            await pdfDoc.pipe(fs.createWriteStream('./src/modules/notifications/pdf/document.pdf'));
            pdfDoc.end();       

            return true;   

        }catch(e){

            this.logger.error(`sendPdf: error when trying to create the pdf of the order with id[orderId =${paymentId}]|error=${JSON.stringify(e.message)}`, {
                context: PdfsService.name,
            });

            throw new BadRequestException('error when trying to create the pdf of the order...');

            return false;

        }
    }
}
