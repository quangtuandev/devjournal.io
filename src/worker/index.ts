/**
 * Cloudflare Worker for devjournal.io
 * Serves the static Astro site from the edge
 */

export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Security headers
    const securityHeaders: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    try {
      // Try to serve the static asset
      let response = await env.ASSETS.fetch(request);
      
      // If not found and doesn't have an extension, try appending /index.html
      // This handles Astro's trailing slash behavior
      if (response.status === 404 && !url.pathname.includes('.')) {
        const indexPath = url.pathname.endsWith('/') 
          ? `${url.pathname}index.html`
          : `${url.pathname}/index.html`;
        
        const indexUrl = new URL(indexPath, url.origin);
        response = await env.ASSETS.fetch(new Request(indexUrl, request));
      }
      
      // Clone response to add headers
      const newResponse = new Response(response.body, response);
      
      // Add security headers
      for (const [key, value] of Object.entries(securityHeaders)) {
        newResponse.headers.set(key, value);
      }
      
      // Add caching headers for static assets
      if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|webp)$/)) {
        newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
      
      return newResponse;
    } catch (error) {
      // Return a simple error page
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          ...securityHeaders
        }
      });
    }
  },
};

