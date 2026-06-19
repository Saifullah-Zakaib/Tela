import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const emailQuery = process.argv[2] || 'usamazakaib333';

await mongoose.connect(process.env.MONGO_URI);

const users = await User.find({
  $or: [
    { email: new RegExp(emailQuery, 'i') },
    { email: emailQuery },
  ],
}).select('name email role isEmailVerified');

if (users.length === 0) {
  console.log('No users found matching:', emailQuery);
  await mongoose.disconnect();
  process.exit(1);
}

console.log('Found users:');
for (const u of users) {
  console.log(`- ${u.email} (${u.name}, ${u.role}) verified=${u.isEmailVerified}`);
}

const result = await User.updateMany(
  { email: new RegExp(emailQuery, 'i') },
  { $set: { isEmailVerified: true }, $unset: { emailVerificationToken: '' } },
);

console.log(`Updated ${result.modifiedCount} user(s) — isEmailVerified set to true.`);

const updated = await User.find({ email: new RegExp(emailQuery, 'i') }).select('name email isEmailVerified');
console.log('After update:', JSON.stringify(updated, null, 2));

await mongoose.disconnect();
