import { Injectable, Inject } from '@nestjs/common';
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
    public async sendPdf(paymentId: number): Promise<any> {
        this.logger.debug(`sendPdf: creating pdf of order... []`, {
            context: PdfsService.name,
        });

        let pdfData = await this.ProductsService.getPdfData(paymentId);
        return pdfData;

        /*const path = require('path');

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
        			image: path.resolve('src','modules','notifications','assets', 'Logo-completo.png'),
        			width: 200,
        			height: 100,
        		},
        		{
        			style: 'position',
        			color: '#444',
        			table: {
        				widths: [ 130, 130],
        				headerRows: 2,
        				// keepWithHeaderRows: 1,
        				body: [
        					[{text: `facture`, style: 'tableHeader', alignment: 'left', colSpan: 2}, ''],
        					[{text: `client id: ${prueba}`, style: 'tableHeader', alignment: 'left'}, {text: `facture id: ${prueba}`, style: 'tableHeader', alignment: 'center'}],
        					[{text: `date: ${prueba}`, style: 'tableHeader', alignment: 'left', colSpan: 2 },''],
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
        					[{text: `name: ${prueba}`, style: 'tableHeader', alignment: 'left'}, {text: `apellido: ${prueba}`, style: 'tableHeader', alignment: 'center'}],
        					[{text: `email: ${prueba}`, style: 'tableHeader', alignment: 'left', colSpan: 2 },''],
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
        					[{text: 'address', style: 'tableHeader'}, {text: 'zip code', style: 'tableHeader'}],
        					[{text: `first street: ${prueba}`, style: 'tableHeader', alignment: 'left'}, {text: `second street: ${prueba}`, style: 'tableHeader'}],
        					[{text: `city : ${prueba}`, style: 'tableHeader', alignment: 'left'}, {text: `state: ${prueba}`, style: 'tableHeader'}],
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
        				widths: [ '*', 50, 100, 100],
        				headerRows: 2,
        				// keepWithHeaderRows: 1,
        				body: [
        					[{text: 'products', style: 'header', colSpan: 4, alignment: 'center'}, {}, {},''],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'import', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
        					[{text: 'name', style: 'tableHeader', alignment: 'center'}, {text: 'quantity', style: 'tableHeader', alignment: 'center'}, {text: 'ind. price', style: 'tableHeader', alignment: 'center'},{text: 'total price', style: 'tableHeader', alignment: 'center'}],
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
        				headerRows: 1,
        				// keepWithHeaderRows: 1,
        				
        				body: [
        					[{text: `total`, style: 'tableHeader', alignment: 'left'}, {text: `monto`, style: 'tableHeader', alignment: 'center'}],
        				]
        			},
        			layout:{fillColor: function (rowIndex, node, columnIndex) {
        					return (rowIndex % 2 === 0) ? '#CCCCCC' : null;
        			}}
        		},
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
            		margin: [0, 200, 0, 15]
            	},
            	position: {
            		margin: [234, -80, 0, 15]
            	},
            	fisrtTable: {
            		margin: [0, 30, 0, 15]
            	}
        	}	
        };

        var options = {
          // ...
        }

        var pdfDoc = printer.createPdfKitDocument(docDefinition, options);
        //pdfDoc.pipe(fs.createWriteStream('./document.pdf'));
        pdfDoc.end();  

        return pdfDoc;*/
    }
}
