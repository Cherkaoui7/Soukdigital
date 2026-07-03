import json
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


from converter.exceptions import HistoryError

@dataclass
class HistoryItem:
    timestamp: str
    input_path: str
    output_path: str
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "input_path": self.input_path,
            "output_path": self.output_path,
            "metadata": self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "HistoryItem":
        return cls(**data)


class HistoryManager:
    def __init__(self, history_file: str = "conversion_history.json"):
        self.history_file = Path(history_file)
        self._ensure_history_file()

    def _ensure_history_file(self) -> None:
        if not self.history_file.exists():
            with open(self.history_file, "w") as f:
                json.dump([], f)
        else:
            try:
                with open(self.history_file, "r") as f:
                    json.load(f)
            except json.JSONDecodeError:
                with open(self.history_file, "w") as f:
                    json.dump([], f)

    def add(self, input_path: str, output_path: str, metadata: Dict[str, Any]) -> None:
        try:
            try:
                with open(self.history_file, "r") as f:
                    history = json.load(f)
            except json.JSONDecodeError:
                history = []

            entry = {
                "timestamp": datetime.now().isoformat(),
                "input_path": input_path,
                "output_path": output_path,
                "metadata": metadata,
            }

            history.append(entry)
            with open(self.history_file, "w") as f:
                json.dump(history, f, indent=2)
        except Exception as e:
            raise HistoryError(f"Failed to record history: {str(e)}")

    def get_history(self) -> List[Dict[str, Any]]:
        try:
            with open(self.history_file, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
        except Exception as e:
            raise HistoryError(f"Failed to read history: {str(e)}")
