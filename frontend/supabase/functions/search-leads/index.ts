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

    // Authorization check
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

    // Input sanitization
    const sanitizedQuery = query.trim();
    const sanitizedLocation = location.trim();

    // Get company settings (SERP & WAHA)
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
      console.log("Using SerpAPI for search...");
      const searchQuery = `${sanitizedQuery} em ${sanitizedLocation}`;
      const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}&api_key=${serpapiKey}&hl=pt-br&gl=br`;

      try {
        const serpResponse = await fetch(serpApiUrl);
        const serpData = await serpResponse.json();

        if (serpData.error) {
          console.error("SerpAPI error:", serpData.error);
          return new Response(
            JSON.stringify({ error: "Search service error" }),
            { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const localResults = serpData.local_results || [];
        
        leads = localResults.map((result: SerpAPIResult) => {
          return {
            name: result.title,
            phone: result.phone || null,
            has_whatsapp: false, // Default value
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

        // --- VALIDAÇÃO WHATSAPP (AQUI ESTÁ O SEGREDO) ---
        if (settings?.waha_api_url && settings?.waha_api_key && settings?.waha_session) {
          const wahaSession = settings.waha_session;
          console.log(`Validating ${leads.length} leads with WAHA...`);
          
          // Processa em paralelo para ser mais rápido
          await Promise.all(leads.map(async (lead) => {
            if (lead.phone) {
              try {
                // Limpa o telefone
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
                  if (wahaData.exists === true || wahaData.numberExists === true) {
                    lead.has_whatsapp = true;
                  }
                }
              } catch (wahaError) {
                console.error("WAHA check error:", wahaError);
              }
            }
          }));
        }
      } catch (serpError) {
        console.error("SerpAPI request error:", serpError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch from SerpAPI" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Mock data logic (fallback)
      console.log("No SerpAPI key, using mock data");
      leads = []; // ... (seu código mock existente)
    }

    // Insert leads into database
    if (leads.length > 0) {
      const { error: insertError } = await supabase
        .from("leads")
        .insert(leads);

      if (insertError) {
        console.error("Error inserting leads:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save leads" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Update history
    await supabase
      .from("search_history")
      .update({ results_count: leads.length })
      .eq("id", searchId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: leads.length,
        usedRealApi: Boolean(serpapiKey),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});