from prometheus_client import Counter

REQUEST_COUNT = Counter(
    "request_count",
    "Total API Requests"
)

LLM_REQUEST_COUNT = Counter(
    "llm_request_count",
    "Total LLM Requests"
)