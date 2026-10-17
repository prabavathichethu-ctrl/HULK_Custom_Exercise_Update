import {createLibraryHandler} from './handler.mjs';
Deno.serve(createLibraryHandler({url:Deno.env.get('SUPABASE_URL'),key:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}));
