## Wait for it

Here's a relatively common question that I hear from newcomers: "How do I show a loading icon?"

In this article, we'll look at one way to do just that.

Let's imagine we have a module that displays a list of things.

```javascript
var MyController = function() {
	this.things = requestWithFeedback({method: "GET", url: "/things"})
}
var myView = function(ctrl) {
	return [
		m("ul", [
			ctrl.things.data().map(function(thing) {
				return m("li", thing.name)
			})
		])
	]
}
```

First, we'll create a template for our loading icon:

```javascript
var loaderView = function() {
	return m("img.loader[src=loading.gif]", {style: {display: "none"}})
}
```

We can now easily adding this icon wherever we want in our main template:

```javascript
var MyController = function() {
	this.things = requestWithFeedback({method: "GET", url: "/things"})
}
var myView = function(ctrl) {
	return [
		loaderView(),
		m("ul", [
			ctrl.things.data().map(function(thing) {
				return m("li", thing.name)
			})
		])
	]
}
```

Next, we'll create a helper function to wrap around `m.request`:

```javascript
function requestWithFeedback(args) {
	return m.request(args)
}
```

This helper doesn't do much right now, but the important point is that it has the same signature as m.request both in terms of the arguments it expects, and the value that is returned. This means that if we have a big codebase already written, it's trivial to replace any calls to `m.request` with `requestWithFeedback`.

We can then extend `requestWithFeedback` so that it toggles the display of any icons that we define via `loaderView`.

```javascript
var requestWithFeedback = function(args) {
	var loaders = document.querySelectorAll(".loader")
	//show icons
	for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "block"
	
	return m.request(args).then(function() {
		//hide icons
		for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "none"
	})
}
```

And that's it. A simple bare bones loader icon.

---

### A few last notes

It may seem strange to manipulate DOM from a method that is typically called from the model layer, but typically we never do anything other than show and hide loader icons, so poking at them without using Mithril's redrawing system is usually safe (and more performant).

There are a variety of improvements that can be done to this code. For example, we can combine it with the cache object from the [request piggybacking technique](piggybacking-requests-in-a-widgety-world.html) if there are multiple parallel requests and we want want the loaders to stay visible until all of them finish:

```javascript
var requestWithFeedback = function(args) {
	var key = JSON.stringify(args)
	if (!requestWithFeedback.cache[key]) {
		//show icons
		for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "block"
		
		var expire = function(data) {
			delete requestWithFeedback.cache[key]
			
			if (Object.keys(requestWithFeedback.cache).length == 0) {
				//hide icons
				for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "none"
			}
			
			return data
		}
		requestWithFeedback.cache[key] = m.request(args).then(expire, expire)
	}
	return requestWithFeedback.cache[key]
}
requestWithFeedback.cache = {}
```

There are various other ways that you can customize a loader icon: you could have it be a translucent overlay that covers the page, or you could animate it. I'll leave the stylistic aspect as an exercise to the reader.

Just remember that loader icons are simply indicators to show that an application is doing something expensive, and not a "free out-of-jail card". You should, of course, still make an effort to architecture your application in such a way that doesn't require multiple requests per user action (especially if one request depends on the results of another), and avoid doing silly things like reading entire SQL tables into server memory and filtering the dataset with application code (as opposed to, you know, using the proper SQL statements to pull the correct data in the first place).