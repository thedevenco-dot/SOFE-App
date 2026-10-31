import mongoose from 'mongoose';
import { runContentSeed } from './seed';

async function main() {
  const uri = process.env['MONGODB_URI'] || 'mongodb://127.0.0.1:27017/sofe_dev';
  const dbName = process.env['MONGODB_DB_NAME'] || 'sofe_dev';

  console.log(`Connecting to MongoDB at ${uri} (db: ${dbName})...`);
  await mongoose.connect(uri, { dbName, retryWrites: true });
  console.log('Connected to MongoDB.');

  console.log('Seeding initial SOFE content (T2.2)...');
  const result = await runContentSeed(mongoose.connection);

  console.log('\nSeed completed successfully:');
  console.log(`  - Categories:   ${result.categories}`);
  console.log(`  - Instructors:  ${result.instructors}`);
  console.log(`  - Topics:       ${result.topics}`);
  console.log(`  - Authors:      ${result.authors}`);
  console.log(`  - Courses:      ${result.courses}`);
  console.log(`  - Lessons:      ${result.lessons}`);
  console.log(`  - Articles:     ${result.articles}`);
  console.log(`  - Books:        ${result.books}`);
  console.log(`  - Videos:       ${result.videos}`);
  console.log(`  - Quotes:       ${result.quotes}`);
  console.log(`  - Words:        ${result.words}`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
