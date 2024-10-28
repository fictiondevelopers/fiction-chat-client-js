export const createConversation = async (toId, token) => {
  try {
    const response = await fetch(`${process.env.REACT_APP_CHAT_SERVER_URL}?method=create-convo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        method: 'create-convo',
        params: {
          toId
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create conversation');
    }

    return data.conversationId;
  } catch (err) {
    throw err;
  }
};



