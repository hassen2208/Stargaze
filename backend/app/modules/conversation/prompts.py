from pathlib import Path


PROMPT_PATH = Path(
    "app/prompts/task_prompt.txt"
)


def load_task_prompt():

    with open(
        PROMPT_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()