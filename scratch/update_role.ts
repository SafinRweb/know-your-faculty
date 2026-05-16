import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('contributors')
    .update({ role: 'Co Founder & Lead Data Curator' })
    .eq('role', 'Idea and Marketing');
    
  if (error) {
    console.error(error);
  } else {
    console.log('Updated contributors', data);
  }
}
run();
