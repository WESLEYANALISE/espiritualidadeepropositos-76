import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header provided');
      throw new Error('No authorization header provided');
    }
    
    const token = authHeader.replace('Bearer ', '');
    logStep('Auth header found');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      logStep('ERROR: Authentication failed', { error: userError.message });
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user?.email) {
      logStep('ERROR: User not authenticated or no email');
      throw new Error('User not authenticated');
    }
    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey || stripeKey.trim() === '') {
      logStep('ERROR: STRIPE_SECRET_KEY not found or empty');
      throw new Error('Stripe secret key not configured');
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    logStep('Stripe client initialized');

    logStep('Looking for Stripe customer', { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep('ERROR: No Stripe customer found');
      throw new Error('No Stripe customer found. Please create a subscription first.');
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });
    
    const origin = req.headers.get('origin') || 'https://your-app-domain.com';
    logStep('Creating portal session', { origin, returnUrl: `${origin}/assinaturas` });
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/assinaturas`,
    });

    logStep('Portal session created successfully', { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    logStep('ERROR in customer-portal', { 
      message: error.message, 
      type: error.constructor.name 
    });
    
    // Return user-friendly error messages
    let userMessage = 'Não foi possível abrir o portal de gerenciamento. Tente novamente.';
    if (error.message.includes('Stripe secret key')) {
      userMessage = 'Configuração de pagamento inválida. Entre em contato com o suporte.';
    } else if (error.message.includes('Authentication error')) {
      userMessage = 'Erro de autenticação. Faça login novamente.';
    } else if (error.message.includes('No Stripe customer found')) {
      userMessage = 'Você ainda não possui uma assinatura. Assine um plano primeiro.';
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});