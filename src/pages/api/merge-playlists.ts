import type { APIRoute } from 'astro';
import { stringify } from 'querystring';

export const POST: APIRoute = async ( {request} ) => {

    try {
      console.log("Request Headers:", JSON.stringify([...request.headers])); // Log all request headers
      let { playlists, targetPlaylist, creatingNewPlaylist } = await request.json(); // Parse the JSON body
      
      const cookies = request.headers.get('cookie');
        let accessToken = '';
        if (cookies) {
            const cookieArray = cookies.split(';');
            for (const cookie of cookieArray) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'accessToken') {
                    accessToken = value;
                    break;
                }
            }
        }
      console.log("Received accessToken from cookie:", accessToken); // Log the accessToken
      console.log("TEST - " + creatingNewPlaylist)
     
      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
      }

      if (creatingNewPlaylist){
        const responseUserID = await fetch(`https://api.spotify.com/v1/me`, {
            headers: {
            'Authorization': `Bearer ${accessToken}`,
            }
        });

        if (responseUserID.ok) {
            const data = await responseUserID.json();
            const user_id = data.id;
            const body = {
                name: targetPlaylist,
                description: "Playlist created by Merge Spotify Playlists",
                public: true
            };
        
            const response = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json' // Ensure Content-Type is set
                },
                method: 'POST', // Ensure the method is set to POST
                body: JSON.stringify(body)
            });
        
            if (response.ok) {
                console.log("Successfully created a playlist");
                const data = await response.json();
                targetPlaylist = data.id; // gets the newly created playlist's ID
            } else {
                const errorText = await response.text(); // Get the error response text
                console.error('Failed to create new playlist:', errorText); // Log the error response
                throw new Error('Failed to create new playlist');
            }
        } else {
            const errorText = await responseUserID.text(); // Get the error response text
            console.error('Failed to fetch user ID:', errorText); // Log the error response
            throw new Error('Failed to fetch user ID');
        }
      }

      const params = stringify({
        fields: 'next, items(track(uri))',
        limit: 50,
        offset: 0
      });
    
      let songs = []
      let data;
      
      for (const playlist of playlists){
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist}/tracks?${params}`, {
            headers: {
            'Authorization': `Bearer ${accessToken}`,
            }
        });
    
        if (response.ok) {
            data = await response.json();
            for (const item of data.items) {
                if(!item.track.uri.includes("local")){
                    songs.push(item.track.uri); 
                }
            }
        }else{
            throw new Error('Failed to fetch playlist songs');
        }


        while(data.next != null){
            // @ts-ignore
            const response = await fetch(data.next, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            if (response.ok) {
                data = await response.json();
                for (const item of data.items) {
                    if(!item.track.uri.includes("local")){
                        songs.push(item.track.uri); 
                    }
                }
            }else{
                throw new Error('Failed to fetch playlist songs');
            }
        }

      }




      let counter = 0;
      let uris = [];

      for (const song of songs){
        console.log("song:" + song)
        uris.push(song);
        if(counter == 99){
            const body = {
                uris: uris
            };
            console.log("Adding songs to the playlist:", JSON.stringify(body)); // Log the body being sent
            const response = await fetch(`https://api.spotify.com/v1/playlists/${targetPlaylist}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                method: 'POST', // Ensure the method is set to POST
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorText = await response.text(); // Get the error response text
                console.error('Failed to add songs to the target playlist:' + targetPlaylist, errorText); // Log the error response
                throw new Error('Failed to add songs to the target playlist');
            } else {
                const errorText = await response.text();
                console.log("Successfully added songs to the playlist" + errorText);
            }
            counter = 0
            uris = []
        }
        counter++;
      }

      if (songs.length < 100) {
        const body = {
            uris: uris
        };
        console.log("Adding songs to the playlist:", JSON.stringify(body)); // Log the body being sent
        const response = await fetch(`https://api.spotify.com/v1/playlists/${targetPlaylist}/tracks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            method: 'POST', // Ensure the method is set to POST
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorText = await response.text(); // Get the error response text
            console.error('Failed to add songs to the target playlist:' + targetPlaylist, errorText); // Log the error response
            throw new Error('Failed to add songs to the target playlist');
        } else {
            const errorText = await response.text();
            console.log("Successfully added songs to the playlist" + errorText);
        }
    }

      
      return new Response(JSON.stringify({ message: "Done" }), { status: 200 });
    } catch (error) {
        // @ts-ignore
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};