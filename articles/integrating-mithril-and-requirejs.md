## Integrating Mithril and RequireJS

Today's article comes from a question from Woody Gilk: can Mithril be used with RequireJS?

That's a great question. For those who don't know, RequireJS is a library to manage asynchronous dependencies, or in plain english, it lets us download parts of our applications as they become needed, rather than bundling the entire codebase in one javascript file that gets downloaded at page load.

There are both advantages and disadvantages for using a system like RequireJS. The main disadvantage comes from the extra latency that is introduced by RequireJS: you need to download it before you can download anything else. The advantage is that you can then avoid loading code for features that the user never uses. So if you expect your codebase to be large enough that downloading all of it at once takes longer than the network latency of downloading a bootstrapper, using RequireJS is a good idea.

Anyways, back to the question. Mithril ships with a [single-page-application router](http://lhorie.github.io/mithril/mithril.route.html), which lets us show different content depending on the URL, without necessarily reloading the page. Here's a simple example:

```javascript
var page1 = {}
page1.controller = function() {
	this.greeting = "Hello world"
}
page1.view = function(ctrl) {
	return [
		m("h1", ctrl.greeting),
		m("a[href='/page-two']", {config: m.route}, "Go to page 2")
	]
}

var page2 = {}
page2.controller = function() {
	this.greeting = "Hi from page 2"
}
page2.view = function(ctrl) {
	return [
		m("h1", ctrl.greeting),
		m("a[href='/page-one']", {config: m.route}, "Go back to page 1")
	]
}

m.route(document, "/page-one", {
	"/page-one": page1,
	"/page-two": page2,
})
```

Here we define two sample modules, `page1` and `page2`. Each contains a controller and a view. The router at the bottom defines that `/page-one` is the default page, and that there are two possible pages, at the URLs `/page-one` and `/page-two`, which load the respectively modules.

The default routing mode is to use the querystring, so if we ran this app from the URL `http://localhost`, it would then redirect to `http://localhost/?/page-one`. Navigating to page 2 would change the URL to `http://localhost/?/page-two`

There are other routing modes available, and you can learn more about them [here](http://lhorie.github.io/mithril/mithril.route.html#mode), but they are not relevant to this article, so let's move ahead.

### Splitting an app

In the contrived example above, the code is obviously simple and there's no benefit to using an asynchronous module loader like RequireJS, but let's pretend our app was really big and had tens of thousands of different modules, each weighting at 10kb or more. In that case, it's clear that loading the entire app on page load would require users to download an unrealistic amount of code even if they were only planning on using 2 or 3 pages.

Let's look at how one might implement an **asynchronous module loader** to allow us to split the app into separate files. Here's a simple one using Mithril's `m.request`

```javascript
//module loader helper
var asyncModule = function(name) {
	return {
		controller: function() {
			m.request({
				method: "GET",
				url: name + ".js",
				deserialize: function(data) {
					return new Function("var module = {};" + data + ";return module").call().exports
				}
			})
			.then(function(module) {
				this.controller = new module.controller()
				this.view = module.view
			}.bind(this))
		},
		view: function(ctrl) {
			return ctrl.view(ctrl.controller)
		}
	}
}

//routes
m.route(document.body, "/page-one", {
	"/page-one": asyncModule("page1"),
	"/page-two": asyncModule("page2")
})
```

In the code above, we created a helper function called `asyncModule`, which we are going to use as an intermediary handler for all routes in our application. This technique is known as the **Front Controller pattern**.

The `asyncModule` function returns a [Mithril module](http://lhorie.github.io/mithril/mithril.module.html), which is nothing more than a plain Javascript object with a `controller` and a `view` properties (both of which are functions).

In this module, the `controller` function loads a javascript file via AJAX by using `m.request`. When calling `m.request`, we define a custom `deserialize` option, so that instead of parsing the file as JSON, we compile the code as a function, and then execute it. The function returns a CommonJS module.

A CommonJS module is also a plain Javascript object, but it has a property called `exports`, which can hold an arbitrary payload.

Here's what an asynchronous module file would need to look like to work with the loader we just created:

```javascript
//file: page1.js
var page1 = {}
page1.controller = function() {
	this.greeting = "Hello world"
}
page1.view = function(ctrl) {
	return [
		m("h1", ctrl.greeting),
		m("a[href='/page-two']", {config: m.route}, "Go to page 2")
	]
}


module.exports = page1
```

As you can see, we just copied the `page1` Mithril module into a file and assigned it to `module.exports`, which, in CommonJS environments, is assumed to always exist. If we do the same for the `page2` module, we can then run the example.

In `asyncModule`'s controller, we added a callback to `m.request`'s returned promise. This callback then creates an instance of `page1`'s controller, and exposes `ctrl.controller` and `ctrl.view`, which are then used in the view to assemble the expected semantics of the `page1` module.

The end result is that running this code loads the `page1` from a separate file successfully. [You can see it in action here](http://plnkr.co/edit/dkSEb9rh9WrZT2ZVqN3l?p=preview)

### Managing dependencies

The problem with the code above (and CommonJS in general) is that asynchronous modules can have dependencies. For example, we might have a `page3` module which needs a datepicker and a autocompleter. In situations like that, we need to first load the dependencies, and only after all these dependencies are loaded, we are able to run the module in question. The API for adding dependencies in CommonJS is synchronous, so it would have to implemented as a blocking call (which is unacceptable because it would lock up the browser)

One way to tackle the issue is to load all the dependencies at page load. This makes sense if the dependencies are reused frequently throughout the application. If a lot of pages in our example app use the datepicker and autocompleter modules, then it's better to preload them on page load, rather than on route change.

Preloading takes advantage of the browser's parallel downloading features, so the user never waits more than one network round-trip. Loading these dependencies on demand requires us to download the module in question to find out what dependencies to download (and *then* download them), which takes two network round-trips one after the other.

If, however, our application has a lot of one-off dependencies, then preloading all of them becomes unfeasible for the same reason as having a large number of modules. It should also be noted that having a deep hierarchy of dependencies could lead to a long queue of HTTP requests, which could have a disastrous impact on performance due to latency.

Thankfully, there's RequireJS. It provides tools to resolve dependency graphs, cache redundant dependencies and server-side bundling tools to manually optimize the latency  profile of deep dependency trees.

We can adapt our `asyncModule` helper function to use it instead of our naive loader:

```javascript
var asyncModule = function(name) {
	return {
		controller: function() {
			m.startComputation()
			
			require([name], function(module) {
				this.controller = new module.controller()
				this.view = module.view
				
				m.endComputation()
			}.bind(this))
		},
		view: function(ctrl) {
			return ctrl.view(ctrl.controller)
		}
	}
}
```

Because we're using RequireJS's AJAX mechanism, we need to tell Mithril when this 3rd party asynchronous operation is done.

This is accomplished with `m.startComputation` and `m.endComputation`. `m.startComputation` tells Mithril that an asynchronous operation is going to be initiated and that rendering should be deferred, and `m.endComputation` tells Mithril that the asynchronous operation completed and that Mithril may redraw if no other asynchronous operations are still pending (and they could be if the module itself makes more AJAX requests for data). The reason we are using these methods instead of `m.redraw` is that using `m.redraw` would trigger two redraws (one immediately when the controller returns, and another when the RequireJS module is resolved). Usually aggressive rendering is a bad idea, because the controller might not be fully initialized with data by the time it returns, which could lead to null reference exceptions in the view.

The `require` function is RequireJS's asynchronous module loader. It takes the name of the file as a parameter, just like our helper function, and then runs a callback function when that module is available.

As with the CommonJS interface, RequireJS also has a specific pre-defined way of exporting modules from files.

```javascript
//file: page1.js
define(function() {
	var page1 = {}
	page1.controller = function() {
		this.greeting = "Hello world"
	}
	page1.view = function(ctrl) {
		return [
			m("h1", ctrl.greeting),
			m("a[href='/page-two']", {config: m.route}, "Go to page 2")
		]
	}

	return page1
})
```

Instead of assigning our `page1` module to a `module.exports` variable, we wrap the whole thing in a callback function that returns it, and then pass that callback as an argument to a RequireJS function called `define`, which is assumed to always exist in RequireJS-enabled environments.

If we do this change to the `page2.js` file, we can then run the code. [Here's the code in action.](http://plnkr.co/edit/ds77VeFBJyyHefHMFyOS?p=preview)

---

Now that we have ported our application to use RequireJS, we can then start using it to manage our dependencies. The simplest way to inject a dependency with RequireJS is to pass the file name (sans extension) to the `define` function, much like we did with the `require` call.

```javascript
//file: page3
define(["datepicker", "autocompleter"], function(datepicker, autocompleter) {
	var page3 = {}
	
	/*
	initialize it here
	*/
	
	return page3
})
```

The dependencies can be `define`d in the same way we covered before, in a turtles-all-the-way-down fashion.

```javascript
//file: datepicker.js
define(function() {
	var datepicker = {}
	
	/*
	initialize it here
	*/
	
	return datepicker
})
```

Because dependencies are, by definition, loaded before the module itself, we don't need to do any extra work on the `asyncModule` helper to cater for them. Once a relevant module is ready, we can be sure that all dependencies are ready as well.

### Parting thoughts

I should note that idiomatic RequireJS initialization is a little bit different from what I showed here (it uses a data attribute on the script tag, and a initialization file which is itself loaded asynchronously), but I wanted to keep the magic to a minimum to make it easier to understand the core concepts and to visualize where latency occurs.

There's a broad range of advanced scenarios that RequireJS can handle that are not in scope for this article, (bundling, shallow exclusions, circular dependencies, to name a few topics) so I encourage you to read through their documentation.

Phew! I hope this article wasn't too overwhelming. Hopefully it sheds some light into why one might want to use RequireJS, and how to do not-so-trivial 3rd party library integration with Mithril.