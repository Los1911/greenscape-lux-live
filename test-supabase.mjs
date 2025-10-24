import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mwvcbedvnimabfwubazz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dmNiZWR2bmltYWJmd3ViYXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjIyMzksImV4cCI6MjA2NDEzODIzOX0.koz-XZMMXUk2XfXwRvar5UqQSZVK5WTtFfmPZ0HskSY'
);

const runTest = async () => {
  const { error } = await supabase.from('users').select('*').limit(1);
  console.log('✅ Connection test result:', error || 'Success!');
};

runTest();
