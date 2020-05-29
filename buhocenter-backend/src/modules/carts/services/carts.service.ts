import { createQueryBuilder, Repository, UpdateResult, EntityManager} from 'typeorm';
import { Injectable, Inject} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../../products/entities/product.entity';
import { Cart } from '../entities/cart.entity';
import { ProductCart } from '../entities/product-cart.entity';
import { Customer } from '../../users/entities/customer.entity';
import { CartProductDTO } from '../dto/cartProduct.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { STATUS } from '../../../config/constants';
import { ProductsService } from '../../products/services/products.service';
import { UsersService } from '../../users/services/Users.service';
import { StatusService } from '../../status/services/status.service';
import { CartServiceDTO } from '../dto/cartService.dto';
import { ServiceCart } from '../entities/service-cart.entity';
import { ServicesService } from '../../services/services/services.service';
import { Service } from '../../services/entities/service.entity';
import { Status } from '../../Status/entities/status.entity';

@Injectable()
export class CartsService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
        @InjectRepository(Cart)
        private readonly cartRepository: Repository<Cart>,
        @InjectRepository(ProductCart)
        private readonly productCartRepository: Repository<ProductCart>,
        @InjectRepository(ServiceCart)
        private serviceCartRepository: Repository<ServiceCart>,
        @Inject(ProductsService)
        private readonly ProductsService: ProductsService,
        @Inject(UsersService)
        private readonly UsersService: UsersService,
        @Inject(StatusService)
        private readonly StatusService: StatusService,
        @Inject(ServicesService)
        private readonly ServicesService: ServicesService,
    ) {}

    public async updateCartStatus(
        cartId: number, statusId: number, transactionalEntityManager: EntityManager,
    ): Promise<UpdateResult> {
        const cartTransactionRepository: Repository<Cart> = transactionalEntityManager.getRepository(
            Cart,
        );
        
        return cartTransactionRepository.update({ id: cartId }, { status: { id: statusId }});
    }

    public async findCartUser(customerId: number): Promise<Cart> {
        this.logger.debug(`findCartUser: [customerId = ${customerId}]`, { context: CartsService.name });
        let thisCustomer = await this.UsersService.findUser(customerId);
        let active = await this.StatusService.getStatus(STATUS.ACTIVE.id);
        return await this.cartRepository.findOne({
            where:{customer:thisCustomer, status:active}
        });
    }

	private async createCart(findCustomer: Customer): Promise<Cart> {
        await this.logger.debug(`createCart: creando carrito [findCustomer=${JSON.stringify(findCustomer)}`,
            { context: CartsService.name });
        const active = await this.StatusService.getStatus(STATUS.ACTIVE.id);
        const newCart = new Cart();
        newCart.customer = findCustomer;
        newCart.status = active;
        await this.cartRepository.save(newCart);
        await this.logger.debug(`createCart: carrito creado [findCustomer = ${JSON.stringify(findCustomer)}`,
            { context: CartsService.name });
        return newCart;
	}

    private async createProductCart(cart: Cart, product: Product, quantity: number) {
        const newProductCart: ProductCart = new ProductCart();
        newProductCart.quantity = quantity;
        newProductCart.cart = cart;
        newProductCart.product = product;
        await this.productCartRepository.save(newProductCart);
        this.logger.debug(`createProductCart: relacion producto carrito guardada([cart = ${JSON.stringify(cart)}|product = ${JSON.stringify(product)}|quantity = ${quantity}])`,
            { context: CartsService.name });
    }

    /**
    *asocia un producto a el carrito del cliente
    *@params ProductRes, contiene los datos del producto
    *@returns Promise<Cart>
    */
    public async asociateProductCart( ProductRes: CartProductDTO): Promise<Cart> {
        this.logger.debug(`asociateProductCart:Producto asociado  al carrito exitosamente ([ProductRes = ${JSON.stringify(ProductRes)}])`,
            { context: CartsService.name });

        const findCustomer: Customer = await this.UsersService.findUser(ProductRes.customer.id);
        const findProduct: Product = await this.ProductsService.findProduct(ProductRes.product.id);
        const findCartNewest: Cart = await this.findCartUser(ProductRes.customer.id);
        if (findCartNewest) {
            await this.createProductCart(findCartNewest, findProduct, ProductRes.quantity);
        } else {
            const newCart: Cart = await this.createCart(findCustomer);
            await this.createProductCart(newCart, findProduct, ProductRes.quantity);
        }

        return findCartNewest;
   }

    private async createServiceCart(CustomerCart: Cart, Service, quantity: number) {
        const newServiceCart: ServiceCart = new ServiceCart();
        newServiceCart.quantity = quantity;
        newServiceCart.cart = CustomerCart;
        newServiceCart.service = Service;
        await this.serviceCartRepository.save(newServiceCart);
    }

    async asociateServiceCart( ServiceRes: CartServiceDTO): Promise<string> {
        this.logger.debug(`asociateServiceCart: ([ServiceRes = ${JSON.stringify(ServiceRes)}])`,
            {context: CartsService.name});

        const findCustomer: Customer  = await this.UsersService.findUser(ServiceRes.customer.id);
        const findService: Service  = await this.ServicesService.findService(ServiceRes.service.id);
        const findCartNewest: Cart = await this.findCartUser(ServiceRes.customer.id);

        if (findCartNewest) {
            await this.createServiceCart(findCartNewest, findService, ServiceRes.quantity);
        } else {
            const newCart: Cart = await this.createCart(findCustomer);
            await this.createServiceCart(newCart, findService,
                ServiceRes.quantity);
        }

        this.logger.debug(`asociateServiceCart: ([ServiceRes = ${JSON.stringify(ServiceRes)}])`,
            {context: CartsService.name});

        return 'servicio asociado al carrito exitosamente!';
    }

    async findCartProduct(customerId: number): Promise<any> {
        this.logger.debug(`findCartProduct: [customerId = ${customerId}]`, { context: CartsService.name });
        const cart = await this.cartRepository.findOne({
            where: `cliente_id = ${customerId}`,
            relations: [
                'productCarts',
                'productCarts.checkout',
                'productCarts.product',
                'productCarts.product.photos',
                'productCarts.product.productProvider',
                'productCarts.product.productProvider.provider',
                'productCarts.product.offers',
                'productCarts.product.offers.offer',
            ],
        });
        cart.productCarts = await this.cleanStatusOfferProducts(cart.productCarts);
        cart.productCarts = cart.productCarts.filter((i) => !i.checkout);
        return cart;
    }

    async updateProductCartCheckout(cartId: number, productId: number, checkoutId: number, transactionalEntityManager: EntityManager): Promise<UpdateResult> {
        this.logger.debug(`updateProductCartCheckout: [cartId=${cartId}|productId=${productId}|checkoutId=${checkoutId}]`, { context: CartsService.name });

        const productCartTransactionRepository: Repository<ProductCart> = transactionalEntityManager.getRepository(
            ProductCart,
        );

        return productCartTransactionRepository.query(
            `UPDATE carrito_producto SET checkout_id = ${checkoutId} WHERE carrito_id = ${cartId} AND producto_id = ${productId}`
        );
    }

    /**
     * Esta funcion se encarga de limpiar los productos con la finalidad
     * de devolver una nueva propiedad offer para los productos que tienen alguna
     * oferta activa, en caso contrario la propiedad offer retorna false
     * @param productsCart recibo el arraglo de productos del carrito
     */
    cleanStatusOfferProducts(productsCart: any): any {
        const cleanProductsCartOffer: any[] = [];
        productsCart.map((productCart, index) => {
            const product = productCart.product;
            // tslint:disable-next-line:no-shadowed-variable
            const offer = product.offers.find( offer => offer.id === STATUS.ACTIVE.id);
            delete product.offers;
            if (offer) {
                product.offer = offer;
            } else {
                product.offer = false;
            }
            productCart.product = product;
            cleanProductsCartOffer.push(productCart);
        });
        return cleanProductsCartOffer;
    }

    async dropProductCart(productCartId: number): Promise<boolean> {
        this.logger.debug(`deleteProductCart: ejecutando query para eliminar producto carrito [id = ${productCartId}]`, { context: ServiceCart.name });
        const productCartResponse = await this.productCartRepository.delete(productCartId);
        return !!productCartResponse;
    }

}
