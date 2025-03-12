# API Reference

## Base URL
`https://api.digitaldouble.com/v1`

## Authentication
```python
headers = {
  "Authorization": "Bearer {JWT_TOKEN}",
  "X-API-Key": "{CLIENT_KEY}"
}
```

## Core Endpoints

### 1. Agent Management
`POST /agents/register`
```json
{
  "agent_type": "ar_processor",
  "capabilities": ["object_recognition", "pathfinding"]
}
```

### 2. Task Execution
`POST /tasks/create`
```python
# Example AI task payload
{
  "task_type": "image_analysis",
  "priority": 5,
  "payload": {
    "image_data": "base64_encoded",
    "model_version": "deepseat-v3"
  }
}
```

### 3. Real-time Updates
**WebSocket Endpoint**  
`wss://api.digitaldouble.com/ws/updates`

```javascript
socket.onmessage = (event) => {
  const update = JSON.parse(event.data);
  if(update.type === 'TASK_UPDATE') {
    handleTaskProgress(update.payload);
  }
};
```

[View Full API Schema](/schemas/api-schema.yaml)