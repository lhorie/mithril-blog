## Wait for it

Here's a relatively common question that I hear from newcomers: "How do I show a loading icon?"

In this article, we'll look at one way to do just that.

Let's imagine we have a module that displays a list of asynchronously loaded things when we click on a button.

```javascript
var MyController = function() {
	this.showThings = function() {
		this.things = m.request({method: "GET", url: "/things"})
	}.bind(this)
}
var myView = function(ctrl) {
	return [
		m("button[type=button]", {onclick: ctrl.showThings}, "Show things"),
		
		ctrl.things ? m("ul", [
			ctrl.things().map(function(thing) {
				return m("li", thing.name)
			})
		]) : ""
	]
}

m.module(document.body, {controller: MyController, view: myView})
```

The code above starts by showing only a button, and when that button is clicked, a list of things shows up.

---

First, let's create a template for our loading icon:

```javascript
var loaderView = function() {
	return m("img.loader[src=loading.gif]", {style: {display: "none"}})
}
```

We can now easily add this icon wherever we want in our main template:

```javascript
var MyController = function() {
	this.showThings = function() {
		this.things = m.request({method: "GET", url: "/things"})
	}.bind(this)
}
var myView = function(ctrl) {
	return [
		m("button[type=button]", {onclick: ctrl.showThings}, "Show things"),
		
		loaderView(), //add icon here
		
		ctrl.things ? m("ul", [
			ctrl.things().map(function(thing) {
				return m("li", thing.name)
			})
		]) : ""
	]
}

m.module(document.body, {controller: MyController, view: myView})
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
	//query the DOM for loaders
	var loaders = document.querySelectorAll(".loader")
	
	//show icons
	for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "block"
	
	return m.request(args).then(function(value) {
		//hide icons
		for (var i = 0, loader; loader = loaders[i]; i++) loader.style.display = "none"
		
		return value
	})
}
```

Let's replace our `m.request` call with `requestWithFeedback`:

```javascript
var MyController = function() {
	this.showThings = function() {
		this.things = requestWithFeedback({method: "GET", url: "/things"})
	}.bind(this)
}
var myView = function(ctrl) {
	return [
		m("button[type=button]", {onclick: ctrl.showThings}, "Show things"),
		
		loaderView(), //add icon here
		
		ctrl.things ? m("ul", [
			ctrl.things().map(function(thing) {
				return m("li", thing.name)
			})
		]) : ""
	]
}

m.module(document.body, {controller: MyController, view: myView})
```

Here's what's happening: the initial page load draws only the button and a hidden loading icon because `ctrl.things` is undefined at that point. When we press the button, we use DOM manipulation to show the loading icon, and fire an AJAX request to fetch our data. Once the AJAX request completes, we use DOM manipulation again to hide the loading icon, and Mithril redraws the rest of the template to display the list of things.

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
		requestWithFeedback.cache[key] = m.request(args).then(expire, function(error) {
			expire(error)
			throw error
		})
	}
	return requestWithFeedback.cache[key]
}
requestWithFeedback.cache = {}
```

There are various other ways that you can customize a loader icon: you could have it be a translucent overlay that covers the page, or you could animate it. I'll leave the stylistic aspect as an exercise to the reader.

Just remember that loader icons are simply indicators to show that an application is doing something expensive, and not a "free out-of-jail card". You should, of course, still make an effort to architecture your application in such a way that doesn't require multiple requests per user action (especially if one request depends on the results of another), and avoid doing silly things like reading entire SQL tables into server memory and filtering the dataset with application code (as opposed to, you know, using the proper SQL statements to pull the correct data in the first place).

---

**Update:** Thanks to Lawrence Dol for pointing out some problems with the original article. I've updated it to correct these issues.

By default, Mithril waits for requests to complete before attempting to render, so if we defined our loading icon within a Mithril template, it never displays a loading icon for the initial page load. In order to show an icon before Mithril renders in the first place, a simple solution is to simply put the icon in the HTML root element that we use for `m.module` or `m.route`:

```markup
<html>
	<head></head>
	<body>
		<!--the loading icon-->
		<img src="loading.gif" />
		
		<script>
		//define the app
		var app = ...
		
		//initialize the app
		m.module(document.body, app)
		</script>
	</body>
</html>
```

An alternative is to use the `background` option when calling m.request to indicate that we want to redraw the rest of the template without waiting for the asynchronous data, and then manually triggering a redraw when the AJAX request completes:

```javascript
var MyController = function() {
	this.things = m.request({method: "GET", url: "/things", background: true})
		.then(function() {
			m.redraw()
		})
}
var myView = function(ctrl) {
	return [
		loaderView(),
		m("ul", [
			ctrl.things().map(function(thing) {
				return m("li", thing.name)
			})
		])
	]
}

m.module(document.body, {controller: MyController, view: myView})
```

The second option lets us draw more than just a loading icon during page load, but you should take care to ensure that your template doesn't try to access data that might not be there yet on the initial draw.