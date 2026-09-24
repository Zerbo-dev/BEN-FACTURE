import { createClient } from "@supabase/supabase-js";

let admin;
/** Client serveur (clé service_role). Ne jamais l'utiliser côté navigateur. */
export function db() {
  if (!admin) {
    admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

/** Lève une erreur lisible si la requête Supabase a échoué. */
export function must({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}
