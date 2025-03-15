from typing import Dict, Any, Optional
from datetime import datetime
import torch
from transformers import pipeline
import logging
from contextlib import contextmanager
import os
import asyncio

logger = logging.getLogger(__name__)

class AIOrchestrator:
    def __init__(self):
        self.nlp = None
        self.task_queue = []
        self.active_models = {}
        self.is_initialized = False
        self.batch_size = int(os.getenv("MAX_BATCH_SIZE", 10))
        self.retry_limit = int(os.getenv("RETRY_LIMIT", 3))
        self.batch_queue = []
        
    async def initialize(self):
        try:
            self.nlp = pipeline("text-generation", model="gpt2")
            self.is_initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize AI Orchestrator: {e}")
            raise

    @contextmanager
    def model_session(self, model_path: str):
        try:
            model = self.load_model(model_path)
            yield model
        finally:
            torch.cuda.empty_cache()

    async def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process business task using AI models with error handling"""
        if not self.is_initialized:
            await self.initialize()

        try:
            prompt = self._format_prompt(task_data)
            
            with torch.no_grad():
                generated = self.nlp(prompt, max_length=100, do_sample=True)

            return {
                "task_id": task_data["id"],
                "generated_text": generated[0]["generated_text"],
                "timestamp": datetime.now().isoformat(),
                "status": "processed"
            }

        except Exception as e:
            logger.error(f"Task processing error: {e}")
            return {
                "task_id": task_data.get("id"),
                "error": str(e),
                "status": "failed",
                "timestamp": datetime.now().isoformat()
            }

    async def add_to_batch(self, task_data: Dict[str, Any]) -> None:
        self.batch_queue.append(task_data)
        if len(self.batch_queue) >= self.batch_size:
            await self.process_batch()

    async def process_batch(self) -> None:
        if not self.batch_queue:
            return

        batch = self.batch_queue[:self.batch_size]
        self.batch_queue = self.batch_queue[self.batch_size:]

        for task in batch:
            for attempt in range(self.retry_limit):
                try:
                    result = await self.process_task(task)
                    if result["status"] == "processed":
                        break
                except Exception as e:
                    logger.error(f"Batch processing error: {e}")
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

    def load_model(self, model_path: str) -> Optional[torch.jit.ScriptModule]:
        """Safely load PyTorch model with memory management"""
        try:
            if model_path not in self.active_models:
                model = torch.jit.load(model_path)
                self.active_models[model_path] = model
            return self.active_models[model_path]
        except Exception as e:
            logger.error(f"Failed to load model {model_path}: {e}")
            return None

    def _format_prompt(self, task_data: Dict[str, Any]) -> str:
        return (
            f"Business context: {task_data['description']}\n"
            "Recommended action:"
        )

    def __del__(self):
        """Cleanup resources on deletion"""
        self.active_models.clear()
        torch.cuda.empty_cache()
