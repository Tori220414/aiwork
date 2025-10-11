const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set. Database features will be limited.');
    return null;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase initialized successfully');
    return supabase;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase:', error.message);
    return null;
  }
};

const getSupabase = () => {
  if (!supabase) {
    supabase = initializeSupabase();
  }
  return supabase;
};

module.exports = {
  initializeSupabase,
  getSupabase
};
