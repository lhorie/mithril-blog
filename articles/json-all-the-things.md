## JSON all the things

*June 22, 2014*

In [an earlier article](the-uniform-access-principle.html), we saw how we can use getter/setter functions to achieve the [Uniform Access Principle](http://en.wikipedia.org/wiki/Uniform_access_principle), and have data from our web services automatically map to our model entity classes.

This article will show you how to go the other way around: posting instances of our model classes *into* a JSON-based web service.

Consider this very simple class:

```javascript
function User(options) {
	this.name = m.prop(options.name);
};

var john = new User({name: "John Doe"});
console.log(john.name()); //logs "John Doe"
```

Normally, if we need to post data to a web service, frameworks will take care of running `JSON.stringify` on the Javascript object that we pass to an AJAX call. A clever reader might point out that classes w/ getter/setter methods are therefore inherently hard to serialize: After all, a getter/setter function is, well, a function, and functions cannot be serialized into JSON strings.

### Or can they?

If you try running the code below, it actually does what we want!

```javascript
console.log(JSON.stringify(john));
//logs '{"name": "John Doe"}'
```

As it turns out, the Javascript JSON API has an extremely handy hook that is not very well known: Anything that has a `toJSON` method attached will have that method called internally by `JSON.stringify`. The example below shows how we can make a function JSON-serializable:

```javascript
var greeter = function() {
	return "hello";
}
greeter.toJSON = greeter;

console.log(JSON.stringify(greeter));
//logs "hello"
```

Mithril's `m.prop` automatically hooks up this feature for its getters/setters, so we can easily convert POJO-based classes into UAP-enabled ones without surprises. 

In other words, if you have a class defined this way:

```javascript
//class definition
function User(options.name) {
	this.name = options.name;
};

//using the class
m.request({method: "POST", url: "/api/users", data: new User({name: "John Doe"})});
```

You can simply change the class implementation to use a getter/setter:

```
//class definition
function User(options) {
	this.name = m.prop(options.name);
};

//using the class
m.request({method: "POST", url: "/api/users", data: new User({name: "John Doe"})});
```

And there's no need to make any changes in the `m.request` call. It just works.

### Advanced serialization

Recall that one of the reasons we're using `m.prop` getter/setter methods is so that we can eventually *replace* `m.prop` with a custom computation if ever needed.

The Uniform Access Principle is great at hiding the implementation details of the getter/setter, but it's a double-edged sword: it also hides the complexity of the computation. `m.prop` can always auto-serialize its value because it doesn't incur any computational cost (since it's simply storing and retriving a value from a variable internally). But as soon as you need to start doing custom computations, you need to also have control over its serialization options.

Let's suppose that our `User` class now needs to work with a web service that works with this data structure:

```javascript
{"firstName": "John", "lastName": "Doe"}
```

A re-implementation of the class might look like this:

```javascript
function User(options) {
	this.firstName = m.prop(options.firstName);
	this.lastName = m.prop(options.lastName);
	
	this.name = function() {
		return this.firstName() + this.lastName();
	};
}
```

Our application might still be using the `name` method as a convenience method, but because of the schema change that propagated from the server, we'd definitely not want to serialize `name` into a JSON string. We want to post only `firstName` and `lastName`. And indeed, stringifying an instance of this new class yields the same data structure that we used to construct it:

```
var john = new User({firstName: "John", lastName: "Doe"});

console.log(JSON.stringify(john));
//logs '{"firstName": "John", "lastName": "Doe"}'
```

So, as you can see, classes that mix `m.prop` getter-setters with custom computed properties can be used both to convert web service data into javascript class instances and to convert these instances back to data that the web services can consume.

As an aside, if we did want to serialize a computed property for whatever reason, it's possible to do so by just using the JSON API hook we saw earlier:

```javascript
function User(options) {
	this.firstName = m.prop(options.firstName);
	this.lastName = m.prop(options.lastName);
	
	this.name = function() {
		return this.firstName() + this.lastName()
	};
	
	//make `name` serializable
	this.name.toJSON = this.name;
};

var john = new User({firstName: "John", lastName: "Doe"});
console.log(JSON.stringify(john));
//logs '{"firstName": "John", "lastName": "Doe", "name": "John Doe"}'
```

### Last thoughts

The JSON API's ability to process anything that has a `toJSON` method is very handy is supporting holistic UAP-enabled classes.

If you are familiar with statically typed OOP languages like Java or C#, you'll probably notice that the pattern of adding specific methods to make an object consumable by other APIs is essentially the same thing as implementing Interfaces (but without verbosity). Here's how you would express the JSON-serializable interface in Typescript:

```
interface JSONSerializable {
	toJSON(data:any): any
}
```

Javascript itself, however, is dynamically typed, so this interface does not necessarily exist as code anywhere - it literally takes *zero lines-of-code* to write its signature, simply because the runtime won't complain if it's not defined. But it's important to understand what it is conceptually, especially if you start using this technique to create your own interface consumers, so that you can then document your features effectively, instead of having them look like undocumented voodoo magic.