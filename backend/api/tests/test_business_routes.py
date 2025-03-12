import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from v1_1_api.business_routes import router

client = TestClient(router)


class TestBusinessRoutes(unittest.IsolatedAsyncioTestCase):

    @patch(
        'v1_1_api.business_routes.TaskManager.create',
        new_callable=MagicMock
    )
    @patch(
        'v1_1_api.business_routes.WebSocketBroker.broadcast',
        new_callable=MagicMock
    )
    async def test_create_task(
        self,
        mock_broadcast: MagicMock,
        mock_create: MagicMock
    ):
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
