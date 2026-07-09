from fastapi import WebSocket, WebSocketDisconnect
from app.websocket.connection_manager import ConnectionManager
from app.services.telemetry_service import TelemetryService
from datetime import datetime
import json
import asyncio


class WebSocketHandler:
    """Handle WebSocket connections and real-time updates"""
    
    def __init__(self):
        self.manager = ConnectionManager()
        self.telemetry_service = TelemetryService()
        self.is_running = False
    
    async def handle_connection(self, websocket: WebSocket, client_id: str):
        """Handle a WebSocket connection"""
        await self.manager.connect(websocket, client_id)
        
        try:
            # Start sending updates
            self.is_running = True
            while self.is_running:
                # Get latest readings
                readings = self.telemetry_service.get_latest_readings()
                
                for reading in readings:
                    # Send telemetry update
                    await self.manager.send_telemetry_update({
                        "timestamp": reading.timestamp.isoformat(),
                        "dma_id": reading.dma_id,
                        "dma_name": reading.dma_name,
                        "pressure_mca": reading.pressure_mca,
                        "flow_lps": reading.flow_lps,
                        "quality_flag": reading.quality_flag
                    })
                
                # Wait for next update
                await asyncio.sleep(15)  # Update every 15 seconds
                
        except WebSocketDisconnect:
            self.manager.disconnect(websocket)
            self.is_running = False
        except Exception as e:
            print(f"WebSocket error: {e}")
            self.manager.disconnect(websocket)
            self.is_running = False
    
    async def send_initial_data(self, websocket: WebSocket):
        """Send initial data when client connects"""
        # Get DMA summary
        dma_summary = self.telemetry_service.get_dma_summary(
            self.telemetry_service.target_dma
        )
        
        await self.manager.send_message({
            "type": "INITIAL_DATA",
            "data": {
                "dma": dma_summary,
                "timestamp": datetime.utcnow().isoformat()
            }
        }, websocket)