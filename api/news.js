// api/news.js

// Use the built-in fetch for Node.js 18+ (standard on Vercel)
// No need for external 'node-fetch' package usually

export default async function handler(request, response) {
  const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
  const query = searchParams.get('q') || 'latest';
  const page = searchParams.get('page') || '1';
  const sortBy = searchParams.get('sortBy') || 'publishedAt';
  const pageSize = searchParams.get('pageSize') || '6';

  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured.' });
  }

  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query
  )}&apiKey=${apiKey}&pageSize=${pageSize}&page=${page}&sortBy=${sortBy}`;

  try {
    const newsResponse = await fetch(newsApiUrl);
    const newsData = await newsResponse.json();

    if (!newsResponse.ok) {
      throw new Error(newsData.message || `News API request failed with status ${newsResponse.status}`);
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    return response.status(200).json(newsData);

  } catch (error) {
    console.error('Error fetching news in serverless function:', error);
    return response.status(500).json({ error: error.message || 'Failed to fetch news.' });
  }
} 