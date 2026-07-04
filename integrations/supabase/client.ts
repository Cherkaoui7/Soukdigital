console.time("SUPABASE_CLIENT");

// ... votre code existant ...

// Juste avant le return createClient(...)
console.timeEnd("SUPABASE_CLIENT");
return createClient(...);
