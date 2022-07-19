<h1 align="center">VLSF</h1>
<h2 align="center">Syntactically sweet JavaScript</h2>

## About

VLSF allows for a stricter version of JavaScript that compiles easily and quickly into the original. VLSF allows any working JavaScript code to also work after being run through the VLSF compiler, meaning any feature that is not yet avaliable in VLSF can still be made to work!

## Basic Syntax

The primary changes to VLSF that differ from JavaScript is how variables and functions are defined.

### Variables

```
Declare<static> <variable_name> = "variable_value"
```

Variables are defined by using the "Declare" keyword, this keyword is then followed by either `<static>` or just `<>`. Using `<static>` will cause the variable to be set as a `const` variable in the resulting JavaScript. Below is an example of creating a variable named "test" with the value of 1 that is **not** constant.

```
Declare<> <test> = 1
```

That would then be compiled into the following JavaScript code:

```js
let test = 1
```

### Functions

```
Reusable <function_name> [function, params] = {
    return 0
}
```

Functions are defined using the "Reusable" keyword, this keyword is then followed by the name of the function enclosed with `<` and `>`. After the name comes the parameters, these are contained within an array and are separated by a single commad each. Below is an example of creating a simple function to add two numbers.

```
Reusable <add> [a, b] {
    return a + b
}
```

We could also add a variable inside of the function to do something else with the result.

```
Reusable <add> [a, b] {
    Declare<> <result> = a + b
    return result
}
```

The above function would compile to the following JavaScript code:

```js
let add = (a, b) => {
    let result = a + b
    return result
}
```

### Built-in Modules

VLSF comes with a few basic included modules, these modules can be used to accomplish many tasks in an easy way.

Modules are imported using the "Include" keyword. Each module is listed below.

- **Global.Out**: Module for printing data to the browser console
- **Web.Page**: Used to interact with the browser document
- **Web.Window**: Used to interact with the browser window
- **Web.Events**: Used to add and call events on nodes with the `Web.Events.onClientEvent(node, eventName, callback)` and `Web.Events.fireClientEvent(node, eventName)` functions
- **Global.Http**: Includes useful functions for dealing with HTTP in the browser, such as `Global.Http.Fetch(url: string, type: "json" | any)`

Each module can be imported like this:

```
#Include <Global.Http>
#Include <Global.Out>

#Include <Web.Window>
#Include <Web.Events>
#Include <Web.Page>
```