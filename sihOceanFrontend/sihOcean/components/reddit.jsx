import { useState, useEffect, useContext } from "react";
import { valueContext } from "../counter/counter";
import { t } from "../src/utils/i18n";

const Reddit = () => {
  const { currentLang } = useContext(valueContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false); // Start with loading false for instant UI
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true); // Track if this is the first load

  // Ocean hazard keywords
  const oceanKeywords = [
    'tsunami', 'hurricane', 'typhoon', 'cyclone', 'storm surge',
    'sea level', 'flooding', 'coastal', 'ocean', 'marine',
    'coral bleaching', 'acidification', 'warming', 'climate',
    'weather', 'disaster', 'hazard', 'wave', 'tide', 'monsoon'
  ];

  // India coastal keywords
  const indiaCoastalKeywords = [
    // Major coastal cities
    'mumbai', 'chennai', 'kolkata', 'kochi', 'visakhapatnam', 'goa',
    'mangalore', 'puducherry', 'thiruvananthapuram', 'bhubaneswar',
    'surat', 'vijaywada', 'rajahmundry', 'kakinada', 'machilipatnam',
    
    // Coastal regions
    'gujarat coast', 'kerala coast', 'tamil nadu coast', 'andhra pradesh coast',
    'odisha coast', 'west bengal coast', 'karnataka coast', 'maharashtra coast',
    'konkan coast', 'malabar coast', 'coromandel coast', 'sundarbans',
    'rann of kutch', 'chilika lake', 'pulicat lake', 'vembanad lake',
    
    // Marine areas around India
    'arabian sea', 'bay of bengal', 'indian ocean',
    'laccadive sea', 'palk strait', 'gulf of mannar',
    
    // Weather systems affecting India
    'cyclone fani', 'cyclone amphan', 'cyclone nisarga', 'cyclone tauktae',
    'southwest monsoon', 'northeast monsoon', 'pre monsoon',
    
    // General India references
    'india', 'indian', 'bengal', 'arabian', 'subcontinent'
  ];

  const subreddits = [
    'india', 'indianews', 'mumbai', 'chennai', 'kolkata', 
    'kerala', 'goa', 'bangalore', 'hyderabad', 'pune',
    'india_environment', 'climatechange', 'weather', 
    'worldnews', 'news', 'science'
  ];

  const getAccessToken = async () => {
    try {
      const CLIENT_ID = "ywpl4QTe1gt2q2r6JRfHPw";
      const CLIENT_SECRET = "3f8_7i8ey_sCYyAEfgwk2b4dgzS37w";
      const USER_AGENT = "india_ocean_hazard_monitor/1.0";

      const authString = `${CLIENT_ID}:${CLIENT_SECRET}`;
      const authBytes = new TextEncoder().encode(authString);
      const authB64 = btoa(String.fromCharCode(...authBytes));

      const tokenData = new URLSearchParams({
        'grant_type': 'client_credentials'
      });

      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authB64}`,
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: tokenData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (err) {
      console.error("Failed to get access token:", err);
      throw err;
    }
  };

  const fetchSubredditPosts = async (accessToken, subreddit) => {
    try {
      const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/new?limit=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'india_ocean_hazard_monitor/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          console.log(`r/${subreddit} is private/restricted`);
        } else if (response.status === 404) {
          console.log(`r/${subreddit} not found`);
        } else {
          console.log(`Error accessing r/${subreddit}: ${response.status}`);
        }
        return [];
      }

      const data = await response.json();
      return data.data.children;
    } catch (err) {
      console.error(`Error fetching r/${subreddit}:`, err);
      return [];
    }
  };

  const filterPosts = (posts, subreddit) => {
    const currentTime = Date.now() / 1000;
    const oneHourAgo = currentTime - 3600; // 1 hour = 3600 seconds
    
    return posts.filter(post => {
      const postData = post.data;
      const title = postData.title.toLowerCase();
      const selftext = (postData.selftext || '').toLowerCase();
      const combinedText = title + ' ' + selftext;
      
      // Check if post is from last 1 hour
      if (postData.created_utc <= oneHourAgo) {
        return false;
      }
      
      // Check for ocean hazard keywords
      const hasOceanKeywords = oceanKeywords.some(keyword => combinedText.includes(keyword));
      if (!hasOceanKeywords) {
        return false;
      }
      
      // Check for India coastal keywords
      const hasIndiaKeywords = indiaCoastalKeywords.some(keyword => combinedText.includes(keyword));
      if (!hasIndiaKeywords) {
        return false;
      }
      
      return true;
    }).map(post => ({
      id: post.data.id,
      subreddit: subreddit,
      title: post.data.title,
      score: post.data.score,
      comments: post.data.num_comments,
      url: `https://reddit.com${post.data.permalink}`,
      created: post.data.created_utc,
      author: post.data.author,
      selftext: post.data.selftext ? post.data.selftext.substring(0, 200) + '...' : ''
    }));
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60);
    
    if (minutes < 1) {
      return "Just now";
    } else if (minutes === 1) {
      return "1 minute ago";
    } else {
      return `${minutes} minutes ago`;
    }
  };

  const fetchRedditData = async () => {
    setLoading(true);
    setError("");
    
    try {
      const accessToken = await getAccessToken();
      const allPosts = [];
      
      // Process subreddits in smaller batches to avoid blocking
      const batchSize = 3;
      for (let i = 0; i < subreddits.length; i += batchSize) {
        const batch = subreddits.slice(i, i + batchSize);
        const batchPromises = batch.map(subreddit => 
          fetchSubredditPosts(accessToken, subreddit)
            .then(posts => filterPosts(posts, subreddit))
        );
        
        const batchResults = await Promise.all(batchPromises);
        allPosts.push(...batchResults.flat());
        
        // Small delay between batches to keep UI responsive
        if (i + batchSize < subreddits.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Sort posts by score (popularity)
      allPosts.sort((a, b) => b.score - a.score);
      
      setPosts(allPosts);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Failed to fetch Reddit data. Please try again later.");
      console.error("Error fetching Reddit data:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    // Load data in background without blocking UI
    const loadData = async () => {
      await fetchRedditData();
    };
    loadData();
  }, []);

  return (
    <div style={{ 
      padding: "20px", 
      width: "100%",
      minHeight: "calc(100vh - 300px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center" }}>
        <button
          onClick={fetchRedditData}
          disabled={loading}
          style={{
            padding: "10px 20px",
            backgroundColor: loading ? "#ccc" : "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "600",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "🔄 Refreshing..." : "🔄 Refresh Data"}
        </button>
      </div>

      {error && (
        <div style={{
          background: "#ffebee",
          color: "#c62828",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "1px solid #ffcdd2",
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto 20px auto"
        }}>
          ❌ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🔄</div>
          <p>Scanning Reddit for ocean hazard posts...</p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div>
          <h2 style={{ 
            color: "#007BFF", 
            marginBottom: "20px",
            textAlign: "center",
            fontSize: "1.5rem"
          }}>
            🚨 OCEAN HAZARD ALERTS FOR INDIA'S COASTLINE
          </h2>
          <p style={{ 
            textAlign: "center", 
            marginBottom: "30px", 
            color: "#666",
            fontSize: "1.1rem"
          }}>
            Found {posts.length} relevant posts from the last hour
          </p>

          <div style={{ display: "grid", gap: "20px" }}>
            {posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  background: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <h3 style={{ 
                    margin: "0", 
                    fontSize: "1.2rem", 
                    color: "#333",
                    flex: 1,
                    marginRight: "15px"
                  }}>
                    {index + 1}. [{post.subreddit.toUpperCase()}] {post.title}
                  </h3>
                  <div style={{ 
                    background: "#007BFF", 
                    color: "white", 
                    padding: "4px 8px", 
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    fontWeight: "600"
                  }}>
                    r/{post.subreddit}
                  </div>
                </div>

                <div style={{ 
                  display: "flex", 
                  gap: "15px", 
                  marginBottom: "10px",
                  fontSize: "0.9rem",
                  color: "#666"
                }}>
                  <span>⏰ {formatTimeAgo(post.created)}</span>
                  <span>👍 {post.score} upvotes</span>
                  <span>💬 {post.comments} comments</span>
                  <span>👤 u/{post.author}</span>
                </div>

                {post.selftext && (
                  <div style={{ 
                    marginBottom: "15px", 
                    padding: "10px", 
                    background: "#f8f9fa", 
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    color: "#555"
                  }}>
                    📝 {post.selftext}
                  </div>
                )}

                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #007BFF 0%, #0056b3 100%)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 4px 12px rgba(0,123,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  🔗 View on Reddit
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && posts.length === 0 && !error && !initialLoad && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          background: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>ℹ️</div>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>NO OCEAN HAZARD POSTS FOUND</h3>
          <p style={{ color: "#666", marginBottom: "10px" }}>
            No posts from the last 1 hour matching all criteria:
          </p>
          <ul style={{ color: "#666", textAlign: "left", display: "inline-block" }}>
            <li>Ocean hazard keywords (tsunami, cyclone, storm surge, etc.)</li>
            <li>India coastal keywords (Mumbai, Chennai, Arabian Sea, etc.)</li>
            <li>Posted within the last 60 minutes</li>
          </ul>
          <p style={{ color: "#666", marginTop: "15px", fontStyle: "italic" }}>
            💡 This is normal - specific ocean hazard news for India doesn't appear every hour. 
            Try refreshing the data again later.
          </p>
        </div>
      )}

      {initialLoad && !loading && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px",
          background: "#f8f9fa",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          maxWidth: "600px",
          width: "100%",
          margin: "0 auto"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🌊</div>
          <h3 style={{ color: "#333", marginBottom: "15px" }}>Reddit Ocean Hazard Monitor</h3>
          <p style={{ color: "#666", marginBottom: "10px" }}>
            Click "Refresh Data" to start monitoring Reddit for ocean hazard posts related to India's coastline.
          </p>
          <p style={{ color: "#666", fontStyle: "italic" }}>
            💡 This will scan multiple subreddits for posts from the last hour.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reddit;
