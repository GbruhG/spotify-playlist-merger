import type { APIRoute } from 'astro';
import { jsx } from 'astro/jsx-runtime';
import { stringify } from 'querystring';

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
const mainSiteUrl = process.env.MAIN_SITE_URL;

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
  
    if (!code) {
      return new Response('Authorization code not found', { status: 400 });
    }
  
    const params = stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
      client_id: client_id,
      client_secret: client_secret
    });
  
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        return new Response(JSON.stringify(data), { status: response.status });
      }
  
      // Set an HTTP-only cookie with the access token
      const cookieValue = encodeURIComponent(data.access_token);
      const cookieHeader = `accessToken=${cookieValue}; Path=/; HttpOnly; Secure`; // Secure for HTTPS only
  
      // Redirect the user back to the main site with the cookie
      return new Response(null, {
        status: 302,
        headers: {
          'Location': mainSiteUrl,
          'Set-Cookie': cookieHeader
        }
      });
    } catch (error) {
      console.error('Error fetching token:', error);
      return new Response('Internal server error', { status: 500 });
    }
  };
