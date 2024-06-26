import type { APIRoute } from 'astro';
import { stringify } from 'querystring';


export const GET: APIRoute = async ( request ) => {
    const accessToken = request.cookies.get('accessToken')?.value;
    let playlists: { items: any[] } = { items: [] };
    
    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const params = stringify({
      limit: 50,
      offset: 0
    });

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/playlists?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
  
      let data = await response.json();
      playlists.items = playlists.items.concat(data.items);

      while(data.next != null){
        const response = await fetch(data.next, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            }
        });
        if (response.ok) {
            data = await response.json();
            playlists.items = playlists.items.concat(data.items);
        }else{
            throw new Error('Failed to fetch playlist songs');
        }
    }


    console.log(playlists)

      return new Response(JSON.stringify(playlists), { status: 200 });
    } catch (error) {
      // @ts-ignore
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};