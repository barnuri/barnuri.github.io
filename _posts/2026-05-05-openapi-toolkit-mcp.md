---
title: "From OpenAPI to MCP Server in Seconds with openapi-toolkit 2.9.0 🤖"
layout: post
date: '2026-05-05 09:00:00'
thumbnail: "/assets/img/posts/openapi-toolkil-post.png"
permalink: "/blog/openapi-toolkit-mcp/"
usemathjax: true
categories:
- codegen
- mcp
- ai
---

[**openapi-toolkit 2.9.0**](https://github.com/barnuri/openapi-toolkit) is out, and it ships one of the most exciting generators yet: `python-mcp-server`. Point it at any OpenAPI or Swagger spec and it generates a fully functional [MCP](https://modelcontextprotocol.io/) server — no boilerplate, no glue code, ready to wire into Claude Desktop or any other MCP client in minutes.

## What is MCP?

The **Model Context Protocol (MCP)** is an open standard that lets AI assistants like Claude call real, external tools at runtime. Instead of relying solely on training knowledge, an AI equipped with an MCP server can fetch live data, trigger actions, and interact with APIs as part of a conversation. Think of it as a typed, discoverable interface between a language model and the outside world.

## How It Works

The `python-mcp-server` generator reads every endpoint in your OpenAPI spec and turns it into a named MCP tool — one tool per endpoint, grouped by controller tag. Under the hood it produces:

- A **FastMCP** entry point (`mcp_server.py`) that registers all tools and handles transport
- A generated **async httpx + Pydantic v2 client** bundled inline, so the server is a single self-contained Python project
- One tool file per controller tag under `server/tools/`, keeping concerns clean and easy to extend

## Quick Start

No install required — `npx` pulls the latest version on the fly:

```bash
npx openapi-toolkit \
  -i https://petstore3.swagger.io/api/v3/openapi.json \
  -g python-mcp-server \
  -t server \
  -o ./my-api-mcp
```

Or install globally and skip `npx`:

```bash
npm i -g openapi-toolkit
openapi-toolkit -i https://petstore3.swagger.io/api/v3/openapi.json -g python-mcp-server -t server -o ./my-api-mcp
```

## Generated Project Layout

```
my-api-mcp/
  pyproject.toml          # uv project: mcp, httpx, pydantic
  README.md
  src/
    mcp_server.py         # FastMCP entry point, tool registration, transport CLI
    client/               # generated async httpx + Pydantic v2 client (inline)
      __init__.py
      client.py
      models/
      controllers/
    server/
      tools/
        <controller>.py   # one file per API controller tag
```

## Install and Run

The generated project uses [uv](https://github.com/astral-sh/uv) for dependency management:

```bash
cd my-api-mcp
uv sync
BASE_URL=https://api.example.com uv run python src/mcp_server.py
```

## Transport Options

The server supports three transports, selectable at runtime:

```bash
# stdio — default, used by Claude Desktop and most MCP clients
BASE_URL=https://api.example.com uv run python src/mcp_server.py --transport stdio

# SSE
BASE_URL=https://api.example.com uv run python src/mcp_server.py --transport sse --host 0.0.0.0 --port 8000

# Streamable HTTP
BASE_URL=https://api.example.com uv run python src/mcp_server.py --transport streamable-http --host 0.0.0.0 --port 8000 --path /mcp
```

`stdio` is the right choice for local Claude Desktop integration. `sse` and `streamable-http` are useful when you want to host the MCP server as a shared service.

## Environment Variables

| Variable | Description |
|---|---|
| `BASE_URL` | Base URL of the target API — **required at runtime** |
| `TOOL_FILTER_ROUTES` | Comma-separated controller names to load (e.g. `pet,store`). Loads all if unset. |
| `TOOL_FILTER_METHODS` | Comma-separated tool function names to register (e.g. `getPetById,addPet`). Registers all if unset. |

`TOOL_FILTER_ROUTES` and `TOOL_FILTER_METHODS` are especially handy when your spec is large — expose only the tools an AI assistant actually needs, and keep the tool list focused.

## Live Example: Petstore MCP

A fully generated example using the Swagger Petstore API is available in the repository: [examples/pet-store-mcp](https://github.com/barnuri/openapi-toolkit/tree/master/examples/pet-store-mcp). Clone it, set `BASE_URL`, and you have a working MCP server against a real API in under a minute.

## Wrapping Up

With `python-mcp-server`, the gap between "I have an OpenAPI spec" and "my AI assistant can call this API" collapses to a single command. Any REST API with an OpenAPI or Swagger definition is now an MCP server waiting to happen.

Grab the toolkit, generate your server, and give your AI assistant real superpowers:

[**github.com/barnuri/openapi-toolkit**](https://github.com/barnuri/openapi-toolkit)
