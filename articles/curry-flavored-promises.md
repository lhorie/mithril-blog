## Curry flavored promises

*April 27, 2014*

One aspect of [Mithril](http://lhorie.github.io/mithril) that is pretty nice is that it allows us to use [promises](http://lhorie.github.io/mithril/mithril.deferred.html).

Promises are basically a mechanism that lets you chain a bunch of functions, which then get called asynchronously later when, say, an AJAX request completes:

```javascript
//a little helper function
var now = Date.now()
var pastItems = function(items) {
	return items.filter(function(item) {
		return item.date < now
	});
};

//here's an AJAX request and a chain of promises
m.request({method: "GET", url: "/api/projects"})
	.then(console.log) // log all projects
	.then(pastItems) // filter past projects
	.then(console.log) // log past projects only
```

Notice we're not calling `console.log()` nor `pastItems()`, but instead we're passing them to the promise's `.then()` method. What the code above does should be self-explanatory: it requests some projects, then logs them, then filters the list to only contain past projects, then logs the past projects. The one caveat that should be mentioned is that the only thing that happens immediately is the AJAX call. All the functions we passed to `.then` methods are only called at a later time, when the request completes.

Organizing our code as shown above is useful because it makes it easier for us to reuse code:

```javascript
m.request({method: "GET", url: "/api/vacations"})
	.then(pastItems) // filter past vacations
	.then(console.log) // log past vacations
```

We can use the `pastItems` function to filter the result of a `vacations` web service (or any other web services) in addition to the projects one. Of course, we can also call the function directly if we have a list laying around that we want to filter.

We can mix and match code too:

```javascript
//another helper function
var createdByJohnDoe = function(items) {
	return items.filter(function(item) {
		return item.createdBy == "John Doe"
	});
};

m.request({method: "GET", url: "/api/projects"})
	.then(pastItems) // filter past projects
	.then(createdByJohnDoe) // filter projects created by john doe
	.then(console.log) // log past projects created by john doe
```

A clever reader will probably notice that even though the code above is terse and modular, there is some room for improvement: The `createdByJohnDoe` function is not very reusable - we want to be able to filter by an arbitrary user, not just John Doe.

Fortunately, refactoring is easy. We can simply refactor our function to accept a `user` argument:

```javascript
var createdBy = function(user, items) {
	return items.filter(function(item) {
		return item.createdBy == user
	});
};
```

And then, we can **curry** this generic `createdBy` function to get the equivalent of `createdByJohnDoe` again:

```javascript
m.request({method: "GET", url: "/api/projects"})
	.then(pastItems) // filter past projects
	.then(createdBy.bind(this, "John Doe")) // filter projects created by john doe
	.then(console.log) // log past projects created by john doe
```

And voila! Curry flavored promises.

---

### What voodoo magic is this?

Let's slow down a bit.

As we saw from the function definition earlier, `createdBy` can be called like this:

```javascript
var things = [
	{name: "foo", createdBy: "John Doe"},
	{name: "bar", createdBy: "Jane Doe"},
	{name: "baz", createdBy: "Mary Doe"},
];
var byJohn = createdBy("John Doe", things); // [{name: "foo", createdBy: "John Doe"}]
```

Currying is a functional programming technique that lets us pre-define arguments in a function. So `createdBy.bind(this, "John Doe")` returns a function whose `user` argument is already set to "John Doe". The `this` argument is, as you might have guessed, what the `this` should point to inside of the curried function. Since we don't actually use `this` in `createdBy`, this value doesn't actually matter for our purposes.

One subtle thing to notice is that the curried function can still take more arguments, which will be mapped to whatever is the first argument that is not yet bound via the curry. Therefore, the curried function can be called like this:

```javascript
var createdByJohnDoe = createdBy.bind(this, "John Doe");

var byJohn = createdByJohnDoe(things); //[{name: "foo", createdBy: "John Doe"}]
```

Whereas the signature of `createdBy` is `function(user, items)`, in the curried `createdByJohnDoe` function, the signature is simply `function(items)` because `user` is already present via an internal closure. Since `items` is the first argument of `createdByJohnDoe`, we can then pass this function to the promise's `.then()` method, which takes a function with signature `function(value)`, whose argument `value` is bound to the value being piped through the promise chain.

So in the same way that calling `.then(console.log)` is equivalent to the code below:

```
.then(function(value) {
	console.log(value)
})
```

the same is true about the curried `createdByJohnDoe`. We can simply use the one-liner `.then()` calls as shown earlier, without the need to create the anonymous function.

Currying is a powerful technique that allows us to generalize and modularize our code, and then bring the pieces back together in a modular way.

It is one of the ways to avoid callback hell (i.e. zig-zaggy-indentation code made up of deeply nested callbacks), while at the same time enumerating the types of operations present in your app in a way that is easy to find, read and organize.

---

### Parting thoughts

I'll end this post with one last nugget: did you wonder why we are filtering projects on the client side? Usually it would make more sense to do so in the server (and more accurately, in the database server), but this is not always necessarily the case. Let's say that you do happen to have a full list of projects somewhere else in your app because it's something that the app deals with a lot. It's perfectly reasonable that your client-side model layer could cache that list, and that instead of re-fetching the data from the server, you could just tap into the client-side cache.

Since we are building an extensive arsenal of modular filter functions, we can just fetch the list once (maybe even put it in localStorage), and then slice and dice the cached list in a variety of ways without the need for a bunch of similar but just slightly different web service requests, and without the need to write a single extra line of SQL to support those slightly different requests.

So, you see, instead of spending all our time writing old style callback-driven code with lots of anonymous functions and a ton of custom SQL and other boilerplate code to support it, we can actually start spending time thinking of more efficient ways to deal with the data in our app in a much more comprehensive way. We can even start dreaming about things like offline apps.

Food for thought? Bon appetit!