<template>
    <v-container>
        <div v-if="GET_LOAD_PHOTO_CART">
            <v-list-item v-for="(item, i) in productsCart" :key="item.id" class="mb-4">
                <ProductCart :item="item" :index="i"></ProductCart>
            </v-list-item>
        </div>
        <v-list-item>
            <v-card margin="0px">
                <v-card-actions>
                    <v-card-actions v-if="errorCheckout">
                        <v-alert type="error">
                            {{ $t('ERROR_NOT_CHECKOUT_PRODUCTS') }}
                        </v-alert>
                    </v-card-actions>
                </v-card-actions>
                <v-card-actions>
                    Subtotal({{ GET_PRODUCTS_CHECKOUT.length }} items):{{ ' '
                    }}<b>{{ GET_TOTAL_PRICE_CHECKOUT.toFixed(2) }}$</b>
                </v-card-actions>
                <v-card-actions>
                    <v-btn
                        @click="checkout"
                        color="primary"
                        outlined
                        class="btn-remove"
                        :disabled="onCheckout"
                        >{{ $t('PROCEED_CHECKOUT') }}</v-btn
                    >
                </v-card-actions>
            </v-card>
        </v-list-item>
    </v-container>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { authModule, carts, payments, loader } from '@/store/namespaces';
import ProductCart from '@/modules/client/cart/components/ProductCart.vue';
import AuthMethods from '@/store/auth/methods/auth.methods';
import CartMethods from '@/store/carts/methods/cart.methods';
import LoaderTypes from '@/store/loader/methods/loader.methods';
import { ITEM_TYPE, CURRENCY } from '../../../../config/constants';
import PaymentsTypes from '@/store/payments/methods/payments.methods';
import { CartInterface, ProductCarts } from '../interfaces/carts.interface';
import { CustomerInterface } from '@/modules/client/auth/interfaces/customer.interface';

@Component({
    components: { ProductCart },
})
export default class Cart extends Vue {
    public productsCart?: ProductCarts[] = [];
    public productsCheckout?: ProductCarts[] = [];
    public onCheckout = true;
    item: any;
    public errorCheckout?: boolean = false;

    @Watch('GET_PRODUCTS_CHECKOUT.length')
    check(): void {
        var ischecked = false;
        this.productsCheckout = this.GET_PRODUCTS_CHECKOUT;
        this.productsCheckout.forEach((products: ProductCarts) => {
            if (products.quantity! > 0) {
                ischecked = true;
            }
        });
        if (this.GET_PRODUCTS_CHECKOUT.length > 0 && ischecked) {
            this.onCheckout = false;
        } else {
            this.onCheckout = true;
        }
    }

    @Watch('GET_CART_OBJECT')
    @Watch('GET_PRODUCTS_CART')
    getProducts(): void {
        this.productsCart = this.GET_CART_OBJECT;
    }

    async mounted(): Promise<void> {
        if (this.GET_AUTH_TOKEN !== '') {
            this.FALSE_PHOTO_CART();
            await this.GET_ITEMS_CARS(this.GET_CLIENT_DATA.id!);
            if (this.GET_CART_OBJECT) {
                await this.FETCH_PRODUCT_CART_PHOTO_BY_NAME(this.GET_CART_OBJECT);
            }
            this.productsCart = this.GET_CART_OBJECT;
        }
    }

    onCheckoutTrue() {
        this.onCheckout = false;
    }

    getProductPrice(item) {
        if (item.product.offer) {
            return `${parseFloat(item.product.offer.discountPrice) * parseInt(item.quantity)}`;
        }

        return `${parseFloat(item.product.price) * parseInt(item.quantity)}`;
    }

    createOrder() {
        //! FIX: Ajustar en lo que esté listo el checkout con CoinGate
    }

    async checkout() {
        if (this.GET_PRODUCTS_CHECKOUT.length > 0) {
            this.errorCheckout = false;
            this.$router.push('/checkout');
        } else {
            this.errorCheckout = true;
        }
    }

    @loader.Action(LoaderTypes.actions.SHOW_LOADER) SHOW_LOADER!: (loading: boolean) => void;

    @authModule.Getter(AuthMethods.getters.GET_AUTH_TOKEN)
    GET_AUTH_TOKEN!: string;
    @authModule.Getter(AuthMethods.getters.GET_CLIENT_DATA)
    GET_CLIENT_DATA!: CustomerInterface;

    @carts.Action(CartMethods.actions.GET_ITEMS_CARS) GET_ITEMS_CARS!: (clientId: number) => boolean;
    @carts.Action(CartMethods.actions.FETCH_PRODUCT_CART_PHOTO_BY_NAME)
    FETCH_PRODUCT_CART_PHOTO_BY_NAME!: (products: ProductCarts[]) => boolean;

    @carts.Getter(CartMethods.getters.GET_CART_OBJECT)
    GET_CART_OBJECT!: ProductCarts[];
    @carts.Getter(CartMethods.getters.GET_PRODUCTS_CART)
    GET_PRODUCTS_CART!: ProductCarts[];

    @carts.Getter(CartMethods.getters.GET_PRODUCTS_CHECKOUT)
    GET_PRODUCTS_CHECKOUT!: ProductCarts[];
    @carts.Getter(CartMethods.getters.GET_TOTAL_PRICE_CHECKOUT)
    GET_TOTAL_PRICE_CHECKOUT!: number;
    @carts.Getter(CartMethods.getters.GET_LOAD_PHOTO_CART)
    GET_LOAD_PHOTO_CART!: boolean;
    @carts.Mutation(CartMethods.mutations.FALSE_PHOTO_CART) FALSE_PHOTO_CART;

    @payments.Action(PaymentsTypes.actions.CREATE_ORDER) private CREATE_ORDER;
}
</script>

<style>
.btn-remove {
    height: 30px !important;
}
</style>
