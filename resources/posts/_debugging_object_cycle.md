---
template: detail.hbs
title: Debugging "possible object cycle was detected" in ASP.NET.
date: 2021-09-16
author: Jon Koenig
---
If you're new to ASP.NET, Entity Framework or just web development in general, and you encounter something like this:

```
System.Text.Json.JsonException: 
A possible object cycle was detected which is not supported. This can either be due to a cycle or if the object depth is larger than the maximum allowed depth of 32.
```

You are most likely creating an infinite loop with the data that your controller is returning. For example:

```
public class PostModel
{
    public Guid Id { get; init; }

    public string Text { get; init; }

    public DateTime CreatedOn { get; init; }
    
    public DateTime UpdatedOn { get; init; }
    
    public ThreadModel Thread { get; set; }
}
```

Maybe you are returning an instance of this PostModel class from your controller, which includes a ThreadModel via the Thread property.

```
public class ThreadModel
{
    public Guid Id { get; init; }

    public string Title { get; init; }

    public string Text { get; init; }

    public DateTime CreatedOn { get; init; }

    public DateTime UpdatedOn { get; init; }

    public List<PostModel> Replies { get; set; }
}
```

The ThreadModel class includes a list of all related PostModel objects in the Replies property, so when you return a PostModel object it returns the ThreadModel that the PostModel is associated with, which itself returns the PostModel instances that are associated with the ThreadModel. And so on and so forth, until the stack collapses.

## Data Transfer Objects

I'd say it is best practice to resolve this issue by implementing Data Transfer Objects.

```
public class PostSimpleThreadDto
{
    public Guid Id { get; init; }

    public string Text { get; init; }

    public DateTime CreatedOn { get; init; }
    
    public DateTime UpdatedOn { get; init; }

    public ThreadNoReplyDto Thread { get; set; }
}
```

We can return this PostSimpleThreadDto instead of a PostModel directly. This class includes a space for a ThreadNoReplyDto instead of a ThreadModel.

```
public class ThreadNoReplyDto
{
    public Guid Id { get; init; }

    public string Title { get; init; }

    public string Text { get; init; }
}
```

the ThreadNoReplyDto class contains information about a class itself, but no list of related PostModel objects. This is how you prevent the infinite loop.

```
[HttpGet]
public ActionResult<PostSimpleThreadDto> Get()
{
    List<PostModel> posts = Service.GetAllPosts();
    IEnumerable<PostSimpleThreadDto> dto = posts.Select(c => c.AsSimpleThreadDto());
    return Ok(dto);
}
```

From here, you can implement a variety of strategies to create these Data Transfer Objects from the data that your services return to you, and refactor your controllers accordingly.

## Debugging Strategy

The default JSON serializer used in ASP.NET Core 3.0 and up is in System.Text.JSON, and it doesn't appear to support the "Reference Loop Handling" feature. Another way to resolve the issue would be to use the serializer from the NewtonsoftJson package.

```
dotnet add package Microsoft.AspNetCore.Mvc.NewtonsoftJson
```

Be sure to include the relevant options in your startup.cs file.

```
services.AddControllers().AddNewtonsoftJson(options =>
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore
);
```