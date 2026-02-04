import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  location: string;
  companyId: string;
  searchId: string;
  start?: number; // Offset para paginação - buscar mais resultados
}

interface SerpAPIResult {
  place_id: string;
  title: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  type?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: SearchRequest = await req.json();
    const { query, location, companyId, searchId, start = 0 } = body;

    // Validate required fields
    if (!query || !location || !companyId || !searchId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization check: Verify user belongs to the requested company
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.company_id !== companyId) {
      console.warn('Authorization violation attempt detected');
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation - enforce length limits and sanitize inputs
    const maxQueryLength = 200;
    const maxLocationLength = 100;

    if (typeof query !== 'string' || typeof location !== 'string') {
      return new Response(
        JSON.stringify({ error: "Query and location must be strings" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (query.length > maxQueryLength || location.length > maxLocationLength) {
      return new Response(
        JSON.stringify({ error: `Query must be under ${maxQueryLength} characters and location under ${maxLocationLength} characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9\s.,\-'áéíóúàèìòùâêîôûãõçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇÑ]/gi, '');
    const sanitizedLocation = location.trim().replace(/[^a-zA-Z0-9\s.,\-'áéíóúàèìòùâêîôûãõçñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇÑ]/gi, '');

    if (!sanitizedQuery || !sanitizedLocation) {
      return new Response(
        JSON.stringify({ error: "Query and location cannot be empty after sanitization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SQL Injection check
    const sqlPattern = /(union\s+select|insert\s+into|update\s+.+\s+set|delete\s+from|drop\s+table|exec\s*\(|script\s*>)/i;
    if (sqlPattern.test(query) || sqlPattern.test(location)) {
      console.warn("Potential SQL injection attempt detected:", { query: query.substring(0, 50), location: location.substring(0, 50) });
      return new Response(
        JSON.stringify({ error: "Invalid input detected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings
    const { data: settings, error: settingsError } = await supabase
      .from("company_settings")
      .select("serpapi_key, waha_api_url, waha_api_key, waha_session")
      .eq("company_id", companyId)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching company settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch company settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serpapiKey = settings?.serpapi_key;
    let leads: any[] = [];
    let hasMoreResults = false;

    if (serpapiKey) {
      console.log(`Using SerpAPI for search, start=${start}...`);
      
      const searchQuery = `${sanitizedQuery} em ${sanitizedLocation}`;
      const RESULTS_PER_PAGE = 20; // Resultados por página
      
      // Busca apenas uma página por vez
      const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}&api_key=${serpapiKey}&hl=pt-br&gl=br&start=${start}`;
      
      console.log(`Fetching SerpAPI page start=${start}`);

      try {
        const serpResponse = await fetch(serpApiUrl);
        const serpData = await serpResponse.json();

        if (serpData.error) {
          console.error("SerpAPI error:", serpData.error);
          const errorMessage = String(serpData.error).toLowerCase();
          let clientError = "Search service temporarily unavailable";
          let statusCode = 503;
          if (errorMessage.includes('api key') || errorMessage.includes('invalid')) {
            clientError = "Configuration error"; statusCode = 500;
          } else if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
            clientError = "Rate limit reached"; statusCode = 429;
          }
          return new Response(
            JSON.stringify({ error: clientError }),
            { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const localResults = serpData.local_results || [];
        
        // Verifica se tem mais resultados disponíveis
        hasMoreResults = Boolean(serpData.serpapi_pagination?.next);

        leads = localResults.map((result: SerpAPIResult) => {
          return {
            name: result.title,
            phone: result.phone || null,
            has_whatsapp: false, 
            email: null,
            has_email: false,
            address: result.address,
            category: result.type || query,
            rating: result.rating || null,
            reviews_count: result.reviews || 0,
            website: result.website || null,
            company_id: companyId,
            search_id: searchId,
          };
        });

      } catch (serpError) {
        console.error("SerpAPI request error:", serpError);
        return new Response(
          JSON.stringify({ error: "Search service error" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ✅ RETORNAR LEADS IMEDIATAMENTE (usuário não espera)
      console.log(`Returning ${leads.length} leads to user immediately`);

      // 🔄 VALIDAÇÃO ASSÍNCRONA EM BACKGROUND (não bloqueia resposta)
      if (settings?.waha_api_url && settings?.waha_api_key && settings?.waha_session && leads.length > 0) {
        console.log("Starting background WhatsApp validation with rate limiting");
        
        // Inicia validação em background (não aguarda)
        (async () => {
          const wahaSession = settings.waha_session;
          const leadsWithPhone = leads.filter(l => l.phone);
          const maxToValidate = Math.min(leadsWithPhone.length, 10); // Limita a 10 por busca
          
          console.log(`[Background] Validating ${maxToValidate} of ${leadsWithPhone.length} leads with 3s delay`);
          
          let validatedCount = 0;
          let whatsappFoundCount = 0;
          
          for (let i = 0; i < maxToValidate; i++) {
            const lead = leadsWithPhone[i];
            
            try {
              const cleanPhone = lead.phone.replace(/\D/g, "");
              const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
              const wahaUrl = `${settings.waha_api_url}/api/contacts/check-exists?phone=${phoneWithCountry}&session=${wahaSession}`;
              
              const wahaResponse = await fetch(wahaUrl, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-Api-Key": settings.waha_api_key,
                },
              });

              if (wahaResponse.ok) {
                const wahaData = await wahaResponse.json();
                const exists = wahaData.numberExists === true;
                
                // Atualizar no banco de dados
                await supabase
                  .from('leads')
                  .update({ has_whatsapp: exists })
                  .eq('id', lead.id);
                
                validatedCount++;
                if (exists) whatsappFoundCount++;
                
                console.log(`[Background] ${i + 1}/${maxToValidate} validated: ${lead.name} = ${exists ? 'YES' : 'NO'}`);
              }
            } catch (wahaError) {
              console.error(`[Background] Error validating ${lead.name}`);
            }
            
            // ⏱️ DELAY DE 3 SEGUNDOS entre validações (previne bloqueio)
            if (i < maxToValidate - 1) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            }
          }
          
          console.log(`[Background] Validation complete: ${validatedCount} validated, ${whatsappFoundCount} have WhatsApp`);
        })().catch(err => {
          console.error('[Background] Validation error:', err);
        });
      }

    } else {
      // Mock Data Logic
      console.log("No SerpAPI key configured, using mock data...");
      const mockCount = 20; // Mock retorna 20 por página
      const categories = [query, `${query} Premium`, `${query} Express`];
      const streets = ["Rua das Flores", "Av. Brasil", "Rua São Paulo", "Av. Paulista", "Rua Augusta"];

      // Simula paginação - máximo de 3 páginas (60 resultados)
      const maxMockResults = 60;
      if (start < maxMockResults) {
        const remaining = maxMockResults - start;
        const count = Math.min(mockCount, remaining);
        hasMoreResults = (start + count) < maxMockResults;

        leads = Array.from({ length: count }, (_, i) => {
          const index = start + i;
          const hasWhatsApp = Math.random() > 0.3;
          const hasEmail = Math.random() > 0.4;
          return {
            name: `${query} ${location} #${index + 1}`,
            phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
            has_whatsapp: hasWhatsApp,
            email: hasEmail ? `contato${index + 1}@empresa.com.br` : null,
            has_email: hasEmail,
            address: `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(100 + Math.random() * 2000)} - ${location}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
            reviews_count: Math.floor(10 + Math.random() * 500),
            website: Math.random() > 0.5 ? `https://www.empresa${index + 1}.com.br` : null,
            company_id: companyId,
            search_id: searchId,
          };
        });
      }
    }

    // Insert leads into database (Mantido original com filtro de duplicados por segurança)
    if (leads.length > 0) {
      // Remover duplicatas exatas dentro do lote atual (mesmo nome e endereço)
      const uniqueLeads = leads.filter((lead, index, self) =>
        index === self.findIndex((t) => (
          t.name === lead.name && t.address === lead.address
        ))
      );

      const { error: insertError } = await supabase
        .from("leads")
        .insert(uniqueLeads);

      if (insertError) {
        console.error("Error inserting leads:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save leads" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update count
      await supabase
      .from("search_history")
      .update({ results_count: uniqueLeads.length })
      .eq("id", searchId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: uniqueLeads.length,
          usedRealApi: Boolean(serpapiKey),
          hasMore: hasMoreResults,
          nextStart: start + uniqueLeads.length,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Update empty history
    await supabase
      .from("search_history")
      .update({ results_count: 0 })
      .eq("id", searchId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: 0,
        usedRealApi: Boolean(serpapiKey),
        hasMore: false,
        nextStart: start,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});