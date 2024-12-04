---
title: "Supercharge Your API Development with OpenAPI Toolkit \U0001F680"
layout: post
author: barnuri
date: '2024-12-04 12:05:23'
thumbnail: "/assets/img/posts/openapi-toolkil-post.png"
permalink: "/blog/openapi-toolkit/"
usemathjax: true
categories:
- codegen
---

The world of APIs is vast, but developing and integrating them doesn’t have to be complicated. Introducing [**OpenAPI Toolkit**](https://github.com/barnuri/openapi-toolkit)—an open-source solution designed to streamline the way you work with OpenAPI (formerly Swagger) specifications.  

## What is OpenAPI Toolkit?  

**OpenAPI Toolkit** is a developer's dream come true. By taking an OpenAPI/Swagger file as input, the toolkit automatically generates both server and client code. This simplifies API integration and development by reducing manual errors, ensuring consistency, and speeding up workflows.  

Whether you're building a new service or integrating with existing APIs, OpenAPI Toolkit provides ready-to-use, tailored code that adheres to your specifications.  

## Key Features  

- **Automatic Code Generation**:  
  Generate server and client code instantly from your OpenAPI/Swagger specifications.  

- **Versatile Integration**:  
  Supports multiple languages and frameworks, including TypeScript, Python, Go, and C#.  

- **Error Reduction**:  
  Eliminates manual coding errors and ensures accuracy across implementations.  

- **Consistency Across Platforms**:  
  Guarantees uniformity, making APIs easier to manage and scale.  

## Installation  

You can install OpenAPI Toolkit using npm:  

```bash
npm i openapi-toolkit
```

For global CLI usage:  

```bash
npm i -g openapi-toolkit
```

## Getting Started  

### Auto-Generate Client/Server Code  

With CLI:  
```bash
openapi-toolkit -i https://petstore3.swagger.io/api/v3/openapi.json -g typescript-axios -o ./src/services/petStore --modelNamePrefix My --modelNameSuffix .dto
```

With Docker:  
```bash
docker run --rm --name openapi-toolkit -v "$(pwd)/output:/output" -e CLI_PARAMS="-i https://petstore3.swagger.io/api/v3/openapi.json -g typescript-axios --modelNamePrefix My --modelNameSuffix .dto" barnuri/openapi-toolkit
```

### Auto-Generate Programmatically  

Here’s an example of how to use the toolkit in Node.js:  

```js
const { multipleGenerate, generate } = require('openapi-toolkit');

// Generate multiple outputs
(async () => {
    const sharedConfig = { debugLogs: false };
    await multipleGenerate(`https://petstore3.swagger.io/api/v3/openapi.json`, [
        { ...sharedConfig, generator: 'typescript-react-query', output: `./typescript-react-query/src` },
        { ...sharedConfig, generator: 'typescript-axios', output: `./typescript-axios/src` },
        { ...sharedConfig, generator: 'c#', output: `./c#/src` },
        { ...sharedConfig, generator: 'go', output: `./go/src` },
        { ...sharedConfig, generator: 'python', output: `./python/src` },
    ]);
})();

// Generate a single output
(async () => {
    await generate({ pathOrUrl: `https://petstore3.swagger.io/api/v3/openapi.json`, generator: 'typescript-react-query', output: `./typescript-react-query/src` });
})();
```

### CLI Options  

Use the `-h` flag to see all available CLI options:  
```text
openapi-toolkit <command>, default command 'generate'

Commands:
  generate    auto generate proxy client from swagger file             [default]
  generators  generators list
  completion  generate completion script

Options:
      --version                Show version number                     [boolean]
  -h, --help                   Show help                               [boolean]
  -i, --pathOrUrl              path or url for swagger file           [required]
  -o, --output                 output path                            [required]
  -g, --generator              generator name      [default: "typescript-axios"]
  -t, --type                   [choices: "client", "server"] [default: "client"]
  -n, --namespace                         [default: "OpenapiDefinitionGenerate"]
      --modelsFolderName                                     [default: "models"]
      --modelNamePrefix                                            [default: ""]
      --modelNameSuffix                                            [default: ""]
```

## VSCode Plugin  

Boost productivity with the [**VSCode Plugin for Auto-Generate**](https://marketplace.visualstudio.com/items?itemName=Bar.generator-from-swagger).  

## Examples  

Check out the [examples](https://github.com/barnuri/openapi-toolkit/tree/main/examples/ReadMe.md) for more use cases.  

## Contribute  

OpenAPI Toolkit thrives on community contributions! Found a bug or have a feature request? Visit the [GitHub repository](https://github.com/barnuri/openapi-toolkit) and join the discussion.  

---  

With **OpenAPI Toolkit**, API development has never been this effortless. Try it today and revolutionize your workflow!
