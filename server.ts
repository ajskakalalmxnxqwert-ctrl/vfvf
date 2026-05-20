import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Custom Snapchat fetcher based on __NEXT_DATA__
async function fetchSnapchatProfile(usernameOrUrl: string) {
  let username = usernameOrUrl.trim();
  
  // Extract username if URL is provided
  if (username.includes('snapchat.com/add/')) {
    username = username.split('snapchat.com/add/')[1].split('/')[0].split('?')[0];
  } else if (username.includes('snapchat.com/t/')) {
    // If it's a share link, it might be harder without resolving the redirect
    // Let's try to resolve the redirect
    try {
       const initialRes = await fetch(username, { redirect: 'follow' });
       // The resulting URL usually becomes https://www.snapchat.com/add/USERNAME/...
       const finalUrl = initialRes.url;
       if (finalUrl.includes('/add/')) {
           username = finalUrl.split('/add/')[1].split('/')[0].split('?')[0];
       } else if (finalUrl.includes('/p/')) {
           // Spotlight or specific story. We can just use the finalUrl as is to scrape
           username = finalUrl;
       }
    } catch(e) {
       // fallback
    }
  }

  // If it's still a full URL (like a /p/ or spotlight), we parse that.
  // Otherwise, we construct the profile URL
  let targetUrl = username.startsWith('http') ? username : `https://story.snapchat.com/@${username}`;
  targetUrl = targetUrl.replace('www.snapchat.com', 'story.snapchat.com'); // enforce story domain for better SSR data

  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!res.ok) {
     throw new Error("Profile or story not found. Please check the username or URL.");
  }

  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  
  if (!match) {
     throw new Error("Could not extract story data from Snapchat. The profile may be private or invalid.");
  }

  const data = JSON.parse(match[1]);
  const pageProps = data?.props?.pageProps;
  
  let snapList = null;
  let userProfile = null;
  
  // They have different structures based on URL type
  if (pageProps?.userProfile) {
      userProfile = pageProps.userProfile;
      snapList = userProfile?.publicStory?.snapList || [];
  } else if (pageProps?.curatedHighlights) {
      userProfile = pageProps.curatedHighlights.storyInfo;
      snapList = pageProps.curatedHighlights.story?.snapList || [];
  } else if (pageProps?.story) {
      userProfile = pageProps.story?.storyInfo || null;
      snapList = pageProps.story.snapList || [];
  }

  // Fallback recursive search if snapList is not correctly located or is empty
  if (!snapList || snapList.length === 0) {
      let found: any = null;
      function findSnaps(obj: any) {
         if (!obj || found) return;
         if (obj.snapList && Array.isArray(obj.snapList) && obj.snapList.length > 0) {
             found = obj.snapList;
             return;
         }
         if (typeof obj === 'object') {
             for (const key in obj) {
                 findSnaps(obj[key]);
             }
         }
      }
      findSnaps(pageProps);
      if (found) snapList = found;
  }

  if ((!snapList || snapList.length === 0) && !userProfile) {
      throw new Error("No public stories available for this user currently.");
  }

  // Parse snapList to clean format
  const stories = (snapList || []).map((snap: any) => {
      const mediaUrl = snap?.snapUrls?.mediaUrl || null;
      // Also look for MP4s if available elsewhere, but mediaUrl is primary handler
      const previewUrl = snap?.snapUrls?.mediaPreviewUrl?.value || null;
      
      return {
         id: snap?.snapId?.value || Math.random().toString(),
         mediaUrl: mediaUrl,
         previewUrl: previewUrl,
         timestamp: snap?.timestampInSec?.value || null,
         mediaType: snap?.snapMediaType === 1 ? 'video' : 'image',
         isM3U8: mediaUrl?.includes('.m3u8')
      };
  }).filter((s: any) => s.mediaUrl);

  return {
      username: userProfile?.userInfo?.username || (username.startsWith('http') ? 'Snapchat User' : username),
      displayName: userProfile?.userInfo?.displayName || 'Snapchat Profile',
      bitmoji: userProfile?.userInfo?.snapchatterPublicInfo?.bitmoji3d?.avatarImage?.url || userProfile?.userInfo?.bitmoji3d?.avatarImage?.url || null,
      stories
  };
}

// ---------------- SERVER ----------------

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Route: Search
  app.post("/api/snapchat/search", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Username or URL is required." });
      }

      const profile = await fetchSnapchatProfile(url);
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "An error occurred while fetching the story." });
    }
  });

  // API Route: Download proxy
  app.get("/api/snapchat/download", async (req, res) => {
     try {
         const { url, id, type } = req.query;
         if (!url || typeof url !== 'string') {
             return res.status(400).send("Missing URL");
         }

         // Since ffmpeg isn't strictly available in serverless/Hostinger seamlessly,
         // AND standard node fetch handles proxying files, we proxy the response!
         // If it's an m3u8 stream, we inform the UI to warn the user, or proxy the m3u8 file
         // Since m3u8 is just text, it's best we pass it or try to find a variant 
         // For a raw video stream, we stream it:
         
         const ext = type === 'image' ? 'jpg' : (url.includes('.m3u8') ? 'm3u8' : 'mp4');
         const filename = `snapchat_story_${id || Date.now()}.${ext}`;

         const r = await fetch(url);
         if (!r.ok || !r.body) {
             throw new Error("Failed to fetch media from Snapchat.");
         }

         res.setHeader('Content-Type', type === 'image' ? 'image/jpeg' : (url.includes('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4'));
         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

         // Node 18+ Web Streams to Express Response
         const reader = r.body.getReader();
         async function pump() {
            while (true) {
               const { done, value } = await reader.read();
               if (done) break;
               res.write(value);
            }
            res.end();
         }
         pump();

     } catch (err: any) {
         console.error("Download Error:", err);
         res.status(500).send("Error downloading file: " + err.message);
     }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
