import { Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../app/entities/base-entity';
import { Category } from './category.entity';
import { Product } from './product.entity';

import { ProductCatalogue } from './product-catalogue.entity';


@Entity({ name: 'producto_categoria' })
export class ProductCategory extends BaseEntity {

	@JoinColumn({ name: 'category_id' })
	@ManyToOne(type => Category, category => category.productCategories)
	category: Category;

	@OneToMany(type => ProductCatalogue, productCatalogues => productCatalogues.productCategory)
	productCatalogues: ProductCatalogue[];

}
