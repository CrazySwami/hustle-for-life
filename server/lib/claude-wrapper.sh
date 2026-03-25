#!/bin/bash
# Wrapper that unsets CLAUDECODE before launching Claude CLI
# The Agent SDK uses this via pathToClaudeCodeExecutable
unset CLAUDECODE
exec /home/dev/.local/bin/claude "$@"
