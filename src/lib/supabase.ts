import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://chrknucqaduwzxbpgrlr.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNocmtudWNxYWR1d3p4YnBncmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjIyOTgsImV4cCI6MjA5MjYzODI5OH0.bjC_gjN_mvpKA5O6h_cVg0vxH6Gv_ICkaJ-FaRmJPWI'

export const supabase = createClient(url, key)
