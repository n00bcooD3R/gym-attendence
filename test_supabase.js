const { createClient } = require('@supabase/supabase-js');

const url = 'https://pkdtvkiiqvrhltfdwneu.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZHR2a2lpcXZyaGx0ZmR3bmV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODMwODMsImV4cCI6MjA5NDE1OTA4M30.qOPFXgW1r1_qVxRZ2zxlni6nL0STebcAV0R9jtRXoQQ';

const supabase = createClient(url, key);

async function test() {
  console.log('Fetching members...');
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching members:', error);
    } else {
      console.log('Success! Found members:', data);
    }
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
