'use strict';

const prisma = require('../config/prisma');

async function createProduct(data) {
  return prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      type: 'COUPON',
      image_url: data.image_url,
      coupon: {
        create: {
          cost_price: data.cost_price,
          margin_percentage: data.margin_percentage,
          minimum_sell_price: data.minimum_sell_price,
          value_type: data.value_type,
          value: data.value,
        },
      },
    },
    include: { coupon: true },
  });
}

async function findAllAdmin() {
  return prisma.product.findMany({
    include: { coupon: true },
    orderBy: { created_at: 'desc' },
  });
}

async function findByIdAdmin(id) {
  return prisma.product.findUnique({
    where: { id },
    include: { coupon: true },
  });
}

async function updateProduct(id, data) {
  const { cost_price, margin_percentage, minimum_sell_price, value_type, value, ...productFields } =
    data;

  return prisma.product.update({
    where: { id },
    data: {
      ...productFields,
      ...(Object.keys(productFields).length > 0 && { updated_at: new Date() }),
      coupon: {
        update: {
          ...(cost_price !== undefined && { cost_price }),
          ...(margin_percentage !== undefined && { margin_percentage }),
          ...(minimum_sell_price !== undefined && { minimum_sell_price }),
          ...(value_type !== undefined && { value_type }),
          ...(value !== undefined && { value }),
        },
      },
    },
    include: { coupon: true },
  });
}

async function deleteProduct(id) {
  return prisma.product.delete({ where: { id } });
}

const PUBLIC_COUPON_SELECT = {
  id: true,
  name: true,
  description: true,
  type: true,
  image_url: true,
  created_at: true,
  updated_at: true,
  coupon: {
    select: {
      minimum_sell_price: true,
    },
  },
};

async function findAllPublic() {
  return prisma.product.findMany({
    where: { coupon: { is_sold: false } },
    select: PUBLIC_COUPON_SELECT,
    orderBy: { created_at: 'desc' },
  });
}

async function findByIdPublic(id) {
  return prisma.product.findFirst({
    where: { id, coupon: { is_sold: false } },
    select: PUBLIC_COUPON_SELECT,
  });
}

module.exports = {
  createProduct,
  findAllAdmin,
  findByIdAdmin,
  updateProduct,
  deleteProduct,
  findAllPublic,
  findByIdPublic,
};
