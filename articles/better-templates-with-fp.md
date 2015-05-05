## Better Templates w/ FP

*April 20, 2014*

Every once in a while, when I start writing a new application, I create a page layout with a header and some navigation, and then some time later I need to have more than one page. Then I realize that the layout is hard coded and parts of it needs to be refactored out of my original page in order to avoid the need to copy and paste the global elements in every page. Sounds familiar?

[Mithril](http://lhorie.github.io/mithril) lets us take advantage of functional programming to create decoupled, composable templates - in other words, templates that you can mix and match.

For example, let's suppose we are building a site that has a menu and a body area:

```javascript
var layout = function() {
	return m(".layout", [
		m("header", [
			"nav here"
		]),
		m("main", [
			"body here"
		])
	]);
};

m.module(document, {controller: function() {}, view: layout});
```

In case that code is not clear enough, here's what the output HTML looks like:

```markup
<div class="layout">
	<header>
		nav here
	</header>
	<main>
		body here
	</main>
</div>
```

What we want to do is be able to dynamically define what `nav here` and `body here` are. In other words, we want a layout that looks like this:

```javascript
var layout = function(nav, body) {
	return m(".layout", [
		m("header", nav),
		m("main", body)
	]);
};
```

And sub-templates that look like this:

```javascript
var nav = function() {
	return [
		"nav here"
	];
};
var body = function() {
	return [
		"body here"
	];
};
```

By organizing our code like this, the sub-templates don't need to be cluttered with explicit layout references, and the layout can flexibly render different navs and bodies as our app grows in complexity. In other words, organizing our code this way gives us nice and modular templates.

So all we need now is a glue to put together these nice modular pieces of code together.

Since functions are first class citizens in Javascript, we can create a **higher order function** - a function that works with functions - to do that for us:

```javascript
var mixinLayout = function(layout, nav, body) {
	return function() {
		return layout(nav(), body());
	};
};
```

All this function does is take templates as arguments (remember, Mithril templates are just functions), and then return a function that calls them (side note: the returned function is also a template).

And that's it! Now we can create as many layouts, navs and bodies as we want and we can put them together however we want to create our views:

```javascript
//here's a module
var myModule = {};
myModule.controller = function() { /*...*/ };
myModule.view = mixinLayout(layout, nav, body);

//here's another module
var anotherModule = {};
anotherModule.controller = function() { /*...*/ };
anotherModule.view = mixinLayout(layout, anotherNav, anotherBody);

//hook up our modules to routes
m.route(document, "/foo", {
	"/foo": myModule,
	"/bar": anotherModule
});
```

---

### Advanced usage

This technique becomes very powerful when using [components](http://lhorie.github.io/mithril/components.html) to organize code. For example, you might have a widget that lives in its own page (e.g. a login widget), but this widget may also appear in a modal dialog somewhere else in the site.

By writing the login widget's template as a self-contained function as we saw above, we can attach a layout for the standalone login page, and we can just include the naked template as a component in our modal dialog. No copy-pasta required.

```javascript
//the widget template
var loginWidget = function() {
	return [
		m("input[placeholder='Username']"),
		m("input[placeholder='Password'][type='password']"),
		m("button")
	]
}

//standalone page
var loginPage = {}
loginPage.controller = function() { /*...*/ }
loginPage.view = mixinLayout(layout, nav, loginWidget)

//as a component in another part of the app
var anotherPlace = {}
anotherPlace.controller = function() { /*...*/ }
anotherPlace.view = function() {
	return [
		"stuff before",
		loginWidget(),
		"stuff after"
	]
}
```

It's worth noting that even though I call this an example of "advanced usage" and throw around fancy words like "components", the code itself is actually surprisingly straightforward.

Hopefully this article sheds some light into ways to keep templates DRY, and how Mithril's simplicity can help achieve that goal.