const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  // Use SERVICE_ROLE key to bypass RLS - required for backend operations
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Database features will be limited.');
    console.warn('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    return null;
  }

  try {
    // Auth options to bypass RLS when using service role key
    const options = {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    };

    supabase = createClient(supabaseUrl, supabaseKey, options);

    const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' :
                    process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : 'ANON_KEY';
    console.log(`✅ Supabase initialized successfully with ${keyType}`);

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
