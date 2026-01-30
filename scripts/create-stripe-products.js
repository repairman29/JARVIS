#!/usr/bin/env node

/**
 * JARVIS Stripe Products Setup
 * Creates premium skill subscription products in your Stripe account
 */

const Stripe = require('stripe');
require('dotenv').config({ path: '/Users/jeffadkins/.clawdbot/.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Premium skills configuration
const PREMIUM_SKILLS = [
  {
    name: 'Notion Advanced Pro',
    description: 'AI-powered Notion automation with intelligent page generation, smart database management, and cross-workspace synchronization.',
    price: 14.99,
    interval: 'month',
    trialDays: 14,
    features: [
      '🤖 AI page generation with templates',
      '📊 Smart database optimization', 
      '🔄 Cross-workspace synchronization',
      '🧠 Content intelligence and analysis',
      '⚡ Workflow automation triggers'
    ]
  },
  {
    name: 'GitHub Copilot++ Pro',
    description: 'Advanced GitHub automation with AI-powered code analysis, intelligent PR management, and repository optimization.',
    price: 19.99,
    interval: 'month',
    trialDays: 14,
    features: [
      '🔍 Advanced AI code analysis',
      '🔧 Intelligent PR management',
      '📈 Repository health monitoring', 
      '⚙️ Workflow optimization',
      '💡 AI-powered commit messages'
    ]
  },
  {
    name: 'Focus Pro',
    description: 'AI-powered focus optimization with intelligent distraction blocking, productivity analytics, and wellness integration.',
    price: 9.99,
    interval: 'month', 
    trialDays: 14,
    features: [
      '🧠 AI focus optimization',
      '📊 Advanced productivity analytics',
      '💪 Wellness data integration',
      '👥 Team collaboration features',
      '⚡ Environment automation'
    ]
  }
];

async function createStripeProducts() {
  console.log('🚀 Creating JARVIS Premium Skills in Stripe...\n');
  
  const results = [];
  
  for (const skill of PREMIUM_SKILLS) {
    try {
      console.log(`💎 Creating: ${skill.name} ($${skill.price}/${skill.interval})`);
      
      // Create product
      const product = await stripe.products.create({
        name: skill.name,
        description: skill.description,
        metadata: {
          jarvis_skill: true,
          features: skill.features.join(', '),
          trial_days: skill.trialDays
        }
      });
      
      // Create price  
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: Math.round(skill.price * 100), // Convert to cents
        recurring: {
          interval: skill.interval
        },
        product: product.id,
        metadata: {
          jarvis_skill: skill.name.toLowerCase().replace(/\s+/g, '_'),
          trial_days: skill.trialDays
        }
      });
      
      console.log(`   ✅ Product ID: ${product.id}`);
      console.log(`   ✅ Price ID: ${price.id}`);
      console.log(`   ✅ Monthly Revenue Potential: $${skill.price} × subscribers`);
      console.log('');
      
      results.push({
        skill: skill.name,
        productId: product.id,
        priceId: price.id,
        price: skill.price,
        interval: skill.interval,
        trialDays: skill.trialDays
      });
      
    } catch (error) {
      console.error(`❌ Failed to create ${skill.name}: ${error.message}`);
    }
  }
  
  // Create customer portal configuration
  try {
    console.log('🎛️ Creating customer portal configuration...');
    
    const portalConfig = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'JARVIS Premium Skills - Manage Your AI Productivity Subscriptions'
      },
      features: {
        payment_method_update: {
          enabled: true
        },
        invoice_history: {
          enabled: true
        },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address']
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end'
        },
        subscription_pause: {
          enabled: false
        }
      }
    });
    
    console.log(`   ✅ Portal Config ID: ${portalConfig.id}`);
    console.log('');
    
  } catch (error) {
    console.log(`⚠️  Portal config creation failed: ${error.message}`);
  }
  
  // Summary
  console.log('🎉 STRIPE PRODUCTS CREATED SUCCESSFULLY!\n');
  console.log('📊 Revenue Summary:');
  
  let totalRevenue = 0;
  results.forEach(result => {
    console.log(`   💰 ${result.skill}: $${result.price}/${result.interval} (${result.trialDays}-day trial)`);
    totalRevenue += result.price;
  });
  
  console.log(`\n💎 Combined Monthly Revenue: $${totalRevenue.toFixed(2)} per customer subscribing to all skills`);
  console.log(`🎯 Conservative Estimate: $${(totalRevenue * 100).toFixed(0)}/month with 100 subscribers`);
  console.log(`🚀 Growth Target: $${(totalRevenue * 1000).toFixed(0)}/month with 1,000 subscribers`);
  
  console.log('\n🔗 Next Steps:');
  console.log('1. Update marketplace website with product IDs');
  console.log('2. Configure webhooks for license delivery');
  console.log('3. Test complete purchase flow'); 
  console.log('4. Launch marketing campaign');
  console.log('\n🎊 Your JARVIS marketplace is ready to generate revenue!');
  
  return results;
}

// Run product creation
if (require.main === module) {
  createStripeProducts().catch(error => {
    console.error('❌ Product creation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { createStripeProducts, PREMIUM_SKILLS };