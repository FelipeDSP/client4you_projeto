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

    // Sanitize inputs - remove potentially dangerous characters
    const sanitizedQuery = query.trim().replace(/[<>"']/g, '');
    const sanitizedLocation = location.trim().replace(/[<>"']/g, '');

    if (!sanitizedQuery || !sanitizedLocation) {
      return new Response(
        JSON.stringify({ error: "Query and location cannot be empty after sanitization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company settings to retrieve SerpAPI key
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
      // Use real SerpAPI
      console.log("Using SerpAPI for search...");
      
      const searchQuery = `${sanitizedQuery} em ${sanitizedLocation}`;
      const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(searchQuery)}&api_key=${serpapiKey}&hl=pt-br&gl=br`;

      try {
        const serpResponse = await fetch(serpApiUrl);
        const serpData = await serpResponse.json();

        if (serpData.error) {
          console.error("SerpAPI error:", serpData.error);
          return new Response(
            JSON.stringify({ error: `SerpAPI error: ${serpData.error}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const localResults = serpData.local_results || [];
        
        leads = localResults.map((result: SerpAPIResult) => {
          const hasPhone = Boolean(result.phone);
          
          return {
            name: result.title,
            phone: result.phone || null,
            has_whatsapp: false, // Will be validated with WAHA if configured
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

        // Validate WhatsApp if WAHA is configured
        if (settings?.waha_api_url && settings?.waha_api_key && settings?.waha_session) {
          const wahaSession = settings.waha_session;
          
          console.log("WAHA Configuration found:");
          console.log("  - URL:", settings.waha_api_url);
          console.log("  - Session:", wahaSession);
          console.log("  - API Key present:", Boolean(settings.waha_api_key));
          console.log("Validating WhatsApp numbers for", leads.filter(l => l.phone).length, "leads with phone numbers...");
          
          let validatedCount = 0;
          let whatsappFoundCount = 0;
          let errorCount = 0;
          
          for (const lead of leads) {
            if (lead.phone) {
              try {
                // Clean phone number - keep only digits
                const cleanPhone = lead.phone.replace(/\D/g, "");
                // Add country code if not present
                const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                
                console.log(`Checking WhatsApp for: ${lead.phone} -> ${phoneWithCountry}`);
                
                // WAHA uses GET request with query parameters - use configured session
                const wahaUrl = `${settings.waha_api_url}/api/contacts/check-exists?phone=${phoneWithCountry}&session=${wahaSession}`;
                
                console.log("  WAHA Request URL:", wahaUrl);
                
                console.log("  WAHA Request URL:", wahaUrl);
                
                const wahaResponse = await fetch(wahaUrl, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": settings.waha_api_key,
                  },
                });

                console.log("  WAHA Response Status:", wahaResponse.status);
                
                if (wahaResponse.ok) {
                  const wahaData = await wahaResponse.json();
                  console.log("  WAHA Response Data:", JSON.stringify(wahaData));
                  
                  // WAHA returns { numberExists: true/false, chatId: "..." }
                  const exists = wahaData.numberExists === true;
                  
                  lead.has_whatsapp = exists;
                  validatedCount++;
                  if (exists) whatsappFoundCount++;
                  
                  console.log(`  Result: ${exists ? "HAS WhatsApp" : "NO WhatsApp"}`);
                } else {
                  const errorText = await wahaResponse.text();
                  console.error("  WAHA Error Response:", wahaResponse.status, errorText);
                  errorCount++;
                }
              } catch (wahaError) {
                console.error("WAHA validation error for", lead.phone, ":", wahaError);
                errorCount++;
                // Continue without WhatsApp validation
              }
            }
          }
          
          console.log("WAHA Validation Summary:");
          console.log(`  - Total validated: ${validatedCount}`);
          console.log(`  - WhatsApp found: ${whatsappFoundCount}`);
          console.log(`  - Errors: ${errorCount}`);
        } else {
          console.log("WAHA not configured - skipping WhatsApp validation");
          console.log("  - waha_api_url:", settings?.waha_api_url || "NOT SET");
          console.log("  - waha_api_key:", settings?.waha_api_key ? "SET" : "NOT SET");
          console.log("  - waha_session:", settings?.waha_session || "NOT SET");
        }
      } catch (serpError) {
        console.error("SerpAPI request error:", serpError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch from SerpAPI" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Use mock data when no API key is configured
      console.log("No SerpAPI key configured, using mock data...");
      
      const mockCount = Math.floor(10 + Math.random() * 20);
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

    // Update search history with results count
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
