import { useState, useRef, useEffect } from "react";
import { Box, Typography, Stack, IconButton, TextField, Paper, Fab, Chip, Button } from "@mui/material";
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import axios from "axios";
import { BASE_URL } from "../config/axiosConfig";
import { useNavigate } from "react-router-dom";

const quickPrompts = [
  "Wedding Dresses",
  "Party Wear",
  "Under ₹3000",
  "Trending",
  "Blue Silk Gown"
];

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hi 👋 I'm your AI Stylist. How can I help you today?", products: [] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

  const sendMessage = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/products/chat`, { message: text });
      setMessages(prev => [
        ...prev, 
        { sender: "ai", text: res.data.text, products: res.data.products || [] }
      ]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: "ai", text: "Sorry, I'm having trouble connecting right now.", products: [] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Fab 
          color="primary" 
          aria-label="chat" 
          onClick={() => setOpen(true)}
          sx={{ position: 'fixed', bottom: 24, right: 24, background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', zIndex: 9999 }}
        >
          <ChatBubbleIcon />
        </Fab>
      )}

      {/* Chat Window */}
      {open && (
        <Paper 
          elevation={6}
          sx={{
            position: 'fixed', bottom: 24, right: 24, width: 350, height: 500,
            display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
            zIndex: 9999
          }}
        >
          {/* Header */}
          <Box sx={{ bgcolor: '#FE6B8B', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">✨ AI Stylist</Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
            {messages.map((msg, idx) => (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                
                {/* Text Bubble */}
                <Box sx={{ 
                  maxWidth: '80%', p: 1.5, borderRadius: 2,
                  bgcolor: msg.sender === 'user' ? '#FE6B8B' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'black',
                  boxShadow: 1
                }}>
                  <Typography variant="body2">{msg.text}</Typography>
                </Box>

                {/* Product Recommendations */}
                {msg.products && msg.products.length > 0 && (
                  <Stack spacing={1} mt={1} width="100%">
                    {msg.products.map(p => (
                      <Paper key={p._id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img src={p.image} alt={p.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight="bold" noWrap sx={{ maxWidth: 180 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">₹{p.price}</Typography>
                        </Box>
                        <Button size="small" onClick={() => {
                          navigate(`/product/${p._id}`);
                          setOpen(false);
                        }}>View</Button>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
            {loading && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>AI is typing...</Typography>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Quick Prompts */}
          <Box sx={{ p: 1, overflowX: 'auto', whiteSpace: 'nowrap', borderTop: '1px solid #eee' }}>
            {quickPrompts.map(prompt => (
              <Chip 
                key={prompt} 
                label={prompt} 
                size="small" 
                onClick={() => sendMessage(prompt)}
                sx={{ mr: 1, cursor: 'pointer' }}
              />
            ))}
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', bgcolor: 'white', borderTop: '1px solid #eee' }}>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Type here..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && sendMessage()}
              sx={{ '& fieldset': { border: 'none' } }}
            />
            <IconButton color="primary" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default AIChatWidget;
