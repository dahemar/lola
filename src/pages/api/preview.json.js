// Simple preview API
const cache = new Map();

// Pre-warm with known URLs
cache.set('https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-29th-april-2024', {
  url: 'https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-29th-april-2024',
  title: 'THE NTS BREAKFAST SHOW W/ FLO — 29.04',
  description: '',
  image: '',
  fetched_at: new Date().toISOString()
});

cache.set('https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-30th-september-2024', {
  url: 'https://www.nts.live/shows/the-breakfast-show-flo/episodes/the-breakfast-show-flo-30th-september-2024',
  title: 'THE NTS BREAKFAST SHOW W/ FLO — 30.09',
  description: '',
  image: '',
  fetched_at: new Date().toISOString()
});

cache.set('https://www.nts.live/shows/andras/episodes/andras-10th-september-2025', {
  url: 'https://www.nts.live/shows/andras/episodes/andras-10th-september-2025',
  title: 'ANDRAS NTS — 10.09.25',
  description: '',
  image: '',
  fetched_at: new Date().toISOString()
});

export async function GET({ request }) {
  // Echo-test handler: returns received request.url and headers
  try{
    const headers = {};
    for(const [k,v] of request.headers) headers[k]=v;
    const body = { requestUrl: request.url, headers };
    return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
  }catch(e){
    return new Response(JSON.stringify({ error: 'echo_failed', message: String(e) }), { status: 500 });
  }
}