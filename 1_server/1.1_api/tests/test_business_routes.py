import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from ..business_routes import router

client = TestClient(router)


 
class TestBusinessRoutes(unittest.IsolatedAsyncioTestCase):

    @patch('..business_routes.TaskManager.create', new_callable=MagicMock)
    @patch('..business_routes.WebSocketBroker.broadcast', new_callable=MagicMock)
    @patch(
        '..business_routes.WebSocketBroker.broadcast', 
        new_callable=MagicMock
    )
    async def test_create_task(self, mock_broadcast, mock_create):
        mock_create.return_value = {
            "id": "test-uuid",
            "description": "Test task",
            "priority": "LOW"
        }

        response = await client.post("/tasks", json={
            "description": "Test task",
            "priority": "LOW"
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], "test-uuid")
        mock_create.assert_awaited_once()
        mock_broadcast.assert_awaited_once_with(
            "TASK_CREATED", mock_create.return_value
        )


if __name__ == '__main__':
    unittest.main()

