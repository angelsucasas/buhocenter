import { Repository, EntityManager, SelectQueryBuilder } from 'typeorm';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { STATUS } from '../../../config/constants';
import { ProductsAO, idDto } from '../dto/products.dto';
import { Product } from '../entities/product.entity';
import { ProductRating } from '../entities/product-rating.entity';
import { ProductInventory } from '../entities/product-inventory.entity';
import { ProductDimension } from '../entities/product-dimension.entity';
import { StatusService } from '../../status/services/status.service';
import { BrandsService } from '../services/brands.service';
import { CategoriesService } from '../services/categories.service';
import { ProductPhoto } from '../entities/product-photo.entity';
import { Offer } from '../entities/offer.entity';
import { ProductParameters } from '../interfaces/product-parameters';
import { PaginatedProducts } from '../interfaces/paginated-products';
import { PAGINATE } from '../../../config/constants';
import { throws } from 'assert';
import { ProductQuestion } from '../entities/product-question.entity';
import { UsersService } from '../../users/services/users.service';
import { ProductQuestions } from '../interfaces/product-questions';

@Injectable()
export class ProductsService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>,
        @InjectRepository(ProductRating)
        private readonly productRatingsRepository: Repository<ProductRating>,
        @InjectRepository(ProductInventory)
        private readonly productInventoriesRepository: Repository<ProductInventory>,
        @InjectRepository(ProductDimension)
        private readonly productDimensionRepository: Repository<ProductDimension>,
        @InjectRepository(Offer)
        private readonly offerRepository: Repository<Offer>,
        @Inject(StatusService)
        private readonly statusService: StatusService,
        @Inject(BrandsService)
        private readonly brandsService: BrandsService,
        @Inject(CategoriesService)
        private readonly categoriesService: CategoriesService,
        @InjectRepository(ProductPhoto)
        private readonly productPhotoRepository: Repository<ProductPhoto>,
        @InjectRepository(ProductQuestion)
        private readonly productQuestionRepository: Repository<ProductQuestion>,
        @Inject(UsersService)
        private readonly usersService: UsersService,
    ) {}

    /**
     * Returns the appreciations emitted to a product array
     * @param products products array to obtain its appreciations
     */
    private async getProductAverageRating(products: Product[]): Promise<void> {
        for await (const product of products) {
            product.productRatings = await this.productRatingsRepository.query(
                `SELECT ROUND(AVG(CP.rating)) as rating, COUNT(*) as total
                    FROM product_ratings CP
                    WHERE CP.product_id = ${product.id}
                `.trim(),
            );

            this.logger.debug(
                `getProductAverageRating [id=${product.id}|productRatings=${JSON.stringify(
                    product.productRatings,
                )}]`,
            );
        }
    }

    /**
     * Returns the quantity available in inventory according to a product
     * @param productId product id to obtain the inventory availability
     * @returns Promise<ProductInventory>
     */
    public async getProductInventoryAvailability(productId: number): Promise<ProductInventory> {
        this.logger.debug(`getProductInventoryAvailability: [productId=${productId}]`, {
            context: ProductsService.name,
        });
        try {
            return this.productInventoriesRepository.findOne(productId);
        } catch (e) {
            console.log(`error al buscar en inventario: ${e.message}`);
        }
    }

    /**
     * Creates a new entity in the product inventory
     * @param productInventory productInventory entity to save in database
     * @param transactionalEntityManager
     */
    public async updateProductInventory(
        productInventory,
        transactionalEntityManager: EntityManager,
    ): Promise<any> {
        this.logger.debug(`updateProductInventory: [productInventory=${JSON.stringify(productInventory)}]`, {
            context: ProductsService.name,
        });

        const productInventoryTransactionRepository: Repository<ProductInventory> = transactionalEntityManager.getRepository(
            ProductInventory,
        );

        return productInventoryTransactionRepository.save(productInventory);
    }

    /**
     * Returns the product by id
     * @param id product id
     */
    public async getProductById(id: number): Promise<Product> {
        this.logger.debug(`getProductById: [id=${id}]`, {
            context: ProductsService.name,
        });

        const product: Product = await this.productsRepository.findOne({
            where: { id },
            relations: [
                'productPhotos',
                'provider',
                'productDimension',
                'brand',
                'offer',
                'productQuestions',
            ],
        });

        await this.getProductAverageRating([product]);

        product.productInventory = await this.getProductInventoryAvailability(id);

        return product;
    }

    /**

     * getProducts
     * @param parameters: ProductParameters
     * @returns Promise<PaginatedProducts>
    */
    async getProducts(parameters: ProductParameters): Promise<PaginatedProducts> {
        this.logger.debug(
            `getProducts:  Getting products by a set of parameters [parameters:${JSON.stringify(
                parameters,
            )}]`,
            {
                context: ProductsService.name,
            },
        );

        parameters.start = parameters.start || PAGINATE.START;
        parameters.limit = parameters.limit || PAGINATE.LIMIT;

        parameters.start = parameters.start * parameters.limit - parameters.limit;
        let query: SelectQueryBuilder<Product> = this.productsRepository
            .createQueryBuilder('product')
            .innerJoinAndSelect('product.status', 'status')
            .innerJoinAndSelect('product.productPhotos', 'productPhotos')
            .innerJoinAndSelect('product.brand', 'brand')
            .innerJoinAndSelect('product.provider', 'provider')
            .innerJoin('product.productInventory', 'productInventory')
            .innerJoin('product.productCatalogues', 'productCatalogues')
            .innerJoin('productCatalogues.catalogue', 'catalogue')
            .innerJoin('catalogue.category', 'category')
            .leftJoin('product.offer', 'offer');

        !parameters.name ||
            query.andWhere('UPPER(product.name) LIKE :name', { name: `%${parameters.name.toUpperCase()}%` });
        !parameters.rating ||
            query.andWhere('FLOOR(product.rating) = :rating', { rating: parameters.rating });
        !parameters.price || query.andWhere('product.price <= :price', { price: parameters.price });
        !parameters.brandId || query.andWhere('brand.id = :brandId ', { brandId: parameters.brandId });
        !parameters.providerId ||
            query.andWhere('provider.id = :providerId ', { providerId: parameters.providerId });
        !parameters.offerId || query.andWhere('offer.id = :offerId ', { offerId: parameters.offerId });
        !parameters.catalogueId ||
            query.andWhere('catalogue.id = :catalogueId', { catalogueId: parameters.catalogueId });
        !parameters.categoryId ||
            query.andWhere('category.id = :categoryId', { categoryId: parameters.categoryId });
        query.andWhere('productInventory.availableQuantity - productInventory.minimumAvailableQuantity > 0');
        query.andWhere('status.id = :statusId', { statusId: STATUS.ACTIVE.id });

        return {
            products: await query
                .skip(parameters.start)
                .take(parameters.limit)
                .getMany(),
            productsNumber: await query.getCount(),
        };
    }

    async findProduct(ProductID: number): Promise<Product> {
        return await this.productsRepository.findOne(ProductID);
    }

    /**
     * Obtiene el listado de products recomendados del dia
     */
    public async getDailyProductsRecommendation(): Promise<Product[]> {
        this.logger.debug(`getDailyProductsRecommendation: ejecutando query`, {
            context: ProductsService.name,
        });
        let products: Product[] = await this.productsRepository.find({
            where: `status_id = ${STATUS.ACTIVE.id}`,
            join: {
                alias: 'products',
                innerJoinAndSelect: {
                    photos: 'products.productPhotos',
                    productProvider: 'products.provider',
                    provider: 'products.provider',
                    catalogues: 'products.productCatalogues',
                    catalogue: 'catalogues.catalogue',
                    category: 'catalogue.category',

                    status: 'products.status',
                },
            },
        });
        await this.getProductAverageRating(products);
        products = this.randomProducts(products);
        return products;
    }

    randomProducts(products: Product[]): Product[] {
        const randomProducts = products.sort((a, b) => Math.random() - 0.5);
        return [...randomProducts].slice(0, 5);
    }

    async updateUsersProduct(productId: number, updatedProduct) {
        let active = STATUS.ACTIVE.id;
        let verifyProduct = await this.productsRepository.findOne({
            where: { id: productId, status: active },
        });

        let maybeProviderArray, maybeCategoryArray;

        if (!verifyProduct) {
            throw new BadRequestException('that Product is not accesable for the system');
        } else {
            this.logger.debug(`updateUsersProduct: [id=${JSON.stringify(updatedProduct)}]`, {
                context: ProductsService.name,
            });

            let keys = Object.entries(updatedProduct);
            for (var i = 0; i < keys.length; i++) {
                switch (keys[i][0]) {
                    case 'productName':
                        if ((keys[i][1] as string) == '') {
                            this.logger.info(`updateUsersProduct: name not declare, not updating name..`, {
                                context: ProductsService.name,
                            });
                        } else {
                            verifyProduct.name = keys[i][1] as string;
                        }

                        break;

                    case 'description':
                        if ((keys[i][1] as string) == '') {
                            this.logger.info(
                                `updateUsersProduct: description not declare, not updating description..`,
                                { context: ProductsService.name },
                            );
                        } else {
                            verifyProduct.description = keys[i][1] as string;
                        }

                        break;

                    case 'price':
                        if ((keys[i][1] as number) == 0) {
                            this.logger.info(`updateUsersProduct: price not declare, not updating price..`, {
                                context: ProductsService.name,
                            });
                        } else {
                            verifyProduct.price = keys[i][1] as number;
                        }
                        break;

                    case 'category':
                        let maybeCategory: idDto = keys[i][1] as idDto;
                        if ((maybeCategory.id as number) == 0) {
                            this.logger.info(
                                `updateUsersProduct: category not declare, not updating category..`,
                                { context: ProductsService.name },
                            );
                        } else {
                            let maybeCategoryArray: number = keys[i][1] as number;
                            await this.categoriesService.createCategoryProduct(
                                maybeCategoryArray,
                                verifyProduct,
                            );
                        }

                        break;

                    case 'brand':
                        if ((keys[i][1] as number) == 0) {
                            this.logger.info(`updateUsersProduct: brand not declare, not updating brand...`, {
                                context: ProductsService.name,
                            });
                        } else {
                            verifyProduct.brand = await this.brandsService.getBrand(keys[i][1] as number);
                        }

                        break;
                }
            }
        }

        await this.productsRepository.save(verifyProduct);
        this.logger.info(
            `updateUsersProduct: product updated and save succesfully [verifyProduct=${JSON.stringify(
                verifyProduct,
            )}]`,
            { context: ProductsService.name },
        );

        return 'product updated succesfully';
    }

    async deleteProduct(productId: number) {
        let active = STATUS.ACTIVE.id;
        let findProduct = await this.productsRepository.findOne({
            where: { id: productId, status: active },
        });

        if (!findProduct) {
            throw new BadRequestException('product not found or not accesable');
        } else {
            let unaccesable = await this.statusService.getStatusById(STATUS.INACTIVE.id);
            findProduct.status = unaccesable;

            await this.productsRepository.save(findProduct);
            this.logger.info(`deleteProduct: product deleted succesfully [verifyProduct=${productId}]`, {
                context: ProductsService.name,
            });
            return 'product deleted sucesfully';
        }
    }

    public async getAllProducts(): Promise<Product[]> {
        let active = STATUS.ACTIVE.id;
        return await this.productsRepository.find({
            where: { status: active },
        });
    }

    public async deletMultiplesProducts(productsArray: number[]): Promise<string> {
        const status = Promise.all(
            productsArray.map(async value => {
                await this.deleteProduct(value);
            }),
        );

        return 'products deleted sucesfully';
    }

    public async createProduct(product: ProductsAO): Promise<Product> {
        let active = STATUS.ACTIVE.id;
        let newProduct = new Product();
        newProduct.name = product.productName;
        newProduct.description = product.description;
        newProduct.price = product.price;

        newProduct.status = await this.statusService.getStatusById(active);
        newProduct.brand = await this.brandsService.getBrand(product.brand.id);
        await this.productsRepository.save(newProduct);

        await this.categoriesService.createCategoryProduct(product.category.id, newProduct);

        return newProduct;
    }

    async createDimension(
        newWidth: string,
        newHeight: string,
        newLong: string,
        verifiedProduct: number,
    ): Promise<any> {
        let newDimension = new ProductDimension();
        let foundProduct = await this.productsRepository.findOne(verifiedProduct);
        newDimension.width = newWidth;
        newDimension.height = newHeight;
        newDimension.long = newLong;
        newDimension.product = foundProduct;
        await this.productDimensionRepository.save(newDimension);

        return true;
    }

    async saveProductImage(imageName: string, productId: number): Promise<string> {
        let imageProduct: Product = await this.productsRepository.findOne(productId);
        let newProductPhoto = new ProductPhoto();
        newProductPhoto.product = imageProduct;
        newProductPhoto.content = imageName;
        await this.productPhotoRepository.save(newProductPhoto);
        return 'product associate with image!';
    }

    public async saveInventory(quantity, productId): Promise<string> {
        let newProductInventory = new ProductInventory();
        let foundProduct = await this.productsRepository.findOne(productId);
        newProductInventory.product = foundProduct;
        newProductInventory.availableQuantity = quantity;
        await this.productInventoriesRepository.save(newProductInventory);
        return 'inventorio guardado';
    }

    public async updateInventory(quantity: number, productId: number): Promise<string> {
        let foundProduct = await this.productsRepository.findOne(productId);
        let foundInventory = await this.productInventoriesRepository.findOne({
            where: { product: foundProduct },
        });
        foundInventory.availableQuantity = quantity;

        await this.productInventoriesRepository.save(foundInventory);
        return 'inventario actualizado exitosamente';
    }

    public async findOffer(offer: Offer): Promise<Offer> {
        return await this.offerRepository.findOne(offer);
    }

    public async assignOffer(
        productId: number,
        offerId: number,
        transactionalEntityManager: EntityManager,
    ): Promise<boolean> {
        try {
            let ProductRepository: Repository<Product> = await transactionalEntityManager.getRepository(
                Product,
            );
            await ProductRepository.update({ id: productId }, { offer: { id: offerId } });

            return true;
        } catch (e) {
            this.logger.error(
                `assignOffer: error when trying to assign the offer to product [offerId=${offerId}| productId=${productId}|error=${JSON.stringify(
                    e.message,
                )}]`,
            );

            return false;
        }
    }

    public async deleteOffer(productId: number, transactionalEntityManager: EntityManager): Promise<boolean> {
        try {
            let ProductRepository: Repository<Product> = await transactionalEntityManager.getRepository(
                Product,
            );
            await ProductRepository.update({ id: productId }, { offer: null });

            return true;
        } catch (e) {
            this.logger.error(
                `assignOffer: error when trying to delete the offer to product [productId=${productId}|error=${JSON.stringify(
                    e.message,
                )}]`,
            );

            return false;
        }
    }

    /**
     * updateProductRating
     * @param product: Partial<Product>
     * @param transactionEntityManager: EntityManager
     * @returns void
     */
    async updateProductRating(product: Partial<Product>, transactionEntityManager: EntityManager) {
        this.logger.debug(`updateProductRating: Updating the rating of a product [productId=${product.id}]`, {
            context: ProductsService.name,
        });

        const productTransactionRepository: Repository<Product> = transactionEntityManager.getRepository(
            Product,
        );

        const { avgRating } = await productTransactionRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.productRatings', 'productRatings')
            .select('AVG(productRatings.rating)', 'avgRating')
            .where('product.id = :productId', { productId: product.id })
            .getRawOne();

        await productTransactionRepository.update({ id: product.id }, { rating: avgRating });
    }

    public async addQuestionToProduct(productAndQuestion: ProductQuestions): Promise<boolean> {
        try {
            let newProductQuestion = new ProductQuestion();
            newProductQuestion.comment = productAndQuestion.comment;
            newProductQuestion.product = await this.findProduct(productAndQuestion.product.id);
            newProductQuestion.user = await this.usersService.getUserById(productAndQuestion.user.id);

            await this.productQuestionRepository.save(newProductQuestion);

            return true;
        } catch (e) {
            this.logger.error(
                `addQuestionToProduct: error when trying to save the comment to product [productAndQuestion=${JSON.stringify(
                    productAndQuestion,
                )}|error=${JSON.stringify(e.message)}]`,
                {
                    context: ProductsService.name,
                },
            );

            throw new BadRequestException('error when trying to to save the comment to product');
            return false;
        }
    }

    public async deleteQuestionInProduct(questionId: number): Promise<boolean> {
        try {
            await this.productQuestionRepository.delete({
                id: questionId,
            });

            return true;
        } catch (e) {
            this.logger.error(
                `deleteQuestionInProduct: error when trying to delete the comment in the product [questionId=${questionId}|error=${JSON.stringify(
                    e.message,
                )}]`,
            );

            throw new BadRequestException('error when trying to delete the comment in the product');
            return false;
        }
    }

    public async getAllQuestionsInProduct(productId: number): Promise<any> {
        try {
            let foundProduct = await this.findProduct(productId);
            return await this.productQuestionRepository.find({
                where: { product: foundProduct },
                join: {
                    alias: 'productsQuestions',
                    innerJoinAndSelect: {
                        user: 'productsQuestions.user',
                    },
                },
            });
        } catch (e) {
            this.logger.error(
                `getAllQuestionsInProduct: error when trying to get all comments in the product [productId=${productId}|error=${JSON.stringify(
                    e.message,
                )}]`,
            );

            throw new BadRequestException('error when trying to get all comments in the product');
            return false;
        } 
    }

    public async getPdfData(paymentId: number){
        return await this.productsRepository.query(
                `SELECT p.name, p.price, c.quantity, c.product_price, c.offer_price, u.name, u.last_name, u.email, ad.first_street, ad.second_street, ad.city, ad.state, ad.zip_code, pay.transaction_id, pay.total, pay.total_criptocurrency
                    FROM users as u, addresses as ad, carts as c, products as p, payments as pay
                    WHERE (pay.id = ${paymentId}) and (pay.id = c.payment_id) and (c.customer_id = u.id) and (ad.id = pay.direction_id) and (c.product_id = p.id)
                `.trim(),
            );
    }
}
