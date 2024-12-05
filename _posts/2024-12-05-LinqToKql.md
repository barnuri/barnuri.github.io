---
title: C# LINQ to KQL with ORMGEN OpenSource
layout: post
date: '2024-12-05 10:44:23'
thumbnail: '/assets/img/posts/CSharp.OpenSource.LinqToKql.jpeg'
permalink: '/blog/LinqToKql/'
usemathjax: true
categories:
    - codegen
    - dotnet
---

# CSharp.OpenSource.LinqToKql: LINQ to KQL with ORMGEN

[CSharp.OpenSource.LinqToKql](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql) is a powerful library that bridges the gap between LINQ (Language Integrated Query) and KQL (Kusto Query Language), commonly used for querying Azure Data Explorer (ADX) and other Kusto-based data sources. This library simplifies querying Kusto data sources using LINQ's familiar syntax, making it easier for developers to work with Kusto data in their .NET applications.

## ORMGEN: Auto-Generation of KQL Queries

One of the standout features within this library is **ORMGEN**, an ORM (Object-Relational Mapping) generator that automates the generation of KQL queries. ORMGEN enables developers to create and execute complex KQL queries directly from their C# code using LINQ, without manually writing the raw KQL. This tool automatically handles the conversion of LINQ queries into the appropriate KQL syntax, saving time and reducing the chances of errors in query construction.

### How ORMGEN Works

ORMGEN utilizes LINQ to KQL query translation behind the scenes. Developers can define their data models in C# and use standard LINQ syntax to query Kusto databases. ORMGEN then takes these LINQ queries and translates them into optimized KQL queries, which are executed on the Kusto cluster. This abstraction allows developers to stay focused on their application logic rather than worry about the underlying query language.

#### Example of using ORMGenerator

[Live Example - https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql/blob/master//Samples/ORMGeneratorTest/](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql/blob/master//Samples/ORMGeneratorTest/)

##### Generate

```csharp
        var providerExecutor = _mockExecutor.Object;
        var ormGenerator = new ORMGenerator(new()
        {
            ProviderExecutor = providerExecutor,
            ModelsFolderPath = "../../../../ORMGeneratorTests/Models",
            DbContextFolderPath = "../../../../ORMGeneratorTests",
            DbContextName = "AutoGenORMKustoDbContext",
            Namespace = "AutoGen",
            ModelsNamespace = "AutoGen",
            DbContextNamespace = "AutoGen",
            CreateDbContext = true,
            CleanFolderBeforeCreate = true,
            EnableNullable = true,
            FileScopedNamespaces = true,
            DatabaseConfigs = new List<ORMGeneratorDatabaseConfig>
            {
                new ORMGeneratorDatabaseConfig
                {
                    DatabaseName = DbName1,
                    Filters = new ORMGeneratorFilterConfig()
                },
                new ORMGeneratorDatabaseConfig
                {
                    DatabaseName = DbName2,
                    DatabaseDisplayName = "db2",
                    Filters = new ORMGeneratorFilterConfig()
                }
            }
        });
        await _ormGenerator.GenerateAsync();
        // output example https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql/tree/master/Samples/ORMGeneratorTest
```

##### Usage

```csharp
using AutoGen;
using CSharp.OpenSource.LinqToKql.Extensions;
using CSharp.OpenSource.LinqToKql.Http;
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddKustoDbContext<AutoGenORMKustoDbContext, KustoHttpClient>(sp => new KustoHttpClient("mycluster", "auth", "dbName"));
var provider = services.BuildServiceProvider();
var dbContext = provider.GetRequiredService<AutoGenORMKustoDbContext>();

dbContext.TestTable1.Where(x => x.TestColumn == "test").ToList();
dbContext.db2<object>("customQuery").ToList();
dbContext.func1().ToList();
dbContext.func2("name", "lastName").ToList();
```

##### Manual DbContext Example

For example, a simple LINQ query like [Full Example](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql/blob/master/CSharp.OpenSource.LinqToKql.Test/Provider/MyMultiDbContext.cs):

```csharp
var result = context.SampleObjects.Where(o => o.Year > 2000);
```

```csharp
using CSharp.OpenSource.LinqToKql.Provider;
using CSharp.OpenSource.LinqToKql.Test.Model;
using CSharp.OpenSource.LinqToKql.Translator;

namespace CSharp.OpenSource.LinqToKql.Test.Provider;

public class MyMultiDbContext : KustoDbContext
{
    public MyMultiDbContext(IKustoDbContextExecutor<MyMultiDbContext> executor) : base(executor)
    {
    }

    // from default db
    public IQueryable<SampleObject> SampleObjects
        => CreateQuery<SampleObject>("sampleObjects");

    // from different db
    public IQueryable<SampleObject2> SampleObjects2
        => CreateQuery<SampleObject2>("sampleObjects2", database: "diffDb");

    public IQueryable<SampleObject> Func(int minYear)
        => CreateQuery<SampleObject>($"sampleObjects | where year > {minYear}");

    public IQueryable<SampleObject> Func2(int minYear)
        => CreateQuery<SampleObject>($"sampleObjectsByMinYear({minYear})");

    public IQueryable<SampleObject> Func3(int minYear)
        => SampleObjects.Where(x => x.Year > minYear);

    protected override LinqToKQLQueryTranslatorConfig GetConfig() => new() { DisableNestedProjection = true };
}

public class MyMultiDbContext2 : MyMultiDbContext
{
    public MyMultiDbContext2(IKustoDbContextExecutor<MyMultiDbContext> executor) : base(executor)
    {
    }
}
```

Will be translated by ORMGEN into a corresponding KQL query that fetches the relevant data from the Kusto database. This ensures developers can work with a high-level API without sacrificing performance or flexibility.

## Benefits of Using CSharp.OpenSource.LinqToKql with ORMGEN

1. **Efficiency**: Save time by using LINQ, which is widely known in the .NET ecosystem, instead of learning KQL.
2. **Error Reduction**: Let ORMGEN handle query generation automatically, reducing the risk of errors in manual query writing.
3. **Seamless Integration**: Leverage the power of LINQ while interacting with Kusto databases.
4. **Open Source**: As an open-source project, [CSharp.OpenSource.LinqToKql](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql) is free to use and open for contributions. If you're passionate about improving this tool, you can contribute to the project on GitHub. Whether it's fixing bugs, adding features, or improving documentation, your contributions are welcome.

## Getting Involved

[CSharp.OpenSource.LinqToKql](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql) is actively looking for contributors to help improve and expand its functionality. Whether you're an expert in Kusto or just passionate about making open-source tools better, your help would be greatly appreciated.

Check out the [GitHub repository](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql) to get started with contributing. You can submit bug reports, create feature requests, or even open pull requests with your own improvements to the project.

## Conclusion

[CSharp.OpenSource.LinqToKql](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql) is a great tool for .NET developers working with Azure Data Explorer and Kusto queries. Its integration with LINQ and the automatic query generation via ORMGEN makes working with Kusto databases easier and more efficient.

If you're interested in making the project even better, don't forget that it's open-source and the team is actively seeking contributors. Start contributing today and help make this tool even more powerful for the .NET community!

---

For more details, visit the [GitHub repository](https://github.com/csharp-opensource/CSharp.OpenSource.LinqToKql).
