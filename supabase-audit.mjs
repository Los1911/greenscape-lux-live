import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(url, key)

const runTest = async () => {
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) console.error('❌ Supabase error:', error.message)
  else console.log('✅ Supabase connected successfully:', data)
}

runTest()
