import re
from typing import Any, Dict

def _flatten(data: Any, prefix: str = "") -> Dict[str, Any]:
    """
    Flatten nested dictionary for dot-notation access.
    E.g. {"dog": {"url": "http://..."}} -> {"dog.url": "http://...", "url": "http://..."}
    """
    result = {}
    if not isinstance(data, dict):
        return result
    for key, value in data.items():
        full_key = f"{prefix}.{key}" if prefix else key
        result[full_key] = value
        # Also include without prefix if not already present
        if key not in result:
            result[key] = value
        if isinstance(value, dict):
            result.update(_flatten(value, full_key))
    return result

def resolve_config(config: Any, upstream_data: Dict[str, Any]) -> Any:
    """
    Recursively scan and replace {placeholder} keys in the config.
    Preserves type (e.g. dict, list, boolean, number) if the value is strictly the placeholder.
    """
    # Flatten all upstream outputs
    variables = {}
    for parent_id, data in upstream_data.items():
        if isinstance(data, dict):
            variables.update(_flatten(data, parent_id))
            variables.update(_flatten(data))

    exact_pattern = re.compile(r"^\{([a-zA-Z0-9_\-\.]+)\}$")
    str_pattern = re.compile(r"\{([a-zA-Z0-9_\-\.]+)\}")

    def _resolve_val(val: Any) -> Any:
        if isinstance(val, str):
            # Check for exact single variable match to preserve its type
            exact_match = exact_pattern.match(val)
            if exact_match:
                var_key = exact_match.group(1)
                if var_key in variables:
                    return variables[var_key]
                return val

            # Replace placeholders within a larger string
            def replace_match(match):
                key = match.group(1)
                if key in variables:
                    return str(variables[key])
                return match.group(0)

            return str_pattern.sub(replace_match, val)

        elif isinstance(val, dict):
            return {k: _resolve_val(v) for k, v in val.items()}
        elif isinstance(val, list):
            return [_resolve_val(item) for item in val]
        return val

    return _resolve_val(config)
