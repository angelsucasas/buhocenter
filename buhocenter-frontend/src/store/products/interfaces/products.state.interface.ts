import { Product } from '@/modules/client/products/interfaces/products.interface';

export interface ProductStateInterface {
    products: Product[];
    productsAndPhotosLoaded: boolean;
    productsDaily: Product[];
    productsDailyAndPhotosLoaded: boolean;
    totalProducts: number;
    itemDetail: Product;
}
