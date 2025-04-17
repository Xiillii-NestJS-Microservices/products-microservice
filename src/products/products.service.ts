import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductService');

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;

    const totalProducts = await this.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalProducts / (limit ?? 1));

    return {
      data: await this.product.findMany({
        skip: (page ?? 1 - 1) * (limit ?? 1),
        take: limit,
        where: { available: true },
      }),
      meta: {
        total: totalProducts,
        page: page,
        lastPage: lastPage,
      },
    };
  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: {
        id: id,
        available: true,
      },
    });

    if (!product) {
      throw new RpcException(`Product with id: ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto;
    await this.findOne(id);

    return await this.product.update({
      data: data,
      where: {
        id,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return await this.product.update({
      where: { id: id },
      data: {
        available: false,
      },
    });
  }
}
