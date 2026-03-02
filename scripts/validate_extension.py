#!/usr/bin/env python3
"""Static validation for Docker Desktop extension packaging.

Checks Dockerfile labels and metadata.json fields without requiring
Docker Desktop. Designed to run in CI (GitHub Actions ubuntu runner).
"""

import json
import os
import re
import sys

RED = "\033[0;31m"
GREEN = "\033[0;32m"
RESET = "\033[0m"

errors = 0


def fail(msg: str) -> None:
    global errors
    print(f"{RED}FAIL: {msg}{RESET}")
    errors += 1


def ok(msg: str) -> None:
    print(f"{GREEN}OK: {msg}{RESET}")


def info(msg: str) -> None:
    print(f"  {msg}")


# Required labels for Docker Marketplace submission
REQUIRED_LABELS = [
    "org.opencontainers.image.title",
    "org.opencontainers.image.description",
    "org.opencontainers.image.vendor",
    "com.docker.desktop.extension.api.version",
    "com.docker.desktop.extension.icon",
    "com.docker.extension.screenshots",
    "com.docker.extension.detailed-description",
    "com.docker.extension.publisher-url",
    "com.docker.extension.changelog",
    "com.docker.extension.categories",
]

# Labels that must contain valid JSON arrays
JSON_LABELS = [
    "com.docker.extension.screenshots",
    "com.docker.extension.additional-urls",
]

# Labels that are optional (don't fail if missing, but validate if present)
OPTIONAL_LABELS = [
    "com.docker.extension.additional-urls",
]


def extract_labels(content: str) -> dict[str, str]:
    """Extract all LABEL key=value pairs from a Dockerfile.

    Handles multi-line LABEL blocks with backslash continuation and
    values containing escaped quotes.
    """
    labels = {}

    # Collapse backslash-newline continuations
    collapsed = content.replace("\\\n", " ")

    # Find all label assignments: key="value" (with escaped quotes in value)
    for match in re.finditer(
        r'([a-zA-Z0-9._-]+)\s*=\s*"((?:[^"\\]|\\.)*)"', collapsed
    ):
        key = match.group(1)
        raw_value = match.group(2)
        # Unescape Dockerfile string escapes
        value = raw_value.replace('\\"', '"')
        labels[key] = value

    return labels


def validate_dockerfile(path: str) -> dict[str, str]:
    """Validate Dockerfile labels. Returns extracted labels."""
    print(f"--- Dockerfile labels ({path}) ---")

    if not os.path.isfile(path):
        fail(f"{path} not found")
        return {}

    with open(path) as f:
        content = f.read()

    labels = extract_labels(content)

    # Check required labels
    for label in REQUIRED_LABELS:
        if label in labels and labels[label]:
            ok(label)
        else:
            fail(f"missing required label: {label}")

    return labels


def validate_json_labels(labels: dict[str, str]) -> None:
    """Validate that JSON-valued labels parse correctly."""
    print()
    print("--- JSON label validation ---")

    for label in JSON_LABELS:
        if label not in labels:
            if label in OPTIONAL_LABELS:
                info(f"SKIP: {label} (optional, not present)")
            else:
                fail(f"{label} value not found")
            continue

        value = labels[label]
        try:
            parsed = json.loads(value)
            if not isinstance(parsed, list):
                fail(f"{label} must be a JSON array, got {type(parsed).__name__}")
            else:
                ok(f"{label} is valid JSON ({len(parsed)} items)")
        except json.JSONDecodeError as e:
            fail(f"{label} is not valid JSON: {e}")


def validate_metadata(path: str) -> None:
    """Validate metadata.json required fields."""
    print()
    print(f"--- metadata.json ({path}) ---")

    if not os.path.isfile(path):
        fail(f"{path} not found")
        return

    with open(path) as f:
        try:
            meta = json.load(f)
        except json.JSONDecodeError as e:
            fail(f"invalid JSON: {e}")
            return

    ok("valid JSON")

    # Check required fields
    if not meta.get("icon"):
        fail("missing required field: icon")
    else:
        ok(f"icon field present: {meta['icon']}")

    # host.binaries is required by marketplace validator
    host = meta.get("host")
    if host is None:
        fail("missing required section: host")
    elif "binaries" not in host:
        fail("missing required field: host.binaries")
    else:
        ok("host.binaries present")

    # Check for obsolete fields
    obsolete_found = False
    for field in ["name", "provider"]:
        if field in meta:
            fail(f"obsolete field found: {field} (remove it)")
            obsolete_found = True
    if not obsolete_found:
        ok("no obsolete fields")

    # Cross-reference: icon file exists
    icon = meta.get("icon", "")
    if icon and os.path.isfile(icon):
        ok(f"icon file '{icon}' exists")
    elif icon:
        fail(f"icon file '{icon}' referenced but not found")


def validate_build_config(dockerfile_path: str) -> None:
    """Check for multi-platform build support."""
    print()
    print("--- Build configuration ---")

    with open(dockerfile_path) as f:
        content = f.read()

    if "BUILDPLATFORM" in content:
        ok("multi-platform build support (BUILDPLATFORM arg found)")
    else:
        info("WARN: no BUILDPLATFORM arg -- may not support multi-arch builds")


def main() -> int:
    dockerfile = sys.argv[1] if len(sys.argv) > 1 else "Dockerfile"
    metadata = sys.argv[2] if len(sys.argv) > 2 else "metadata.json"

    print("==> Validating Docker Desktop extension packaging")
    print()

    labels = validate_dockerfile(dockerfile)
    if labels:
        validate_json_labels(labels)
    validate_metadata(metadata)
    if os.path.isfile(dockerfile):
        validate_build_config(dockerfile)

    print()
    if errors == 0:
        print(f"{GREEN}==> All checks passed{RESET}")
        return 0
    else:
        print(f"{RED}==> {errors} error(s) found{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
