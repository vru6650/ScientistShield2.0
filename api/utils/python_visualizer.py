
import contextlib
import io
import json
import sys
import traceback
from dataclasses import dataclass
from types import FrameType
from typing import Any, Dict, List, Optional


def safe_repr(value: Any, max_length: int = 120) -> str:
    """Return a human-friendly representation of a Python value."""

    try:
        result = repr(value)
    except Exception:  # pragma: no cover - repr failures are rare and best-effort
        result = f"<unrepresentable {type(value).__name__}>"
    if len(result) > max_length:
        result = result[: max_length - 3] + "..."
    return result


def is_primitive(value: Any) -> bool:
    """Return True if the value should be treated as a primitive literal."""

    return isinstance(value, (int, float, complex, bool, str, bytes, type(None)))


@dataclass
class MemoryObject:
    """Representation of an object captured in the heap snapshot."""

    id: str
    type: str
    kind: str
    repr: str
    value: Optional[str] = None
    elements: Optional[List[Dict[str, Any]]] = None
    entries: Optional[List[Dict[str, Any]]] = None
    attributes: Optional[List[Dict[str, Any]]] = None
    collectionType: Optional[str] = None
    truncated: bool = False


class MemoryGraph:
    """Utility to capture object references similar to Python Tutor."""

    def __init__(self, max_depth: int = 4, max_items: int = 25, max_objects: int = 256):
        self.max_depth = max_depth
        self.max_items = max_items
        self.max_objects = max_objects
        self._objects: Dict[str, MemoryObject] = {}
        self._seen: Dict[int, str] = {}
        self._counter = 0

    def reference(self, value: Any, depth: int = 0) -> Optional[str]:
        """Register a value in the graph and return its object identifier."""

        try:
            object_id = self._seen[id(value)]
        except KeyError:
            object_id = None

        if object_id is not None:
            return object_id

        if self._counter >= self.max_objects:
            return None

        object_id = f"obj{self._counter + 1}"
        self._counter += 1
        self._seen[id(value)] = object_id

        obj_type = type(value).__name__
        entry = MemoryObject(id=object_id, type=obj_type, kind="primitive", repr=safe_repr(value))
        self._objects[object_id] = entry

        if depth >= self.max_depth:
            entry.truncated = True
            if is_primitive(value):
                entry.value = safe_repr(value)
            return object_id

        if is_primitive(value):
            entry.value = safe_repr(value)
            return object_id

        if isinstance(value, dict):
            entry.kind = "mapping"
            entry.entries = []
            for index, (key, val) in enumerate(value.items()):
                if index >= self.max_items:
                    entry.truncated = True
                    break
                entry.entries.append(
                    {
                        "key": self._describe_key(key, depth + 1),
                        "value": self._describe_ref(val, depth + 1),
                    }
                )
            return object_id

        if isinstance(value, (list, tuple, set)):
            entry.kind = "collection"
            if isinstance(value, tuple):
                entry.collectionType = "tuple"
            elif isinstance(value, set):
                entry.collectionType = "set"
            else:
                entry.collectionType = "list"

            entry.elements = []
            elements = list(value)
            if isinstance(value, set):
                elements = sorted(elements, key=repr)

            for index, item in enumerate(elements):
                if index >= self.max_items:
                    entry.truncated = True
                    break
                entry.elements.append(self._describe_ref(item, depth + 1))
            return object_id

        if hasattr(value, "__dict__") and not isinstance(value, type):
            entry.kind = "object"
            entry.attributes = []
            attributes = list(value.__dict__.items())
            for index, (name, val) in enumerate(attributes):
                if name.startswith("__"):
                    continue
                if index >= self.max_items:
                    entry.truncated = True
                    break
                entry.attributes.append(
                    {
                        "name": name,
                        "value": self._describe_ref(val, depth + 1),
                    }
                )
            if not entry.attributes:
                entry.kind = "primitive"
                entry.value = safe_repr(value)
            return object_id

        # Fallback: treat as primitive textual representation
        entry.kind = "primitive"
        entry.value = safe_repr(value)
        return object_id

    def _describe_key(self, key: Any, depth: int) -> Dict[str, Any]:
        if is_primitive(key):
            return {"type": "primitive", "value": safe_repr(key)}
        ref = self.reference(key, depth)
        if ref is None:
            return {"type": "primitive", "value": safe_repr(key)}
        return {"type": "reference", "objectId": ref}

    def _describe_ref(self, value: Any, depth: int) -> Dict[str, Any]:
        ref = self.reference(value, depth)
        if ref is None:
            return {"type": "primitive", "value": safe_repr(value)}
        return {"type": "reference", "objectId": ref, "preview": safe_repr(value)}

    def snapshot(self, frames: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "frames": frames,
            "objects": [self._serialize_object(obj) for obj in self._objects.values()],
        }

    def _serialize_object(self, obj: MemoryObject) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "id": obj.id,
            "type": obj.type,
            "kind": obj.kind,
            "repr": obj.repr,
        }
        if obj.value is not None:
            payload["value"] = obj.value
        if obj.elements is not None:
            payload["elements"] = obj.elements
        if obj.entries is not None:
            payload["entries"] = obj.entries
        if obj.attributes is not None:
            payload["attributes"] = obj.attributes
        if obj.collectionType is not None:
            payload["collectionType"] = obj.collectionType
        if obj.truncated:
            payload["truncated"] = True
        return payload


def build_memory_snapshot(frame: FrameType, user_filename: str) -> Dict[str, Any]:
    """Construct a Python Tutor style memory snapshot."""

    graph = MemoryGraph()
    frames: List[Dict[str, Any]] = []
    current = frame
    while current is not None:
        code = current.f_code
        if code.co_filename == user_filename:
            locals_view: Dict[str, Any] = {}
            for name, value in current.f_locals.items():
                if name.startswith("__"):
                    continue
                ref = graph.reference(value)
                locals_view[name] = {
                    "objectId": ref,
                    "preview": safe_repr(value),
                }
            frames.append(
                {
                    "function": code.co_name or "<module>",
                    "line": current.f_lineno,
                    "locals": locals_view,
                }
            )
        current = current.f_back

    frames.reverse()
    return graph.snapshot(frames)


def build_stack(frame: FrameType, user_filename: str) -> List[Dict[str, Any]]:
    """Create a simplified representation of the active call stack."""
    stack: List[Dict[str, Any]] = []
    seen = 0
    while frame is not None and seen < 32:
        code = frame.f_code
        if code.co_filename == user_filename:
            stack.append(
                {
                    "function": code.co_name or "<module>",
                    "line": frame.f_lineno,
                }
            )
        frame = frame.f_back
        seen += 1
    stack.reverse()
    return stack


def tracer_factory(events: List[Dict[str, Any]], stdout_buffer: io.StringIO, user_filename: str):
    """Create a tracing function that records execution events."""

    def _tracer(frame: FrameType, event: str, arg: Any):
        if frame.f_code.co_filename != user_filename:
            return _tracer

        if event not in ("call", "line", "return", "exception"):
            return _tracer

        entry: Dict[str, Any] = {
            "event": event,
            "line": frame.f_lineno,
            "function": frame.f_code.co_name or "<module>",
            "locals": {
                name: safe_repr(value)
                for name, value in frame.f_locals.items()
                if not name.startswith("__") and name != "self"
            },
            "stack": build_stack(frame, user_filename),
            "stdout": stdout_buffer.getvalue(),
        }

        entry["memory"] = build_memory_snapshot(frame, user_filename)

        if event == "return":
            entry["returnValue"] = safe_repr(arg)
        elif event == "exception" and isinstance(arg, tuple) and len(arg) >= 2:
            exc_type, exc_value = arg[:2]
            entry["exception"] = {
                "type": getattr(exc_type, "__name__", str(exc_type)),
                "message": safe_repr(exc_value),
            }

        events.append(entry)
        return _tracer

    return _tracer


def main() -> None:
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Expected a single argument with the path to the code file."}))
        return

    code_path = sys.argv[1]
    events: List[Dict[str, Any]] = []
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    try:
        with open(code_path, "r", encoding="utf-8") as handle:
            source = handle.read()

        compiled = compile(source, code_path, "exec")
        global_namespace: Dict[str, Any] = {
            "__name__": "__main__",
            "__file__": code_path,
            "__package__": None,
        }

        sys.settrace(tracer_factory(events, stdout_buffer, code_path))
        try:
            with contextlib.redirect_stdout(stdout_buffer), contextlib.redirect_stderr(stderr_buffer):
                exec(compiled, global_namespace, global_namespace)
        finally:
            sys.settrace(None)

    except Exception as exc:  # pragma: no cover - execution errors are data we want to return
        tb = traceback.format_exc()
        result = {
            "success": False,
            "events": events,
            "stdout": stdout_buffer.getvalue(),
            "stderr": stderr_buffer.getvalue(),
            "error": {
                "message": str(exc),
                "traceback": tb,
            },
        }
    else:
        result = {
            "success": True,
            "events": events,
            "stdout": stdout_buffer.getvalue(),
            "stderr": stderr_buffer.getvalue(),
        }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
