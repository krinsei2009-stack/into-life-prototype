(function () {
  const config = window.INTO_LIFE_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const client = configured && window.supabase
    ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
    : null;

  window.intoLife = { configured, supabase: client };
})();
