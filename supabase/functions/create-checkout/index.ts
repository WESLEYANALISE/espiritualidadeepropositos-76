import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const { plan } = await req.json();
    logStep('Plan selected', { plan });
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header provided');
      throw new Error('No authorization header provided');
    }
    const token = authHeader.replace('Bearer ', '');
    logStep('Auth header found');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
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
    logStep('Checking Stripe key', { 
      keyExists: !!stripeKey, 
      keyLength: stripeKey?.length || 0,
      keyPrefix: stripeKey?.substring(0, 7) || 'none'
    });
    
    if (!stripeKey || stripeKey.trim() === '') {
      logStep('ERROR: STRIPE_SECRET_KEY not found or empty in environment');
      throw new Error('Stripe secret key not configured');
    }
    
    if (!stripeKey.startsWith('sk_')) {
      logStep('ERROR: Invalid Stripe key format', { keyPrefix: stripeKey.substring(0, 10) });
      throw new Error('Invalid Stripe secret key format');
    }
    logStep('Stripe key validated successfully');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    logStep('Stripe client initialized');

    // Check if customer exists
    logStep('Checking for existing Stripe customer', { email: user.email });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Existing customer found', { customerId });
    } else {
      logStep('No existing customer found, will create new one');
    }

    // Plan configuration using your Stripe Price IDs
    const plans = {
      basic: {
        price_id: 'price_1S1FNwIIaptXZgSJsu4YI4XZ', // R$ 5,99
        name: 'Plano Leitura Imediata',
      },
      premium: {
        price_id: 'price_1RGbRPIIaptXZgSJLTf0L24w', // R$ 9,99
        name: 'Plano Premium - Leitura + Download',
      },
    } as const;

    const selectedPlan = plans[plan as keyof typeof plans];
    if (!selectedPlan) {
      logStep('ERROR: Invalid plan selected', { plan, availablePlans: Object.keys(plans) });
      throw new Error(`Invalid plan selected: ${plan}. Available plans: ${Object.keys(plans).join(', ')}`);
    }
    logStep('Plan validated', { selectedPlan: selectedPlan.name, priceId: selectedPlan.price_id });

    // Verify the price exists in Stripe
    try {
      const price = await stripe.prices.retrieve(selectedPlan.price_id);
      logStep('Stripe price verified', { 
        priceId: price.id, 
        active: price.active, 
        amount: price.unit_amount,
        currency: price.currency 
      });
      
      if (!price.active) {
        logStep('ERROR: Price is not active in Stripe', { priceId: selectedPlan.price_id });
        throw new Error(`Selected price ${selectedPlan.price_id} is not active in Stripe`);
      }
    } catch (stripeError: any) {
      logStep('ERROR: Failed to verify price in Stripe', { 
        priceId: selectedPlan.price_id, 
        error: stripeError.message 
      });
      throw new Error(`Price verification failed: ${stripeError.message}`);
    }

    const origin = req.headers.get('origin') || 'https://juris-flash-flow.lovable.app';
    
    logStep('Creating checkout session', { priceId: selectedPlan.price_id, customerId });
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: selectedPlan.price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assinaturas?canceled=true`,
      allow_promotion_codes: true,
    });

    logStep('Session created successfully', { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    logStep('ERROR in create-checkout', { 
      message: error.message, 
      type: error.constructor.name,
      stack: error.stack?.split('\n').slice(0, 3) 
    });
    
    // Return user-friendly error messages
    let userMessage = 'Não foi possível processar a assinatura. Tente novamente.';
    if (error.message.includes('Stripe secret key')) {
      userMessage = 'Configuração de pagamento inválida. Entre em contato com o suporte.';
    } else if (error.message.includes('Authentication error')) {
      userMessage = 'Erro de autenticação. Faça login novamente.';
    } else if (error.message.includes('Invalid plan')) {
      userMessage = 'Plano selecionado inválido. Tente novamente.';
    } else if (error.message.includes('Price verification failed')) {
      userMessage = 'Plano temporariamente indisponível. Tente novamente em alguns minutos.';
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      details: error.message // For debugging purposes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});