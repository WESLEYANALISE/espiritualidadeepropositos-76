import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');
    
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep('No customer found, updating unsubscribed state');
      await supabaseClient.from('subscribers').upsert({
        user_id: user.id,
        email: user.email,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    // Check all subscriptions (active, canceled, past_due, etc)
    const allSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10, // Get more to check recent cancelations
    });

    let hasActiveSub = false;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let wasCanceled = false;

    // Check for active subscriptions
    const activeSubscriptions = allSubscriptions.data.filter(sub => sub.status === 'active');
    
    if (activeSubscriptions.length > 0) {
      const subscription = activeSubscriptions[0];
      hasActiveSub = true;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      if (amount <= 699) {
        subscriptionTier = 'basic';
      } else {
        subscriptionTier = 'premium';
      }
      
      logStep('Active subscription found', { subscriptionId: subscription.id, subscriptionTier, endDate: subscriptionEnd });
    } else {
      // Check for recently canceled subscriptions
      const recentCanceled = allSubscriptions.data.filter(sub => 
        ['canceled', 'unpaid', 'past_due'].includes(sub.status) &&
        sub.canceled_at && 
        (Date.now() / 1000 - sub.canceled_at) < (30 * 24 * 60 * 60) // Within last 30 days
      );
      
      if (recentCanceled.length > 0) {
        wasCanceled = true;
        logStep('Recent cancelation detected', { 
          subscriptionId: recentCanceled[0].id, 
          status: recentCanceled[0].status,
          canceledAt: recentCanceled[0].canceled_at 
        });
      } else {
        logStep('No active subscription found');
      }
    }

    await supabaseClient.from('subscribers').upsert({
      user_id: user.id,
      email: user.email,
      stripe_customer_id: customerId,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep('Updated database with subscription info', { subscribed: hasActiveSub, subscriptionTier });
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      was_canceled: wasCanceled
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in check-subscription', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});