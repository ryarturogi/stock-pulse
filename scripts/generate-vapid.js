/**
 * Generate VAPID keys for push notifications
 * 
 * This script generates the VAPID (Voluntary Application Server Identification)
 * keys required for web push notifications in the PWA.
 */

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

/**
 * Generate VAPID keys and save them to environment files
 */
function generateVapidKeys() {
  console.log('🔑 Generating VAPID keys for push notifications...\n');

  try {
    // Generate VAPID keys
    const vapidKeys = webpush.generateVAPIDKeys();

    console.log('✅ VAPID keys generated successfully!\n');
    console.log('📋 Keys generated:');
    console.log('------------------');
    console.log(`Public Key:  ${vapidKeys.publicKey}`);
    console.log(`Private Key: ${vapidKeys.privateKey}\n`);

    // Read existing .env.example file
    const envExamplePath = path.join(process.cwd(), '.env.example');
    let envContent = '';

    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }

    // Add VAPID keys to .env.example if not already present
    if (!envContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
      envContent += `\n# Push Notification VAPID Keys\n# Public key (safe to expose to client)\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n# Private key (server-only - never expose!)\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;

      fs.writeFileSync(envExamplePath, envContent);
      console.log('📝 Updated .env.example with VAPID keys');
    }

    // Check if .env exists and update it
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let localEnvContent = fs.readFileSync(envPath, 'utf8');
      
      if (!localEnvContent.includes('NEXT_PUBLIC_VAPID_PUBLIC_KEY')) {
        localEnvContent += `\n# Push Notification VAPID Keys\n# Public key (safe to expose to client)\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}\n# Private key (server-only - never expose!)\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
        
        fs.writeFileSync(envPath, localEnvContent);
        console.log('📝 Updated .env with VAPID keys');
      }
    }

    console.log('\n📌 Important Notes:');
    console.log('------------------');
    console.log('1. Keep your private key secure and never expose it in client-side code');
    console.log('2. The public key should be used in your PWA for push subscriptions');
    console.log('3. The private key should only be used on your server for sending push notifications');
    console.log('4. Add these keys to your production environment variables\n');

    console.log('🎉 VAPID key generation complete!');

  } catch (error) {
    console.error('❌ Error generating VAPID keys:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };