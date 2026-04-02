import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongodb';
import Category from '../src/models/Category';

const LAPTOP_SUB_CATEGORIES = [
  {
    name: 'Gaming Laptop',
    slug: 'gaming-laptop',
    description: 'Laptop hiệu năng cao cho game',
    order: 1,
    isActive: true,
  },
  {
    name: 'Ultrabook',
    slug: 'ultrabook',
    description: 'Mỏng nhẹ, thời trang',
    order: 2,
    isActive: true,
  },
  {
    name: 'Workstation',
    slug: 'workstation',
    description: 'Đồ họa, lập trình chuyên nghiệp',
    order: 3,
    isActive: true,
  },
  {
    name: 'Laptop Sinh Viên',
    slug: 'laptop-sinh-vien',
    description: 'Giá tốt, phù hợp học tập',
    order: 4,
    isActive: true,
  }
];

async function seed() {
  try {
    await dbConnect();
    console.log('Connected to MongoDB');

    // 1. Find or create parent "Laptop" category
    let laptopParent = await Category.findOne({ slug: 'laptop' });
    if (!laptopParent) {
      console.log('Parent "Laptop" not found, creating...');
      laptopParent = await Category.create({
        name: 'Laptop',
        slug: 'laptop',
        order: 0,
        isActive: true,
        description: 'Các dòng laptop chính hãng'
      });
    }

    // 2. Create sub-categories
    for (const sub of LAPTOP_SUB_CATEGORIES) {
      const existing = await Category.findOne({ slug: sub.slug });
      if (existing) {
        console.log(`Sub-category "${sub.name}" already exists, updating...`);
        await Category.updateOne({ slug: sub.slug }, { ...sub, parent: laptopParent._id });
      } else {
        console.log(`Creating sub-category "${sub.name}"...`);
        await Category.create({ ...sub, parent: laptopParent._id });
      }
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
