import { getFeedPosts } from './lib/db/feed';

async function run() {
  const posts = await getFeedPosts();
  console.log(posts);
}
run();
