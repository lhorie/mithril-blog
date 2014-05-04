## Switcheroo

Do you ever find yourself writing big `if` / `else` blocks or `switch` statements in [Mithril](http://lhorie.github.io/mithril) templates?

```javascript
var app = {}

app.view = function(ctrl) {
	return m(".container", [
		m("ul", [
			m("li", [m("a", "Tab 1")]),
			m("li", [m("a", "Tab 2")]),
			m("li", [m("a", "Tab 3")])
		]),
		(function() {
			switch (ctrl.tab) {
				case "tab1":
					return m(".tab", "tab 1 here...")
				case "tab2":
					return m(".tab", "tab 2 here...")
				case "tab3":
					return m(".tab", "tab 3 here...")
			}
		})()
	])
}
```

Let's be honest, the `switch` statement inside of the anonymous function kinda sticks out like a sore thumb, doesn't it?

One way we can improve the code is by using [components](http://lhorie.github.io/mithril/components.html). This might sound like it's gonna be a lot of refactoring and a lot of code, but it's actually pretty straightforward:

All we need to do is pull out the subtemplates for each tab into separate functions:

```javascript
//turn each tab into a separate module
app.tab1.view = function(ctrl) {
	return m(".tab", "tab 1 here...")
}

app.tab2.view = function(ctrl) {
	return m(".tab", "tab 2 here...")
}

app.tab3.view = function(ctrl) {
	return m(".tab", "tab 3 here...")
}
```

And then substitute them back into the main template:

```javascript
app.view = function(ctrl) {
	return m(".container", [
		m("ul", [
			m("li", [m("a", "Tab 1")]),
			m("li", [m("a", "Tab 2")]),
			m("li", [m("a", "Tab 3")])
		]),
		(function() {
			switch (ctrl.tab) {
				case "tab1":
					return app.tab1.view(ctrl)
				case "tab2":
					return app.tab2.view(ctrl)
				case "tab3":
					return app.tab3.view(ctrl)
			}
		})()
	])
}
```

While we're at it, it's also a good idea to split the logic from our initial module's controller into the respective tab controllers:

```javascript
app.controller = function() {
	//the initial tab
	this.tab = "tab1"
	
	//instantiate controllers for tabs
	//the logic for each tab should be in the respective controller
	this.tab1 = new app.tab1.controller(this)
	this.tab2 = new app.tab2.controller(this)
	this.tab3 = new app.tab3.controller(this)
}

app.view = function(ctrl) {
	return m(".container", [
		m("ul", [
			m("li", [m("a", "Tab 1")]),
			m("li", [m("a", "Tab 2")]),
			m("li", [m("a", "Tab 3")])
		]),
		(function() {
			//notice we're passing the respective tab controllers here
			switch (ctrl.tab) {
				case "tab1":
					return app.tab1.view(ctrl.tab1)
				case "tab2":
					return app.tab2.view(ctrl.tab2)
				case "tab3":
					return app.tab3.view(ctrl.tab2)
			}
		})()
	])
}
```

Doing this makes dependencies between the main module and each tab explicit. It also means we can then [reuse the modules for the tabs elsewhere](better-templates-with-fp.html). If in your not-so-trivial app, you find that doing this exercise is a pain, then you just experienced the problem with what are known as "god functions". God functions are hard to maintain because the lack of explicitness provided by closures makes it hard to reason about the impact of changes as they cascade down through various unrelated parts of the app. It's usually a good idea to refactor big functions early, before thing grow too big and changing things becomes too cost-prohibitive.

As a side note, I omitted the definitions of each module earlier, but what they are supposed to look like should hopefully be obvious (or at least easy to figure out). As an example, here's the skeleton of the `app.tab1` module, of which `app.tab1.view` is a part of:

```javascript
var app.tab1 = {}
app.tab1.controller = function() { /*...*/ }
app.tab1.view = function(ctrl) {
	return m(".tab", "tab 1 here...")
}
```

---

We can now refactor away our switch statement. The problem with `switch` is that it's a statements, i.e. it cannot be nested inside expressions, which is what our templates are made of. We can create a `switch`-like expression instead using a little trick from the world of Python: **dictionary switches**

```javascript
var subject = "John";

var choice = {
	"John": "lemonade",
	"Bob": "orange juice",
	"Mary": "tea",
}[subject];

//choice is "lemonade"
```

This is just a regular Javascript object, with the twist that we immediately access one of its properties to get a value that corresponds to the key we accessed.

We can use this technique to create a tiny helper function:

```javascript
//helper function
app.choose = function(key, options) {
	var option = options[key];
	return options[0](option[1]);
};
```

And we can then use this helper function to replace the `switch` statement:

```javascript
app.view = function(ctrl) {
	return m(".container", [
		m("ul", [
			m("li", [m("a", "Tab 1")]),
			m("li", [m("a", "Tab 2")]),
			m("li", [m("a", "Tab 3")])
		]),
		//here we use our helper
		app.choose(ctrl.tab, {
			"tab1": [app.tab1.view, ctrl.tab1],
			"tab2": [app.tab2.view, ctrl.tab2],
			"tab3": [app.tab3.view, ctrl.tab3]
		})
	]);
};
```

Doesn't that look cleaner? Let's break things down a little bit.

`app.choose` accepts 2 parameters: a key and a dictionary. In the code above, the dictionary switch has three options, `tab1`, `tab2` and `tab3`. We pick one of those via the square bracket notation and `ctrl.tab` (which is `tab1` on initial load, if you recall the controller code ealier).

The value that corresponds to `tab1` is `[app.tab1.view, ctrl.tab1]`. `app.choose` calls the first item in the array as a function and passes the second one as an argument. In other words, it calls `app.tab1.view(ctrl.tab1)`, thus rendering the `app.tab1` component.

Phew!

A neat thing to notice is that `app.choose` is *also* a reusable tool. We can use it to toggle other tab groups, or for that matter, page menus, accordions, or any switchable widget. Not bad for a 2-liner helper function, huh?

---

### Last thoughts

Before we wrap up, I just wanted to mention one last thing for those who might be having trouble keeping templates declarative. These are probably a little more well known tricks to savvier Javascript developers, but I've had quite a few people use statement-based idioms when asking me questions, and I think it's worthwhile being thorough.

We can get rid of other flow control statements from views with simpler syntax, in a similar way to how we replaced `switch`:

-	`if` can be replaced with the ternary operator:

	```javascript
	//instead of this
	m("div", [
		(function() {
			if (someCondition) {
				return app.widget.view(ctrl.widget);
			}
		})()
	])
	
	//we can use this
	m("div", [
		someCondition ? app.widget.view(ctrl.widget) : ""
	])
	```
	
-	loops can be replaced with `Array.prototype.map()`

	```javascript
	//instead of this
	m("div", [
		(function() {
			var items = [];
			for (var i = 0; i < someList.length; i++) {
				items.push(app.widget.view(ctrl.widget, someList[i]));
			};
			return items;
		})()
	])
	
	//we can use this
	m("div", [
		someList.map(function(item, i) {
			return app.widget.view(ctrl.widget, item);
		})
	])
	```

Remember we can also create other helper functions like `app.choose` above to express more intricate flow control, as we did w/ [`seven` in the Seinfeld app](building-a-seinfeld-app.html) a few weeks ago.

Anyways, that's all I have for today. Hopefully, this article can help making your templates cleaner.