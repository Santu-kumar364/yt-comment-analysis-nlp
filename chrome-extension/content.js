// Inject Panel
const panel = document.createElement("div");
panel.id = "yt-analyzer";

panel.innerHTML = `
  <div style="cursor: move;" id="analyzer-header">
    <h3>🚀 Pro AI Analyzer</h3>
  </div>
  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
    <button id="analyzeBtn">🔍 Analyze Comments</button>
    <button id="exportBtn" style="background:#FF9800;">📥 Export CSV</button>
    <button id="clearBtn" style="background:#f44336;">🗑️ Clear</button>
  </div>
  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
    <select id="commentLimit" style="flex:2; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
      <option value="100">📊 100 comments (Fast)</option>
      <option value="500">📊 500 comments (Medium)</option>
      <option value="1000" selected>📊 1,000 comments (Slow) ⭐ RECOMMENDED</option>
      <option value="5000">📊 5,000 comments (Very Slow - 10+ min)</option>
      <option value="10000">📊 10,000 comments (Extreme - 20+ min)</option>
    </select>
    <button id="testBtn" style="background:#4CAF50; flex:1;">🔌 Test</button>
  </div>
  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
    <button id="statsBtn" style="background:#9C27B0; flex:1;">📊 Stats</button>
    <button id="wordCloudBtn" style="background:#00BCD4; flex:1;">☁️ Word Cloud</button>
    <button id="timelineBtn" style="background:#FF5722; flex:1;">📈 Timeline</button>
    <button id="autoRefreshBtn" style="background:#607D8B; flex:1;">🔄 Auto OFF</button>
  </div>
  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
    <button id="largeAnalyzeBtn" style="background:#9C27B0; flex:1;">🚀 Analyze LAKHS (Async)</button>
  </div>
  <div id="loading" style="display:none; color:#666; text-align:center; padding:10px;">
    <div>⏳ Analyzing comments...</div>
    <div id="progressStatus" style="font-size: 10px; margin-top: 5px;"></div>
  </div>
  <div id="progressContainer" style="display:none; margin: 10px 0;">
    <div style="background: #e0e0e0; border-radius: 5px; overflow: hidden;">
      <div id="progressFill" style="width: 0%; height: 20px; background: #4CAF50; transition: width 0.3s; line-height: 20px; color: white; text-align: center; font-size: 10px;">0%</div>
    </div>
    <div id="progressText" style="font-size: 10px; color: #666; margin-top: 5px; text-align: center;"></div>
  </div>
  <div id="jobStatus" style="display:none; background:#e3f2fd; padding:10px; border-radius:5px; margin:10px 0;">
    <div><strong>🔄 Background Job:</strong> <span id="jobId"></span></div>
    <div>Progress: <span id="jobProgress">0</span>%</div>
    <div id="jobMessage"></div>
    <button id="checkJobBtn" style="background:#2196F3; margin-top:5px;">Check Status</button>
  </div>
  <div id="connectionStatus" style="font-size:10px; color:#999; margin:5px 0;"></div>
  <div id="stats"></div>
  <canvas id="chart" width="300" height="200"></canvas>
  <div id="aiSummary" style="margin-top:10px;"></div>
  <div style="display: flex; gap: 10px; margin: 10px 0;">
    <input type="text" id="searchComments" placeholder="🔍 Filter comments by keyword..." style="flex:1; padding:5px; border:1px solid #ddd; border-radius:4px;">
    <select id="sentimentFilter" style="padding:5px; border:1px solid #ddd; border-radius:4px;">
      <option value="all">All Sentiments</option>
      <option value="POSITIVE">Positive Only</option>
      <option value="NEUTRAL">Neutral Only</option>
      <option value="NEGATIVE">Negative Only</option>
    </select>
  </div>
  <div id="results"></div>
`;

document.body.appendChild(panel);

// Make panel draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const header = document.getElementById("analyzer-header");
header.style.cursor = "move";

header.addEventListener("mousedown", dragStart);
document.addEventListener("mouseup", dragEnd);
document.addEventListener("mousemove", drag);

function dragStart(e) {
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;
  isDragging = true;
}

function dragEnd(e) {
  isDragging = false;
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
  }
}

// Auto-refresh functionality
let autoRefresh = false;
let refreshInterval;
let currentJobId = null;
let jobCheckInterval = null;

const autoRefreshBtn = document.getElementById("autoRefreshBtn");
autoRefreshBtn.onclick = () => {
  autoRefresh = !autoRefresh;
  autoRefreshBtn.textContent = autoRefresh ? "🔄 Auto ON" : "🔄 Auto OFF";
  autoRefreshBtn.style.background = autoRefresh ? "#4CAF50" : "#607D8B";
  
  if (autoRefresh) {
    refreshInterval = setInterval(() => {
      document.getElementById("analyzeBtn").click();
    }, 120000);
  } else {
    if (refreshInterval) clearInterval(refreshInterval);
  }
};

// Test backend connection - FIXED with longer timeout
async function testConnection() {
  const statusDiv = document.getElementById("connectionStatus");
  statusDiv.innerHTML = "🔄 Testing connection...";
  statusDiv.style.color = "#ff9800";
  
  try {
    // Increased timeout to 30 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      statusDiv.innerHTML = "✅ Backend connected! (Supports lakhs of comments)";
      statusDiv.style.color = "#4CAF50";
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      statusDiv.innerHTML = `⚠️ Backend slow but may be working (timeout)`;
      statusDiv.style.color = "#FF9800";
      // Don't return false - backend might still be working
      return true;
    }
    statusDiv.innerHTML = `❌ Backend not reachable: ${err.message}`;
    statusDiv.style.color = "#F44336";
    return false;
  }
}

// Draw chart
function drawChart(canvas, positive, neutral, negative) {
  const ctx = canvas.getContext('2d');
  const total = positive + neutral + negative;
  
  if (total === 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data', canvas.width/2, canvas.height/2);
    return;
  }
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const colors = { positive: '#4CAF50', neutral: '#FFC107', negative: '#F44336' };
  const values = [positive, neutral, negative];
  const labels = ['Positive', 'Neutral', 'Negative'];
  const colorList = [colors.positive, colors.neutral, colors.negative];
  
  let startAngle = -Math.PI / 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 20;
  
  for (let i = 0; i < values.length; i++) {
    if (values[i] === 0) continue;
    
    const angle = (values[i] / total) * Math.PI * 2;
    const endAngle = startAngle + angle;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.fillStyle = colorList[i];
    ctx.fill();
    
    const midAngle = startAngle + angle / 2;
    const labelX = centerX + Math.cos(midAngle) * (radius * 0.6);
    const labelY = centerY + Math.sin(midAngle) * (radius * 0.6);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const percentage = ((values[i] / total) * 100).toFixed(1);
    ctx.fillText(`${percentage}%`, labelX, labelY);
    startAngle = endAngle;
  }
  
  let legendY = canvas.height - 50;
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  
  for (let i = 0; i < labels.length; i++) {
    ctx.fillStyle = colorList[i];
    ctx.fillRect(canvas.width - 60, legendY + (i * 15), 10, 10);
    ctx.fillStyle = '#333';
    ctx.fillText(`${labels[i]}: ${values[i]}`, canvas.width - 48, legendY + (i * 15) + 8);
  }
}

// Export to CSV
function exportToCSV(results) {
  let csvContent = "Sentiment,Emotion,Sarcasm,Comment\n";
  
  results.forEach(item => {
    const row = [
      item.sentiment,
      item.emotion,
      item.sarcasm,
      `"${item.text.replace(/"/g, '""')}"`
    ];
    csvContent += row.join(",") + "\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute("download", `youtube_analysis_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Show word cloud
function showWordCloud(comments) {
  const allText = comments.map(c => c.text).join(' ');
  const words = allText.toLowerCase().split(/\s+/);
  
  const wordCount = {};
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'without', 'i', 'you', 'he', 'she', 'it', 'we', 'they'];
  
  words.forEach(word => {
    if (word.length > 2 && !stopWords.includes(word) && !word.match(/^\d+$/)) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const topWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 100000;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    text-align: center;
  `;
  
  modal.innerHTML = `
    <h3>☁️ Word Cloud</h3>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 20px 0;">
      ${topWords.map(([word, count]) => {
        const fontSize = Math.min(16 + count, 42);
        const hue = (word.length * 37) % 360;
        return `
          <span style="font-size: ${fontSize}px; color: hsl(${hue}, 70%, 50%); padding: 5px; cursor: pointer;" 
          onclick="document.getElementById('searchComments').value='${word}'; document.getElementById('searchComments').dispatchEvent(new Event('input')); this.closest('div').remove();">
            ${word}
          </span>
        `;
      }).join('')}
    </div>
    <button id="closeWordCloud" style="background: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">Close</button>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('closeWordCloud').onclick = () => modal.remove();
}

// Show timeline
function showTimeline(comments) {
  const timeline = {
    positive: comments.filter(c => c.sentiment === 'POSITIVE').length,
    neutral: comments.filter(c => c.sentiment === 'NEUTRAL').length,
    negative: comments.filter(c => c.sentiment === 'NEGATIVE').length
  };
  
  const total = timeline.positive + timeline.neutral + timeline.negative;
  const positivePercent = (timeline.positive / total * 100).toFixed(1);
  const neutralPercent = (timeline.neutral / total * 100).toFixed(1);
  const negativePercent = (timeline.negative / total * 100).toFixed(1);
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 100000;
    width: 350px;
  `;
  
  modal.innerHTML = `
    <h3>📊 Sentiment Distribution</h3>
    <div style="margin: 20px 0;">
      <div style="margin: 15px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #4CAF50;">✅ Positive</span>
          <span>${timeline.positive} (${positivePercent}%)</span>
        </div>
        <div style="background: #e0e0e0; border-radius: 5px; overflow: hidden; margin-top: 5px;">
          <div style="width: ${positivePercent}%; background: #4CAF50; height: 30px; line-height: 30px; color: white; text-align: center; font-size: 12px;">${positivePercent}%</div>
        </div>
      </div>
      <div style="margin: 15px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #FFC107;">⚪ Neutral</span>
          <span>${timeline.neutral} (${neutralPercent}%)</span>
        </div>
        <div style="background: #e0e0e0; border-radius: 5px; overflow: hidden; margin-top: 5px;">
          <div style="width: ${neutralPercent}%; background: #FFC107; height: 30px; line-height: 30px; color: white; text-align: center; font-size: 12px;">${neutralPercent}%</div>
        </div>
      </div>
      <div style="margin: 15px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #F44336;">❌ Negative</span>
          <span>${timeline.negative} (${negativePercent}%)</span>
        </div>
        <div style="background: #e0e0e0; border-radius: 5px; overflow: hidden; margin-top: 5px;">
          <div style="width: ${negativePercent}%; background: #F44336; height: 30px; line-height: 30px; color: white; text-align: center; font-size: 12px;">${negativePercent}%</div>
        </div>
      </div>
    </div>
    <button id="closeTimeline" style="background: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">Close</button>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('closeTimeline').onclick = () => modal.remove();
}

// Show stats modal
function showStatsModal(data) {
  const total = data.stats.positive + data.stats.neutral + data.stats.negative;
  const positivePercent = (data.stats.positive / total * 100).toFixed(1);
  const neutralPercent = (data.stats.neutral / total * 100).toFixed(1);
  const negativePercent = (data.stats.negative / total * 100).toFixed(1);
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 100000;
    width: 350px;
    text-align: center;
  `;
  
  modal.innerHTML = `
    <h3>📊 Detailed Statistics</h3>
    <div style="margin: 20px 0;">
      <div><span style="color:#4CAF50;">✅ Positive:</span> <strong>${data.stats.positive}</strong> (${positivePercent}%)</div>
      <div style="margin-top:10px;"><span style="color:#FFC107;">⚪ Neutral:</span> <strong>${data.stats.neutral}</strong> (${neutralPercent}%)</div>
      <div style="margin-top:10px;"><span style="color:#F44336;">❌ Negative:</span> <strong>${data.stats.negative}</strong> (${negativePercent}%)</div>
      <hr style="margin:15px 0;">
      <div><strong>Total Comments:</strong> ${data.total_comments}</div>
      <div style="margin-top:10px;"><strong>Sentiment Score:</strong> <span style="color:${data.sentiment_score > 0 ? '#4CAF50' : '#F44336'};">${data.sentiment_score > 0 ? '+' : ''}${data.sentiment_score}%</span></div>
      <div style="margin-top:10px;"><strong>Processing Time:</strong> ${data.processing_time} seconds</div>
    </div>
    <button id="closeModal" style="background: #2196F3; color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer;">Close</button>
  `;
  
  document.body.appendChild(modal);
  document.getElementById('closeModal').onclick = () => modal.remove();
}

// Check job status periodically
async function checkJobStatus(jobId) {
  try {
    const response = await fetch(`http://localhost:8000/job_status/${jobId}`);
    const data = await response.json();
    
    const jobProgressSpan = document.getElementById("jobProgress");
    const jobMessageSpan = document.getElementById("jobMessage");
    
    if (data.status === "completed") {
      if (jobCheckInterval) clearInterval(jobCheckInterval);
      document.getElementById("jobStatus").style.display = "none";
      document.getElementById("loading").style.display = "none";
      
      // Render results
      render({
        total_comments: data.results.total_comments,
        summary: data.results.summary,
        keywords: data.results.keywords,
        stats: data.results.stats,
        sentiment_score: data.results.sentiment_score,
        results: data.results.results || [],
        processing_time: "Background"
      });
      
      alert(`✅ Analysis complete! Processed ${data.results.total_comments} comments`);
    } else if (data.status === "failed") {
      if (jobCheckInterval) clearInterval(jobCheckInterval);
      document.getElementById("jobStatus").style.display = "none";
      document.getElementById("loading").style.display = "none";
      alert(`❌ Analysis failed: ${data.error}`);
    } else {
      const percent = Math.round((data.progress / data.total) * 100);
      jobProgressSpan.textContent = percent;
      jobMessageSpan.textContent = `Processing ${data.progress} / ${data.total} comments...`;
    }
  } catch (err) {
    console.error("Error checking job:", err);
  }
}

// Render function
function render(data) {
  const resultsDiv = document.getElementById("results");
  const statsDiv = document.getElementById("stats");
  const summaryDiv = document.getElementById("aiSummary");
  const loadingDiv = document.getElementById("loading");

  loadingDiv.style.display = "none";
  resultsDiv.innerHTML = "";

  const stats = data.stats || { positive: 0, neutral: 0, negative: 0 };
  const keywords = data.keywords || [];
  const sentimentScore = data.sentiment_score || 0;
  
  const scoreColor = sentimentScore > 10 ? '#4CAF50' : sentimentScore < -10 ? '#F44336' : '#FFC107';
  const sentimentIcon = sentimentScore > 10 ? '😊' : sentimentScore < -10 ? '😞' : '😐';
  
  let trendMessage = '';
  if (sentimentScore > 30) trendMessage = '🔥 Extremely Positive';
  else if (sentimentScore > 15) trendMessage = '👍 Very Positive';
  else if (sentimentScore > 5) trendMessage = '📈 Generally Positive';
  else if (sentimentScore > -5) trendMessage = '😐 Mixed/Neutral';
  else if (sentimentScore > -20) trendMessage = '📉 Generally Negative';
  else trendMessage = '💀 Very Negative';

  statsDiv.innerHTML = `
    <div style="background:#f0f0f0; padding:10px; border-radius:5px;">
      <strong>📊 Sentiment Statistics</strong><br><br>
      <div style="display: flex; justify-content: space-between;">
        <span style="color:#4CAF50;">✅ ${stats.positive}</span>
        <span style="color:#FFC107;">⚪ ${stats.neutral}</span>
        <span style="color:#F44336;">❌ ${stats.negative}</span>
      </div>
      <div style="background:#e0e0e0; border-radius:5px; overflow:hidden; margin:10px 0;">
        <div style="width:${(stats.positive/(stats.positive+stats.neutral+stats.negative)*100)||0}%; background:#4CAF50; height:20px; float:left;"></div>
        <div style="width:${(stats.neutral/(stats.positive+stats.neutral+stats.negative)*100)||0}%; background:#FFC107; height:20px; float:left;"></div>
        <div style="width:${(stats.negative/(stats.positive+stats.neutral+stats.negative)*100)||0}%; background:#F44336; height:20px; float:left;"></div>
      </div>
      <div style="clear:both;"></div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div><strong>Score:</strong> <span style="color:${scoreColor};">${sentimentIcon} ${sentimentScore > 0 ? '+' : ''}${sentimentScore}%</span></div>
        <div><strong>Time:</strong> ${data.processing_time || 'N/A'}s</div>
        <div><strong>Total:</strong> ${data.total_comments}</div>
      </div>
      <div style="margin-top:10px; padding:5px; background:${trendMessage.includes('Positive') ? '#4CAF5020' : '#FFC10720'}; border-radius:5px;">
        ${trendMessage}
      </div>
    </div>
  `;

  summaryDiv.innerHTML = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 12px; border-radius: 8px; color: white;">
      <strong>🧠 AI Summary</strong>
      <div style="font-size: 11px; margin-top: 8px; line-height: 1.4;">${data.summary || "No summary available"}</div>
      <hr style="border-color: rgba(255,255,255,0.2); margin: 10px 0;">
      <strong>🔥 Keywords</strong>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
        ${keywords.slice(0, 15).map(kw => `<span style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 15px; font-size: 10px;">${kw}</span>`).join('')}
      </div>
    </div>
  `;

  drawChart(document.getElementById("chart"), stats.positive, stats.neutral, stats.negative);

  if (data.results && data.results.length > 0) {
    window.currentResults = data.results;
    displayComments(data.results);
    
    document.getElementById("searchComments").oninput = () => filterComments();
    document.getElementById("sentimentFilter").onchange = () => filterComments();
  }
}

function filterComments() {
  const searchTerm = document.getElementById("searchComments").value.toLowerCase();
  const sentimentFilter = document.getElementById("sentimentFilter").value;
  
  const filtered = window.currentResults.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchTerm);
    const matchesSentiment = sentimentFilter === "all" || item.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });
  
  displayComments(filtered);
}

function displayComments(comments) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "<strong>📝 Comments Analysis:</strong><br><br>";
  
  if (comments.length === 0) {
    resultsDiv.innerHTML += "<p style='text-align: center; color: #999;'>No comments match</p>";
    return;
  }
  
  comments.slice(0, 200).forEach((item, index) => {
    const sentimentColor = item.sentiment === 'POSITIVE' ? '#4CAF50' : item.sentiment === 'NEGATIVE' ? '#F44336' : '#FFC107';
    const sentimentEmoji = item.sentiment === 'POSITIVE' ? '✅' : item.sentiment === 'NEGATIVE' ? '❌' : '⚪';
    
    const emotionEmoji = { 'joy': '😊', 'sadness': '😢', 'anger': '😠', 'fear': '😨', 'surprise': '😲', 'love': '❤️', 'neutral': '😐', 'amusement': '😂', 'excitement': '🎉' }[item.emotion] || '😊';
    
    const div = document.createElement("div");
    div.style.cssText = `border-bottom:1px solid #ddd; padding:8px; margin:5px 0; background:${index%2===0?'#fafafa':'#fff'}; border-radius:5px;`;
    div.innerHTML = `
      <div><span style="color:${sentimentColor}; font-weight:bold;">${sentimentEmoji} ${item.sentiment}</span> ${item.emotion ? `| ${emotionEmoji} ${item.emotion}` : ''} ${item.sarcasm === 'YES' ? '| 😏 Sarcasm' : ''}</div>
      <div style="font-size:11px; color:#666; margin-top:5px;">${escapeHtml(item.text)}</div>
    `;
    resultsDiv.appendChild(div);
  });
  
  if (comments.length > 200) {
    resultsDiv.innerHTML += `<p style="text-align:center; color:#999; margin-top:10px;">Showing first 200 of ${comments.length} comments</p>`;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Analyze button (regular) - FIXED with longer timeout
document.getElementById("analyzeBtn").onclick = async () => {
  const videoUrl = window.location.href;
  const limitSelect = document.getElementById("commentLimit");
  const limit = parseInt(limitSelect.value);
  
  console.log(`Selected comment limit: ${limit}`);
  
  const analyzeBtn = document.getElementById("analyzeBtn");
  const loadingDiv = document.getElementById("loading");
  const progressDiv = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const progressStatus = document.getElementById("progressStatus");
  
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "⏳ Processing...";
  loadingDiv.style.display = "block";
  progressDiv.style.display = "block";
  
  // Calculate estimated time (about 0.2 seconds per comment)
  const estimatedSeconds = Math.ceil(limit * 0.22);
  progressStatus.textContent = `Fetching and analyzing ${limit} comments... This may take ${Math.floor(estimatedSeconds / 60)} min ${estimatedSeconds % 60} sec`;
  
  let progress = 0;
  const interval = setInterval(() => {
    if (progress < 90) {
      progress += 1;
      progressFill.style.width = `${progress}%`;
      progressFill.textContent = `${progress}%`;
      progressText.textContent = `Processing... ${progress}%`;
    }
  }, 3000);
  
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      // Still try even if connection test times out
      console.log("Connection test timeout, but trying anyway...");
    }
    
    // Increased timeout to 30 minutes for large batches
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 minutes
    
    const apiUrl = `http://localhost:8000/analyze_youtube?url=${encodeURIComponent(videoUrl)}&limit=${limit}`;
    console.log(`Fetching: ${apiUrl}`);
    
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    clearInterval(interval);
    progressFill.style.width = "100%";
    progressFill.textContent = "100%";
    progressText.textContent = "Complete!";
    progressStatus.textContent = `Analysis complete! Processed ${data.total_comments} comments in ${data.processing_time} seconds`;
    
    setTimeout(() => { progressDiv.style.display = "none"; }, 2000);
    render(data);
    
  } catch (err) {
    clearInterval(interval);
    progressDiv.style.display = "none";
    if (err.name === 'AbortError') {
      document.getElementById("results").innerHTML = `<div style="color:red; padding:10px; background:#ffebee; border-radius:5px;"><strong>❌ Timeout Error:</strong><br>The analysis is taking too long. Try with fewer comments or use the "Analyze LAKHS" async button.</div>`;
    } else {
      document.getElementById("results").innerHTML = `<div style="color:red; padding:10px; background:#ffebee; border-radius:5px;"><strong>❌ Error:</strong><br>${err.message}</div>`;
    }
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "🔍 Analyze Comments";
    loadingDiv.style.display = "none";
  }
};

// LARGE SCALE ANALYSIS button (for lakhs of comments)
document.getElementById("largeAnalyzeBtn").onclick = async () => {
  const videoUrl = window.location.href;
  const maxComments = parseInt(prompt("Enter number of comments to analyze (max 100,000):", "10000"));
  
  if (!maxComments || maxComments < 100) {
    alert("Please enter a valid number (minimum 100)");
    return;
  }
  
  const analyzeBtn = document.getElementById("largeAnalyzeBtn");
  const loadingDiv = document.getElementById("loading");
  const jobStatusDiv = document.getElementById("jobStatus");
  
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "⏳ Starting...";
  loadingDiv.style.display = "block";
  
  try {
    const isConnected = await testConnection();
    
    const response = await fetch(`http://localhost:8000/analyze_large?url=${encodeURIComponent(videoUrl)}&max_comments=${maxComments}`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    currentJobId = data.job_id;
    
    document.getElementById("jobId").textContent = currentJobId;
    document.getElementById("jobProgress").textContent = "0";
    jobStatusDiv.style.display = "block";
    loadingDiv.style.display = "none";
    
    // Start checking job status
    if (jobCheckInterval) clearInterval(jobCheckInterval);
    jobCheckInterval = setInterval(() => checkJobStatus(currentJobId), 5000);
    
    alert(`✅ Analysis started! Job ID: ${currentJobId}\nThe analysis will run in the background. You can close this panel and check back later.`);
    
  } catch (err) {
    loadingDiv.style.display = "none";
    alert(`❌ Error: ${err.message}`);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "🚀 Analyze LAKHS (Async)";
  }
};

// Check job status button
document.getElementById("checkJobBtn").onclick = () => {
  if (currentJobId) {
    checkJobStatus(currentJobId);
  } else {
    alert("No active job");
  }
};

// Other button handlers
document.getElementById("exportBtn").onclick = () => { if (window.currentResults) exportToCSV(window.currentResults); else alert("No data"); };
document.getElementById("statsBtn").onclick = () => { if (window.currentResults && window.currentResults.length > 0) showStatsModal({ stats: { positive: window.currentResults.filter(r=>r.sentiment==='POSITIVE').length, neutral: window.currentResults.filter(r=>r.sentiment==='NEUTRAL').length, negative: window.currentResults.filter(r=>r.sentiment==='NEGATIVE').length }, total_comments: window.currentResults.length, sentiment_score: ((window.currentResults.filter(r=>r.sentiment==='POSITIVE').length - window.currentResults.filter(r=>r.sentiment==='NEGATIVE').length) / window.currentResults.length * 100).toFixed(1), processing_time: 'N/A' }); else alert("No data"); };
document.getElementById("wordCloudBtn").onclick = () => { if (window.currentResults) showWordCloud(window.currentResults); else alert("No data"); };
document.getElementById("timelineBtn").onclick = () => { if (window.currentResults) showTimeline(window.currentResults); else alert("No data"); };
document.getElementById("testBtn").onclick = testConnection;
document.getElementById("clearBtn").onclick = () => {
  document.getElementById("results").innerHTML = "";
  document.getElementById("stats").innerHTML = "";
  document.getElementById("aiSummary").innerHTML = "";
  document.getElementById("searchComments").value = "";
  document.getElementById("sentimentFilter").value = "all";
  document.getElementById("jobStatus").style.display = "none";
  window.currentResults = null;
  if (jobCheckInterval) clearInterval(jobCheckInterval);
  const canvas = document.getElementById("chart");
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (autoRefresh) { autoRefresh = false; autoRefreshBtn.textContent = "🔄 Auto OFF"; autoRefreshBtn.style.background = "#607D8B"; if (refreshInterval) clearInterval(refreshInterval); }
};

// Initial test with longer timeout
setTimeout(() => {
  testConnection();
}, 1000);

console.log("YouTube Comment Analyzer loaded - Supports lakhs of comments!");