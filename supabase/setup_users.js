/**
 * CAHRA — Supabase Initial User Setup
 * =====================================
 * One-time script to create the four CAHRA roles in Supabase Auth
 * and populate the profiles table.
 *
 * REQUIRES: The SERVICE ROLE key (not anon/publishable).
 *
 * Where to find it:
 *   Supabase Dashboard → Project Settings → API
 *   → "service_role" (starts with "sb_secret_..." or a long JWT)
 *   NEVER put this key in frontend code or commit it to git.
 *
 * PowerShell usage:
 *   $env:SUPABASE_URL="https://jbrtgwhrcnkardaujdvi.supabase.co"
 *   $env:SUPABASE_SERVICE_KEY="sb_secret_YOUR_SERVICE_KEY_HERE"
 *   node supabase/setup_users.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\n❌  Missing environment variables.\n');
  console.error('Run with:');
  console.error('  $env:SUPABASE_URL="https://jbrtgwhrcnkardaujdvi.supabase.co"');
  console.error('  $env:SUPABASE_SERVICE_KEY="sb_secret_YOUR_KEY"');
  console.error('  node supabase/setup_users.js\n');
  process.exit(1);
}

// Detect if user accidentally provided the publishable/anon key
if (SUPABASE_SERVICE_KEY.startsWith('sb_publishable_')) {
  console.error('\n❌  Wrong key type!\n');
  console.error('You provided the ANON / PUBLISHABLE key.');
  console.error('To create users, you need the SERVICE ROLE key:\n');
  console.error('  1. Go to: https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/settings/api');
  console.error('  2. Copy the key labelled "service_role" (starts with sb_secret_ or eyJ...)');
  console.error('  3. Re-run this script with that key.\n');
  console.error('The anon key you provided belongs in .env as VITE_SUPABASE_ANON_KEY');
  console.error('(which is already set correctly).\n');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const CAHRA_USERS = [
  {
    email: 'admin@hospital.ai',
    password: 'Admin@CAHRA2026!',
    full_name: 'Shanju Admin',
    role: 'admin',
    department: 'Operations',
    employee_id: 'EMP-001',
  },
  {
    email: 'doctor@hospital.ai',
    password: 'Doctor@CAHRA2026!',
    full_name: 'Dr. Sarah Chen',
    role: 'doctor',
    department: 'Emergency Medicine',
    employee_id: 'EMP-002',
  },
  {
    email: 'staff@hospital.ai',
    password: 'Staff@CAHRA2026!',
    full_name: 'James Wilson',
    role: 'staff',
    department: 'Nursing',
    employee_id: 'EMP-003',
  },
  {
    email: 'auditor@hospital.ai',
    password: 'Auditor@CAHRA2026!',
    full_name: 'Maria Rodriguez',
    role: 'auditor',
    department: 'Quality & Compliance',
    employee_id: 'EMP-004',
  },
];

async function main() {
  console.log('\n🏥  CAHRA — Supabase User Setup\n');
  console.log(`🔗  Project: ${SUPABASE_URL}\n`);

  let successCount = 0;

  for (const u of CAHRA_USERS) {
    process.stdout.write(`  Creating ${u.email} (${u.role})... `);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        full_name: u.full_name,
        role: u.role,
        department: u.department,
        employee_id: u.employee_id,
      },
    });

    if (authError) {
      if (
        authError.message.toLowerCase().includes('already exists') ||
        authError.message.toLowerCase().includes('already been registered')
      ) {
        console.log('⚠️  already exists — skipped');
        successCount++;
        continue;
      }
      console.log(`❌  ${authError.message}`);
      continue;
    }

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: authData.user.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        department: u.department,
        employee_id: u.employee_id,
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      console.log(`✅  Auth OK — ⚠️  Profile: ${profileError.message}`);
    } else {
      console.log('✅  Done');
      successCount++;
    }
  }

  console.log('\n─────────────────────────────────────────────');

  if (successCount === CAHRA_USERS.length) {
    console.log('✅  All 4 users created successfully!\n');
    console.log('Default credentials:\n');
    for (const u of CAHRA_USERS) {
      console.log(`  ${u.role.padEnd(8)} │ ${u.email.padEnd(26)} │ ${u.password}`);
    }
    console.log('\n⚠️  Change these passwords after first login:');
    console.log(`   https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/auth/users\n`);
    console.log('✅  Your .env already has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    console.log('   Restart your dev server: npm run dev\n');
  } else {
    console.log(`⚠️  ${CAHRA_USERS.length - successCount} user(s) failed. Check errors above.\n`);
  }
}

main().catch((err) => {
  console.error('\n❌ Unexpected error:', err.message || err);
  process.exit(1);
});
