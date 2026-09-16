/**
 * CAHRA — Supabase User Setup (Anon Key Version)
 * ================================================
 * Creates CAHRA users using the standard signup API.
 * Works with the ANON / PUBLISHABLE key (no service role needed).
 *
 * BEFORE RUNNING — Do these two things in Supabase Dashboard:
 *
 *   1. Run the schema SQL:
 *      https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/sql/new
 *      → Paste contents of supabase/schema.sql → Run
 *
 *   2. Disable email confirmations:
 *      https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/settings/auth
 *      → Email section → "Enable email confirmations" → OFF → Save
 *
 *   3. If admin@hospital.ai and doctor@hospital.ai already appear in:
 *      https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/auth/users
 *      → Click each → "Confirm email" (or delete and let this script recreate them)
 *
 * PowerShell usage:
 *   $env:SUPABASE_URL="https://jbrtgwhrcnkardaujdvi.supabase.co"
 *   $env:SUPABASE_ANON_KEY="sb_publishable_3VCfXpBiZbBEMWqCJw-dfg_cIML78P3"
 *   node supabase/setup_users_anon.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://jbrtgwhrcnkardaujdvi.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'sb_publishable_3VCfXpBiZbBEMWqCJw-dfg_cIML78P3';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function signupUser(user) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      data: {
        full_name: user.full_name,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
      },
    }),
  });
  return res.json();
}

async function upsertProfile(accessToken, userId, user) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: userId,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      department: user.department,
      employee_id: user.employee_id,
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || j.details || `HTTP ${res.status}`);
  }
}

async function loginAndUpsertProfile(user) {
  // Log in as the newly created user to get a valid access token
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Login failed: ${error.message}`);
  if (!data.session) throw new Error('No session returned');
  await upsertProfile(data.session.access_token, data.user.id, user);
  await supabase.auth.signOut();
}

async function main() {
  console.log('\n🏥  CAHRA — Supabase User Setup (Anon Key Mode)\n');
  console.log(`🔗  Project: ${SUPABASE_URL}\n`);

  let successCount = 0;

  for (const user of CAHRA_USERS) {
    process.stdout.write(`  ${user.email} (${user.role})... `);

    try {
      // Step 1: Try signing up
      const result = await signupUser(user);

      const userId = result.user?.id ?? result.id;
      const accessToken = result.access_token;
      const errorMsg = result.msg || result.error_description || result.message || '';

      if (errorMsg) {
        const lower = errorMsg.toLowerCase();

        if (lower.includes('already registered') || lower.includes('already exists')) {
          // User exists — try to login and upsert profile
          process.stdout.write('exists — updating profile... ');
          try {
            await loginAndUpsertProfile(user);
            console.log('✅  Profile synced');
          } catch (e) {
            console.log(`✅  (profile update skipped: ${e.message})`);
          }
          successCount++;
          continue;
        }

        if (lower.includes('rate limit') || lower.includes('email')) {
          console.log(`❌  ${errorMsg}`);
          console.log('');
          console.log('     ➜  Fix: Disable email confirmations in Supabase Auth settings:');
          console.log('        https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/settings/auth');
          console.log('        Auth → Email → "Enable email confirmations" → OFF → Save');
          console.log('        Then re-run this script.\n');
          continue;
        }

        throw new Error(errorMsg);
      }

      if (!userId) {
        // email confirmation required but no session — wait for confirmation
        console.log('⚠️  Awaiting email confirmation. Disable confirmations and re-run.');
        continue;
      }

      // Step 2: Upsert profile using the session from signup
      if (accessToken) {
        try {
          await upsertProfile(accessToken, userId, user);
          console.log('✅  Created + profile set');
        } catch (profileErr) {
          // Trigger may have already written the profile
          console.log(`✅  Created (profile via trigger: ${profileErr.message})`);
        }
      } else {
        console.log('✅  Created');
      }

      successCount++;
    } catch (err) {
      const lower = (err.message || '').toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists')) {
        process.stdout.write('exists — updating profile... ');
        try {
          await loginAndUpsertProfile(user);
          console.log('✅  Profile synced');
        } catch (e) {
          console.log(`✅  (${e.message})`);
        }
        successCount++;
      } else {
        console.log(`❌  ${err.message}`);
      }
    }

    // Small pause between users to avoid rate limits
    await sleep(500);
  }

  console.log('\n─────────────────────────────────────────────');

  if (successCount === CAHRA_USERS.length) {
    console.log('✅  All 4 CAHRA users ready!\n');
    console.log('Credentials:\n');
    for (const u of CAHRA_USERS) {
      console.log(`  ${u.role.padEnd(8)} │ ${u.email.padEnd(26)} │ ${u.password}`);
    }
    console.log('\n  Login accepts short names too: "admin", "doctor", "staff", "auditor"');
    console.log('\n⚠️  Change passwords after first login:');
    console.log(`   https://supabase.com/dashboard/project/jbrtgwhrcnkardaujdvi/auth/users\n`);
    console.log('🚀  Start the full stack:\n');
    console.log('   Terminal 1: backend\\venv\\Scripts\\uvicorn.exe backend.app:app --host 127.0.0.1 --port 8000 --reload');
    console.log('   Terminal 2: npm run dev\n');
  } else {
    console.log(`\n  ${successCount}/4 users ready.`);
    console.log('  Fix the errors above then re-run — script is safe to run multiple times.\n');
  }
}

main().catch((err) => {
  console.error('\n❌', err.message || err);
  process.exit(1);
});
