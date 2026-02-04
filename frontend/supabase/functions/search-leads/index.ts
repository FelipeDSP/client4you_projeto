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
    const { query, location, companyId, searchId } = body;

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

    if (serpapiKey) {
      console.log("Using SerpAPI for search with pagination...");
      
      const searchQuery = `${sanitizedQuery} em ${sanitizedLocation}`;
      const TARGET_RESULTS = 50; // Meta de 50 resultados
      let nextStart = 0;
      let fetchMore = true;

      // Loop para buscar múltiplas páginas até chegar a 50
      while (leads.length < TARGET_RESULTS && fetchMore) {
        
        // Adicionamos 'start' para controlar a paginação
        const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}&api_key=${serpapiKey}&hl=pt-br&gl=br&start=${nextStart}`;
        
        console.log(`Fetching SerpAPI page start=${nextStart}, current leads=${leads.length}`);

        try {
          const serpResponse = await fetch(serpApiUrl);
          const serpData = await serpResponse.json();

          if (serpData.error) {
            console.error("SerpAPI error:", serpData.error);
            // Se der erro na primeira página, retornamos erro. Se for nas seguintes, seguimos com o que temos.
            if (leads.length === 0) {
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
            break; 
          }

          const localResults = serpData.local_results || [];
          
          if (localResults.length === 0) {
            fetchMore = false;
            break;
          }

          const newLeads = localResults.map((result: SerpAPIResult) => {
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

          leads = [...leads, ...newLeads];

          // Verifica se tem próxima página na SerpApi
          if (serpData.serpapi_pagination?.next && leads.length < TARGET_RESULTS) {
            nextStart += 20; // Google Maps avança de 20 em 20
          } else {
            fetchMore = false;
          }

        } catch (serpError) {
          console.error("SerpAPI request error:", serpError);
          break; // Para o loop em caso de erro de rede
        }
      }

      // Corta se passar de 50
      if (leads.length > TARGET_RESULTS) {
        leads = leads.slice(0, TARGET_RESULTS);
      }

      // Validate WhatsApp logic (mantida original)
      if (settings?.waha_api_url && settings?.waha_api_key && settings?.waha_session) {
        const wahaSession = settings.waha_session;
        console.log("WAHA Configuration found - validating", leads.filter(l => l.phone).length, "leads with phone numbers");
        
        let validatedCount = 0;
        let whatsappFoundCount = 0;
        let errorCount = 0;
        
        // Loop de validação sobre TODOS os leads coletados
        for (const lead of leads) {
          if (lead.phone) {
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
                lead.has_whatsapp = exists;
                validatedCount++;
                if (exists) whatsappFoundCount++;
              } else {
                errorCount++;
              }
            } catch (wahaError) {
              console.error("WAHA validation error occurred");
              errorCount++;
            }
          }
        }
        console.log(`WAHA Summary: Validated ${validatedCount}, Found ${whatsappFoundCount}`);
      }

    } else {
      // Mock Data Logic (mantida original, ajustada para 50)
      console.log("No SerpAPI key configured, using mock data...");
      const mockCount = 50; // Mock agora retorna 50
      const categories = [query, `${query} Premium`, `${query} Express`];
      const streets = ["Rua das Flores", "Av. Brasil", "Rua São Paulo", "Av. Paulista", "Rua Augusta"];

      leads = Array.from({ length: mockCount }, (_, i) => {
        const hasWhatsApp = Math.random() > 0.3;
        const hasEmail = Math.random() > 0.4;
        return {
          name: `${query} ${location} #${i + 1}`,
          phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          has_whatsapp: hasWhatsApp,
          email: hasEmail ? `contato${i + 1}@empresa.com.br` : null,
          has_email: hasEmail,
          address: `${streets[Math.floor(Math.random() * streets.length)]}, ${Math.floor(100 + Math.random() * 2000)} - ${location}`,
          category: categories[Math.floor(Math.random() * categories.length)],
          rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
          reviews_count: Math.floor(10 + Math.random() * 500),
          website: Math.random() > 0.5 ? `https://www.empresa${i + 1}.com.br` : null,
          company_id: companyId,
          search_id: searchId,
        };
      });
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