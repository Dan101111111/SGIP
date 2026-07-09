import os
import joblib
from datetime import datetime
from typing import List, Dict, Any, Optional

class ModelRegistry:
    """Registry to save, load and track model versions"""
    
    def __init__(self, models_dir: str = "data/models"):
        self.models_dir = models_dir
        os.makedirs(self.models_dir, exist_ok=True)
        self.active_model_version: Optional[str] = None
        self._models_cache: Dict[str, Any] = {}

    def register_model(self, model: Any, metadata: Dict[str, Any]) -> str:
        """Register/save a model version with metadata"""
        version = metadata.get("version", datetime.utcnow().strftime("%Y%m%d_%H%M%S"))
        model_path = os.path.join(self.models_dir, f"model_{version}.pkl")
        meta_path = os.path.join(self.models_dir, f"model_{version}.meta")
        
        joblib.dump(model, model_path)
        joblib.dump(metadata, meta_path)
        
        self._models_cache[version] = model
        return version

    def load_model(self, version: str) -> Optional[Any]:
        """Load a specific model version"""
        if version in self._models_cache:
            return self._models_cache[version]
            
        model_path = os.path.join(self.models_dir, f"model_{version}.pkl")
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            self._models_cache[version] = model
            return model
        return None

    def get_active_model(self) -> Optional[Any]:
        """Get currently active model"""
        if not self.active_model_version:
            versions = self.list_models()
            if versions:
                self.active_model_version = versions[0]["version"]
            else:
                return None
        return self.load_model(self.active_model_version)

    def set_active_model(self, version: str) -> bool:
        """Set the active model version"""
        model_path = os.path.join(self.models_dir, f"model_{version}.pkl")
        if os.path.exists(model_path):
            self.active_model_version = version
            return True
        return False

    def list_models(self) -> List[Dict[str, Any]]:
        """List all registered models and metadata"""
        models = []
        if not os.path.exists(self.models_dir):
            return models
            
        for file in os.listdir(self.models_dir):
            if file.endswith(".meta"):
                version = file.replace("model_", "").replace(".meta", "")
                meta_path = os.path.join(self.models_dir, file)
                try:
                    metadata = joblib.load(meta_path)
                    models.append(metadata)
                except Exception:
                    models.append({"version": version, "error": "Could not read metadata"})
        
        # Sort by version desc
        models.sort(key=lambda x: x.get("version", ""), reverse=True)
        return models
