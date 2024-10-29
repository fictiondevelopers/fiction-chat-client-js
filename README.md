# **Fiction Chat Client**

Fiction Chat Client is the frontend component for integrating real-time chat into your application. It pairs with `fiction-chat-server` for a complete chat solution with WebSocket support for interactive and responsive user experiences.

**Note**: This package is intended to be used with [fiction-chat-server](https://www.npmjs.com/package/fiction-chat-server), which provides the backend chat functionality for a complete setup.

## **Installation**

Install the package using npm:

bash  
Copy code  
`npm install fiction-chat-client`

## **Configuration**

To use Fiction Chat Client, import it into your application and configure the necessary properties. The component requires a valid token for authentication and URLs for the chat server and WebSocket.

### **Example Setup**

```
'use client';
import { FictionChatClient } from 'fiction-chat-client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [token, setToken] = useState('');

  useEffect(() => {
    console.log(token);
  }, [token]);

  return (
    <main>  
      <h1 className='text-3xl font-bold text-red-500'>Welcome to My Next.js App</h1>  
      <p>This is a simple React page built with Next.js</p>  
      <input  
        className='border-2'  
        type="text"  
        value={token}  
        onChange={(e) => setToken(e.target.value)}
      />
      <div className='flex flex-row w-full border-2 h-screen'>
        <FictionChatClient   
          authToken={token}   
          contentContainerClassName=' '   
          chatServerUrl={process.env.NEXT_PUBLIC_CHAT_SERVER_URL}   
          chatWsUrl={process.env.NEXT_PUBLIC_CHAT_WS_URL}
        />
      </div>
    </main>
  );
}
```

**Note**: Replace the placeholder token input with a real session token for production use.

### **Additional Hook: `createConversation`**

To initiate a conversation before rendering the main component, use the `createConversation` hook by passing the recipient’s user ID:

javascript  
```
import { createConversation } from 'fiction-chat-client';

// Example usage:  
const conversationId = createConversation(toId); // toId: recipient's user ID
```

### **Environment Variables**

Set the following environment variables in your frontend project to connect to the backend chat server and WebSocket:

* **`NEXT_PUBLIC_CHAT_SERVER_URL`**: The URL path for the chat route on your server, configured in the backend setup. For example, if your backend route is defined at `/api/chat`, the value would be `https://yourserver.com/api/chat`.  
* **`NEXT_PUBLIC_CHAT_WS_URL`**: The WebSocket URL to establish real-time chat, matching the `websocketPort` defined in your backend configuration. For example, if `WEBSOCKET_PORT` is set to `8080`, this would be `wss://yourserver.com:8080`.

Ensure these variables match the route and WebSocket port in the backend implementation for seamless integration.

## **Example Implementation**

For a complete frontend implementation with Fiction Chat Client in a Next.js application, refer to the `page.js` file [here](https://github.com/fictiondevelopers/fiction-chat-example/app/det/page.js) in the [fiction-chat-example repository](https://github.com/fictiondevelopers/fiction-chat-example).

## **Support**

For any questions or issues, contact us:

* Phone: \+92 300 955 0284  
* Email: info@fictiondevelopers.com

