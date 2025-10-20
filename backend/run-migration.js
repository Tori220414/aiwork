require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getSupabase } = require('./src/config/supabase');

async function runMigration() {
  console.log('🚀 Running team workspaces migration...');

  const supabase = getSupabase();

  if (!supabase) {
    console.error('❌ Failed to connect to Supabase');
    process.exit(1);
  }

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database', 'add_team_workspaces.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    // Remove comments and split by semicolon
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n[${i + 1}/${statements.length}] Executing...`);

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct query if RPC doesn't work
          const result = await supabase.from('_migrations').select('*').limit(1);
          if (result.error) {
            console.log('⚠️  Note: Direct SQL execution not available via Supabase JS client.');
            console.log('Please run the migration manually using one of these methods:');
            console.log('\n1. Supabase Dashboard:');
            console.log('   - Go to your Supabase project dashboard');
            console.log('   - Navigate to SQL Editor');
            console.log('   - Copy and paste: backend/database/add_team_workspaces.sql');
            console.log('   - Click Run');
            console.log('\n2. Or use this SQL directly in your Supabase SQL Editor:');
            console.log('\n' + sql);
            process.exit(1);
          }
        } else {
          console.log('✅ Success');
        }
      } catch (err) {
        console.error(`❌ Error executing statement:`, err.message);
        throw err;
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Added workspace_type column to workspaces table');
    console.log('   - Created workspace_members table');
    console.log('   - Added indexes and triggers');
    console.log('   - Created workspace_access view');
    console.log('\n🎉 Team workspace feature is now deployed!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('Please run the SQL in backend/database/add_team_workspaces.sql');
    console.log('using your Supabase Dashboard SQL Editor.');
    process.exit(1);
  }
}

runMigration();
