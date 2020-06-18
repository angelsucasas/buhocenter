import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTransactionsRepository } from './transaction/products.transaction.service';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { StatussModule } from '../status/status.module';
import { BrandsController } from './controllers/brand.controllers';
import { ProvidersController } from './controllers/provider.controllers';
import { BrandsService } from './services/brands.service';
import { ProvidersService } from './services/providers.service';
import { CategoriesService } from './services/categories.service';
import { CataloguesService } from './services/catalogues.service';
import { CategoriesController } from './controllers/categories.controller';
import { CataloguesController } from './controllers/catalogues.controllers';
import { entities } from './entities';

@Module({
    imports: [TypeOrmModule.forFeature(entities), StatussModule],
    controllers: [
        ProductsController,
        BrandsController,
        ProvidersController,
        CategoriesController,
        CataloguesController,
    ],
    providers: [
        ProductsService,
        BrandsService,
        ProvidersService,
        ProductTransactionsRepository,
        CataloguesService,
        CategoriesService,
    ],
    exports: [ProductsService],
})
export class ProductsModule {}
