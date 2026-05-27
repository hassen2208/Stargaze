import os
import re

from fastapi import APIRouter, Depends
from prometheus_client import REGISTRY, generate_latest

from app.api.dependencies import get_current_user

router = APIRouter()


def parse_prometheus_metrics():
    raw_metrics = generate_latest(REGISTRY).decode("utf-8")

    parsed = []

    metric_pattern = re.compile(
        r'^(?P<name>[a-zA-Z_:][a-zA-Z0-9_:]*)'
        r'(?:\{(?P<labels>[^}]*)\})?\s+'
        r'(?P<value>[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$'
    )

    for line in raw_metrics.splitlines():
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        match = metric_pattern.match(line)

        if not match:
            continue

        labels = {}
        labels_raw = match.group("labels")

        if labels_raw:
            for item in labels_raw.split(","):
                if "=" in item:
                    key, raw_value = item.split("=", 1)
                    labels[key.strip()] = raw_value.strip().strip('"')

        parsed.append({
            "name": match.group("name"),
            "labels": labels,
            "value": float(match.group("value"))
        })

    return parsed


def get_metric_value(metrics, name, labels=None):
    labels = labels or {}
    total = 0.0

    for metric in metrics:
        if metric["name"] != name:
            continue

        metric_labels = metric["labels"]

        if all(metric_labels.get(k) == v for k, v in labels.items()):
            total += metric["value"]

    return total


def get_histogram_average(metrics, base_name):
    metric_sum = get_metric_value(
        metrics,
        f"{base_name}_sum"
    )

    metric_count = get_metric_value(
        metrics,
        f"{base_name}_count"
    )

    if metric_count == 0:
        return 0.0

    return metric_sum / metric_count



@router.get("/dashboard")
def metrics_dashboard(
    current_user = Depends(get_current_user)
):
    metrics = parse_prometheus_metrics()

    def get_business_requests(metrics):
        included_routes = [
            ("/api/v1/voice/process", "POST"),
            ("/api/v1/conversation/process", "POST"),
            ("/api/v1/tasks/", "POST"),
            ("/api/v1/tasks/{task_id}", "PUT"),
            ("/api/v1/tasks/{task_id}", "DELETE"),
        ]

        total = 0.0

        for metric in metrics:
            if metric["name"] != "http_requests_total":
                continue

            handler = metric["labels"].get("handler", "")
            method = metric["labels"].get("method", "")

            if (handler, method) in included_routes:
                total += metric["value"]

        return total

    total_requests = get_business_requests(metrics)

    llm_requests = get_metric_value(
        metrics,
        "llm_requests_total"
    )

    prompt_tokens = get_metric_value(
        metrics,
        "llm_tokens_total",
        {"type": "prompt"}
    )

    completion_tokens = get_metric_value(
        metrics,
        "llm_tokens_total",
        {"type": "completion"}
    )

    total_tokens = get_metric_value(
        metrics,
        "llm_tokens_total",
        {"type": "total"}
    )

    if total_tokens == 0:
        total_tokens = prompt_tokens + completion_tokens

    input_cost_per_1m = float(
        os.getenv(
            "GEMINI_INPUT_COST_PER_1M_TOKENS_USD",
            "0.075"
        )
    )

    output_cost_per_1m = float(
        os.getenv(
            "GEMINI_OUTPUT_COST_PER_1M_TOKENS_USD",
            "0.30"
        )
    )

    total_cost_usd = (
        (prompt_tokens / 1_000_000) * input_cost_per_1m
        + (completion_tokens / 1_000_000) * output_cost_per_1m
    )

    conversation_errors = get_metric_value(
        metrics,
        "conversation_errors_total"
    )

    voice_success_requests = get_metric_value(
    metrics,
    "voice_pipeline_requests_total",
    {"status": "success"}
)

    voice_error_requests = get_metric_value(
        metrics,
        "voice_pipeline_requests_total",
        {"status": "error"}
    )

    voice_total_requests = voice_success_requests + voice_error_requests

    return {
        "total_requests": total_requests,
        "voice_total_requests": voice_total_requests,
        "voice_success_requests": voice_success_requests,
        "voice_error_requests": voice_error_requests,
        "llm_requests": llm_requests,
        "total_tokens": total_tokens,
        "total_cost_usd": total_cost_usd,
        "conversation_errors": conversation_errors,
        "recognition_accuracy": 0,
        "voice_pipeline_seconds": get_histogram_average(
            metrics,
            "voice_pipeline_duration_seconds"
        ),
        "voice_transcription_seconds": get_histogram_average(
            metrics,
            "voice_transcription_duration_seconds"
        ),
        "voice_tts_seconds": get_histogram_average(
            metrics,
            "voice_tts_duration_seconds"
        )
    }