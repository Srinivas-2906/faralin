/**
 * One-time Stream Chat setup for Faralin live support.
 * Requires STREAM_API_KEY and STREAM_API_SECRET in repo-root .env
 *
 * Usage: pnpm --filter api setup:stream
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { StreamChat } from 'stream-chat';
import { STREAM_BOT_USER_ID, STREAM_CHANNEL_TYPE } from '../src/support/stream-chat.service';

config({ path: resolve(__dirname, '../../../.env') });

async function main() {
  const apiKey = process.env.STREAM_API_KEY?.trim();
  const apiSecret = process.env.STREAM_API_SECRET?.trim();

  if (!apiKey || !apiSecret) {
    console.error('Set STREAM_API_KEY and STREAM_API_SECRET in .env before running.');
    process.exit(1);
  }

  const client = StreamChat.getInstance(apiKey, apiSecret);

  const channelTypeConfig = {
    typing_events: true,
    read_events: true,
    connect_events: true,
    search: false,
    reactions: true,
    replies: false,
    mutes: true,
    quotes: false,
  };

  try {
    await client.createChannelType({ name: STREAM_CHANNEL_TYPE, ...channelTypeConfig });
    console.log(`Channel type "${STREAM_CHANNEL_TYPE}" created.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already exists') || message.includes('code 4')) {
      await client.updateChannelType(STREAM_CHANNEL_TYPE, channelTypeConfig);
      console.log(`Channel type "${STREAM_CHANNEL_TYPE}" updated.`);
    } else {
      throw err;
    }
  }

  await client.upsertUser({
    id: STREAM_BOT_USER_ID,
    name: 'Faralin Assistant',
    role: 'user',
  });
  console.log(`Bot user "${STREAM_BOT_USER_ID}" ready.`);

  console.log('\nNext steps:');
  console.log('1. In GetStream Dashboard → Chat → Webhooks, add:');
  console.log('   https://api.faralin.kaana.in/api/support/stream/webhook');
  console.log('2. Enable events: message.new (or subscribe to all)');
  console.log('3. Webhook signature uses STREAM_API_SECRET — no separate webhook secret in Stream');
  console.log('4. Redeploy API (gcloud builds submit --config gcp/cloudbuild.api.yaml)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
