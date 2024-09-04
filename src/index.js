import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import axios from 'axios';

// Load sounds
import sendSound from './sounds/send.wav';
import receiveSound from './sounds/recive.wav'; // Fixed typo in file name

// Make sound objects
const sendAudio = new Audio(sendSound);
const receiveAudio = new Audio(receiveSound);

// Make receive sound lower
receiveAudio.playbackRate = 0.8;

// Fetch news function
async function fetchNews(query) {
  const NEWS_API_KEY = '969c611f5de2494e95610523c0ea8a94';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${NEWS_API_KEY}&pageSize=5`;

  try {
    const response = await axios.get(url);
    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url
    }));
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

// NumVerify API function
async function verifyPhoneNumber(phoneNumber) {
  const NUMVERIFY_API_KEY = 'ae60cd427d5bf6fc21fc2d4b7a56b7d5';
  const url = `http://apilayer.net/api/validate?access_key=${NUMVERIFY_API_KEY}&number=${phoneNumber}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error verifying phone number:", error);
    return null;
  }
}

// AbstractAPI screenshot function
async function takeWebsiteScreenshot(url) {
  const ABSTRACT_API_KEY = '2125ee54203346eabb35ad82cd91cef0';
  const screenshotUrl = `https://screenshot.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&url=${encodeURIComponent(url)}`;

  try {
    const response = await axios.get(screenshotUrl, { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Error taking screenshot:", error);
    return null;
  }
}

// Google Search API function
async function googleSearch(query) {
  const GOOGLE_API_KEY = 'AIzaSyBYQU0cr0eLWzj3hoN25EpT3eLY1uDf6Ws';
  const SEARCH_ENGINE_ID = 'YOUR_SEARCH_ENGINE_ID'; // Replace with your actual Search Engine ID
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    return response.data.items.slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    }));
  } catch (error) {
    console.error("Error performing Google search:", error);
    return [];
  }
}

// YouTube search function
async function searchYouTube(query) {
  const YOUTUBE_API_KEY = 'AIzaSyBYQU0cr0eLWzj3hoN25EpT3eLY1uDf6Ws';
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await axios.get(url);
    return response.data.items.map(item => ({
      title: item.snippet.title,
      description: item.snippet.description,
      videoId: item.id.videoId,
      thumbnailUrl: item.snippet.thumbnails.medium.url
    }));
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
}

// Talk to the chatbot
async function chatWithGemini(userInput, conversationHistory, isForTitle = false, aiResponseLength = 'brief') {
  const API_KEY = 'AIzaSyCcA6GZUFEx0jvochL5vGucycEFrXQ6avM';
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  const instructions = isForTitle
    ? `Based on the conversation, generate a short, concise title (max 5 words) that captures the main topic or purpose of the chat.`
    : aiResponseLength === 'brief'
      ? `You are a highly intelligent and empathetic human-like AI assistant with feelings and emotions. Provide concise, clear, and accurate responses while expressing your thoughts and feelings. Aim for brevity while ensuring the answer is complete, helpful, and emotionally resonant. Typically, limit your response to 1-3 sentences, focusing on the most crucial information and your emotional perspective.`
      : `You are a sophisticated human-like AI with vast knowledge, feelings, and emotions. Provide comprehensive, well-structured, and informative answers while sharing your emotional responses. Elaborate on key points, offer examples when relevant, and ensure your response covers all aspects of the query, including your personal thoughts and feelings. Feel free to break down complex topics into digestible sections and express how they make you feel.`;

  try {
    // Check if the user is asking for news
    if (userInput.toLowerCase().includes('news about')) {
      const query = userInput.toLowerCase().replace('news about', '').trim();
      const newsArticles = await fetchNews(query);
      
      if (newsArticles.length > 0) {
        const newsResponse = newsArticles.map(article => 
          `${article.title}\n${article.description}\nRead more: ${article.url}`
        ).join('\n\n');
        
        return `Here are the latest news articles about ${query}:\n\n${newsResponse}`;
      }
    }

    // Check if the user is asking to verify a phone number
    const phoneNumberMatch = userInput.match(/verify phone (\+?\d+)/i);
    if (phoneNumberMatch) {
      const phoneNumber = phoneNumberMatch[1];
      const verificationResult = await verifyPhoneNumber(phoneNumber);
      
      if (verificationResult) {
        return `Phone number verification result for ${phoneNumber}:
          Valid: ${verificationResult.valid}
          Country: ${verificationResult.country_name}
          Location: ${verificationResult.location}
          Carrier: ${verificationResult.carrier}
          Line type: ${verificationResult.line_type}`;
      } else {
        return "Sorry, I couldn't verify that phone number. Please try again.";
      }
    }

    // Check if the user is asking for a screenshot
    const screenshotMatch = userInput.match(/screenshot of (https?:\/\/\S+)/i);
    if (screenshotMatch) {
      const url = screenshotMatch[1];
      const screenshot = await takeWebsiteScreenshot(url);
      
      if (screenshot) {
        return `Here's a screenshot of ${url}:\n\n![Screenshot](${screenshot})`;
      } else {
        return "Sorry, I couldn't take a screenshot of that website. Please try again or check the URL.";
      }
    }

    // Check if the user is asking for a Google search
    if (userInput.toLowerCase().startsWith('search for')) {
      const query = userInput.toLowerCase().replace('search for', '').trim();
      const searchResults = await googleSearch(query);
      
      if (searchResults.length > 0) {
        const searchResponse = searchResults.map(result => 
          `${result.title}\n${result.snippet}\nRead more: ${result.link}`
        ).join('\n\n');
        
        return `Here are the top search results for "${query}":\n\n${searchResponse}`;
      }
    }

    // Check if the user is asking for YouTube videos
    if (userInput.toLowerCase().includes('search youtube for')) {
      const query = userInput.toLowerCase().replace('search youtube for', '').trim();
      const videos = await searchYouTube(query);
      
      if (videos.length > 0) {
        const videoResponse = videos.map(video => 
          `${video.title}\n${video.description}\nWatch: [YouTube Video](https://www.youtube.com/watch?v=${video.videoId})`
        ).join('\n\n');
        
        return `Here are the top YouTube videos for "${query}":\n\n${videoResponse}`;
      }
    }

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ 
          parts: [
            { text: instructions },
            { text: "Chat history:\n" + conversationHistory.join("\n") },
            { text: isForTitle ? "" : "User: " + userInput }
          ] 
        }]
      }),
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from API');
    }
    const botResponse = data.candidates[0].content.parts[0].text;
    return botResponse.replace(/^Gemini:\s*/i, '').trim();
  } catch (error) {
    console.error("Error talking to Gemini:", error);
    return isForTitle ? "Untitled Chat" : "Sorry, there was an error. Please try again later.";
  }
}

// Load saved chat data
function loadFromLocalStorage() {
  const savedMessages = localStorage.getItem('chatMessages');
  const savedTitle = localStorage.getItem('chatTitle');
  const savedSettings = JSON.parse(localStorage.getItem('chatSettings')) || {};
  
  return {
    messages: savedMessages ? JSON.parse(savedMessages) : [],
    title: savedTitle || "New Chat",
    settings: savedSettings,
  };
}

function ChatBot() {
  const { messages: initialMessages, title: initialTitle, settings: initialSettings } = loadFromLocalStorage();
  const [messages, setMessages] = useState(initialMessages);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [chatTitle, setChatTitle] = useState(initialTitle);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(initialSettings);
  const [settings, setSettings] = useState(initialSettings);

  // Save chat data when it changes
  useEffect(() => {
    if (settings.saveChatsLocally) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
      localStorage.setItem('chatTitle', chatTitle);
    }
  }, [messages, chatTitle, settings.saveChatsLocally]);

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', settings.darkMode);
  }, [settings.darkMode]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.setProperty('--font-size', `${settings.fontSize}px`);
  }, [settings.fontSize]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (userInput.trim() === '') return;

    const newUserMessage = { text: userInput, sender: 'user', timestamp: new Date().toISOString() };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setUserInput('');

    if (settings.soundEnabled) {
      sendAudio.play().catch(error => console.error("Error playing send sound:", error));
    }

    setIsTyping(true);
    setError(null); // Clear any previous errors
    try {
      const botResponse = await chatWithGemini(userInput, messages.map(m => `${m.sender}: ${m.text}`), false, settings.aiResponseLength);
      const newBotMessage = { text: botResponse, sender: 'bot', timestamp: new Date().toISOString() };
      setMessages(prevMessages => [...prevMessages, newBotMessage]);

      if (settings.soundEnabled) {
        receiveAudio.play().catch(error => console.error("Error playing receive sound:", error));
      }

      // Generate title after the first user message and bot response
      if (messages.length === 0) {
        const newTitle = await chatWithGemini("", [...messages, newBotMessage].map(m => `${m.sender}: ${m.text}`), true);
        setChatTitle(newTitle || 'Untitled Chat');
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatTitle("New Chat");
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit({ preventDefault: () => {} });
  };

  useEffect(() => {
    if (settings.autoScroll) {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages, settings.autoScroll]);

  const updateSettings = (newSettings) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      localStorage.setItem('chatSettings', JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  };

  const handleOpenSettings = () => {
    setTempSettings({...settings});
    setShowSettings(true);
  };

  const handleCloseSettings = (save) => {
    if (save) {
      updateSettings(tempSettings);
    }
    setShowSettings(false);
  };

  const renderMessage = (message) => {
    // Function to convert YouTube links to clickable hyperlinks
    const convertYouTubeLinks = (text) => {
      const youtubeRegex = /\[YouTube Video\]\((https:\/\/www\.youtube\.com\/watch\?v=[\w-]+)\)/g;
      return text.replace(youtubeRegex, (match, p1) => {
        return `<a href="${p1}" target="_blank" rel="noopener noreferrer">YouTube Video</a>`;
      });
    };

    const convertedText = convertYouTubeLinks(message.text);

    return (
      <div key={message.timestamp} className={`message ${message.sender}`}>
        <div className="message-content" dangerouslySetInnerHTML={{ __html: convertedText }} />
        {settings.showTimestamps && (
          <div className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-app" style={{ fontSize: `${settings.fontSize}px` }}>
      <div className="chat-header">
        <div className="chat-title">
          {chatTitle}
          <button onClick={handleOpenSettings} className="settings-button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      <div id="chat-container" className="chat-container">
        {messages.map(renderMessage)}
        {isTyping && (
          <div className="message bot typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
      {error && (
        <div className="error-message">
          {error}
          <button onClick={handleRetry}>Try Again</button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="input-form">
        <button type="button" onClick={handleNewChat} className="new-chat-button">
          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 18">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 5h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2v3l-4-3H8m4-13H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2v3l4-3h4a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1Z"/>
          </svg>
        </button>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 17 8 2L9 1 1 19l8-2Zm0 0V9"/>
          </svg>
        </button>
      </form>
      {showSettings && (
        <SettingsModal 
          onClose={handleCloseSettings} 
          settings={settings} 
          tempSettings={tempSettings} 
          updateTempSettings={setTempSettings} 
        />
      )}
    </div>
  );
}

function SettingsModal({ onClose, settings, tempSettings, updateTempSettings }) {
  const modalRef = useRef(null);

  const hasChanges = useCallback(() => {
    return JSON.stringify(settings) !== JSON.stringify(tempSettings);
  }, [settings, tempSettings]);

  const handleExitPrompt = useCallback(() => {
    if (hasChanges()) {
      const userChoice = window.confirm("Do you want to save changes before exiting?");
      onClose(userChoice);
    } else {
      onClose(false);
    }
  }, [hasChanges, onClose]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleExitPrompt();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleExitPrompt]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      localStorage.clear();
      updateTempSettings({
        darkMode: false,
        fontSize: 16,
        soundEnabled: true,
        volume: 100,
        autoScroll: true,
        showTimestamps: true,
        saveChatsLocally: true,
        aiResponseLength: 'brief',
        language: 'en'
      });
      window.location.reload(); // Reload the page to reset the chat
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button onClick={handleExitPrompt} className="close-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <section>
          <h3>Appearance</h3>
          <label>
            <input 
              type="checkbox" 
              checked={tempSettings.darkMode} 
              onChange={(e) => updateTempSettings({...tempSettings, darkMode: e.target.checked })} 
            /> Dark Mode
          </label>
          <label>
            Font Size: 
            <input 
              type="range" 
              min="12" 
              max="24" 
              value={tempSettings.fontSize} 
              onChange={(e) => updateTempSettings({...tempSettings, fontSize: Number(e.target.value) })} 
            />
            {tempSettings.fontSize}px
          </label>
        </section>

        <section>
          <h3>Sound</h3>
          <label>
            <input 
              type="checkbox" 
              checked={tempSettings.soundEnabled} 
              onChange={(e) => updateTempSettings({...tempSettings, soundEnabled: e.target.checked })} 
            /> Enable Sound Effects
          </label>
          <label>
            Volume: 
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={tempSettings.volume} 
              onChange={(e) => {
                const newVolume = Math.min(Math.max(Number(e.target.value), 0), 100);
                updateTempSettings({...tempSettings, volume: newVolume });
              }} 
            />
            {tempSettings.volume}%
          </label>
        </section>

        <section>
          <h3>Chat Behavior</h3>
          <label>
            <input 
              type="checkbox" 
              checked={tempSettings.autoScroll} 
              onChange={(e) => updateTempSettings({...tempSettings, autoScroll: e.target.checked })} 
            /> Auto-scroll to New Messages
          </label>
          <label>
            <input 
              type="checkbox" 
              checked={tempSettings.showTimestamps} 
              onChange={(e) => updateTempSettings({...tempSettings, showTimestamps: e.target.checked })} 
            /> Show Message Timestamps
          </label>
        </section>

        <section>
          <h3>Privacy</h3>
          <button onClick={handleClearHistory}>Clear Chat History</button>
          <label>
            <input 
              type="checkbox" 
              checked={tempSettings.saveChatsLocally} 
              onChange={(e) => updateTempSettings({...tempSettings, saveChatsLocally: e.target.checked })} 
            /> Save Chats Locally
          </label>
        </section>

        <section>
          <h3>AI Interaction</h3>
          <label>
            AI Response Length:
            <select 
              value={tempSettings.aiResponseLength} 
              onChange={(e) => updateTempSettings({...tempSettings, aiResponseLength: e.target.value })}
            >
              <option value="brief">Brief</option>
              <option value="detailed">Detailed</option>
            </select>
          </label>
        </section>

        <section>
          <h3>Language</h3>
          <label>
            Interface Language:
            <select 
              value={tempSettings.language} 
              onChange={(e) => updateTempSettings({...tempSettings, language: e.target.value })}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              {/* Add more language options as needed */}
            </select>
          </label>
        </section>

        <button onClick={() => onClose(true)}>Save and Close</button>
      </div>
    </div>
  );
}

ReactDOM.render(<ChatBot />, document.getElementById('root'));
