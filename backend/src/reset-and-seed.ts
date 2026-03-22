import { flushDatabase, flushUserTable, flushPlayerTable } from './game/helpers/chore';

async function main() {
  console.log('Flushing database...');
  await flushDatabase();
  await flushPlayerTable();
  await flushUserTable();
  console.log('Database flushed. Starting seed...');
  require('./seed');
}

main();
