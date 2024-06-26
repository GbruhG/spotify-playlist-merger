import type { APIRoute } from 'astro';
import { stringify } from 'querystring';
import { config } from 'dotenv';


const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const mainSiteUrl = process.env.MAIN_SITE_URL;

function generateRandomString(length: number): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export const GET: APIRoute = async () => {
  const state = generateRandomString(16);
  const scope = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public';

  const params = stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://accounts.spotify.com/authorize?${params}`
    }
  });
};