#!/usr/bin/env python3

import os
import argparse

LANG_MAPPING = {
    ".c": "c",
    ".cc": "cpp",
    ".cpp": "cpp",
    ".cs": "csharp",
    ".go": "go",
    ".h": "cpp",
    ".hpp": "cpp",
    ".html": "html",
    ".java": "java",
    ".js": "javascript",
    ".jsx": "javascript",
    ".kt": "kotlin",
    ".lua": "lua",
    ".m": "objectivec",
    ".md": "markdown",
    ".mm": "objectivec",
    ".php": "php",
    ".pl": "perl",
    ".py": "python",
    ".rb": "ruby",
    ".rs": "rust",
    ".sh": "shell",
    ".sql": "sql",
    ".swift": "swift",
    ".ts": "typescript",
    ".tsx": "typescript",
}


def create_system_prompt(root_dir, output_file, prompt_text):
    """
    Generates a markdown document containing the names and content of source code files
    in the specified root directory and its subdirectories, excluding directories starting with a period.

    Args:
        root_dir: The root directory to search for source code files.
        output_file: The name of the output markdown file.
        prompt_text: The introductory prompt text for the markdown file.
    """

    with open(output_file, "w") as f:
        f.write(f"{prompt_text}\n\n")

        for root, dirs, files in os.walk(root_dir):
            # Modify dirs in-place to prevent os.walk from recursing into directories starting with '.'.
            # I'm looking at you, .git and .venv. Although, TBH .vscode might be handy to send.
            dirs[:] = [d for d in dirs if not d.startswith(".")]

            for filename in files:
                _, ext = os.path.splitext(filename)
                if ext in LANG_MAPPING:
                    filepath = os.path.join(root, filename)
                    relative_filepath = os.path.relpath(filepath, root_dir)

                    f.write(f"{relative_filepath}\n")
                    lang = LANG_MAPPING[ext]
                    # Markdown only requires 3 back-quotes. Using 5 back-quotes allows
                    # 3 back-quotes and 4 back-quotes to appear in the quoted document.
                    f.write(f"`````{lang}\n")

                    try:
                        with open(filepath, "r") as source_file:
                            f.write(source_file.read())
                    except UnicodeDecodeError:
                        f.write(
                            f"--- ERROR: Could not decode file content (non-text file?) ---\n"
                        )
                    except Exception as e:
                        f.write(f"--- ERROR: Could not read file content: {e} ---\n")

                    f.write("\n`````\n\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create a system prompt for an LLM containing code from source files, excluding dot directories."
    )
    parser.add_argument(
        "-o",
        "--output",
        default="initial_prompt.md",
        help="The name of the output markdown file.",
    )
    parser.add_argument(
        "-p",
        "--prompt",
        type=str,
        default="""You are an expert WebGL programmer.
Here are the sources to a project:""",
        help="The introductory prompt text.",
    )
    parser.add_argument(
        "-r", "--root-dir", default=".", help="The root directory of the source code."
    )

    args = parser.parse_args()

    root_dir = os.path.abspath(args.root_dir)  # Ensure root_dir is absolute path
    create_system_prompt(root_dir, args.output, args.prompt)
    print(f"Project source code prompt written to {args.output}")
    
    
