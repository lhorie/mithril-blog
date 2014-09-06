## Extending the view language

As you may know, [Mithril](http://lhorie.github.io/mithril) is a pretty minimalist framework, which allows sugar functionality to be created by the community.

A recurring mantra in Mithril is that if something is too noisy or repetitive, you can put the verbosity in a function and call that instead. Today we'll look at a somewhat surprising extension point, but one that is extremely powerful: wrapping around the `m` method.

First let's create a basic wrapper:

```javascript
var mx = function(selector, attrs, children) {
	return m(selector, attrs, children)
}
```

As you can see, this doesn't really do anything new. The key here, though, is that it allows us to programmatically edit the attributes before creating the virtual dom element via `m`.

Let's create a simple collection of *attribute transformers*:

```javascript
var customAttrs = {
	cautions: function(callback) {
		this.onclick = function(e) {
			if (prompt("Are you sure?")) callback(e)
		}
	},
	toggles: function(flag) {
		if (!this.style) this.style = {}
		this.style.display = flag ? "block" : "none"
	}
}
```

An attribute transformer is simply a method that is meant to be called on a attribute that modifies it. In the example above, `cautions` adds an `onclick` handler that prompts the user before running a callback. `toggles` shows or hides an element based on a flag.

We can now extend `mx` to tap into our collection:

```javascript
var mx = function(selector, attrs, children) {
	for (var attrName in attrs) {
		if (customAttrs[attrName]) customAttrs[name].call(attrs, attrs[attrName]) 
	}
	return m(selector, attrs, children)
}
```

What we're doing in the code above is look for attribute names that exist in the `customAttrs` dictionary. If one does, we call that function using the `attrs` object as the `this` object.

Now we can easily bind our custom attribute transformers to a template:

```javascript
var buttonVisible = m.prop(false)
var myView = function() {
	return [
		m("a", {onclick: buttonVisible.bind(this, !buttonVisible())})
		mx("button", {toggles: buttonVisible, cautions: ctrl.selfDestruct}, "Press if evil plans are foiled")
	]
}
```

In the code above, the button becomes visible when the `buttonVisible` getter-setter is set to true, and on click, it prompts the user to confirm that they do, in fact, want to call `selfDestruct`.

---

### Handling conflicts

A clever reader might notice that this transformer suffers from one problem - it can clobber attributes. For example: 

```
mx("button", {cautions: ctrl.remove, onclick: ctrl.doSomethingElse}, "Remove")
```

In the snippet above, `cautions` assigns a function to the `onclick` attribute, which means that `ctrl.doSomethingElse` does not run when we click on the button.

Fortunately, javascript is a dynamic language, which allows us to use **monkeypatching** to easily solve this problem:

```javascript
var monkeypatch = function(f1, f2) {
	return function() {
		var output1, output2
		if (typeof f1 == "function") output1 = f1.apply(this, arguments)
		if (typeof f2 == "function") output2 = f2.apply(this, arguments)
		
		//make compatible w/ event handler `return false` behavior
		return output1 === false || output2 === false ? false : undefined
	}
}
var customAttrs = {
	cautions: function(callback) {
		this.onclick = monkeypatch(this.onclick, function(e) {
			if (prompt("Are you sure?")) callback(e)
		})
	}
}
```

This preserves an existing `onclick` if it already exists, so that if the new `onclick` gets called, both the existing `onclick` and the callback run one after the other. We can easily tweak the order of execution for event handlers by simply changing the order of the parameters, and we can even replace `monkeypatch` altogether with different helpers to achieve more advanced event handler coordination (e.g. preventing a handler from running based on the return value of another.)

---

### Conclusion

By wrapping around the `m` function, we are able to add custom functionality to templates using the same familiar syntax as regular HTML attributes.

Not only can we mix and match different units of functionality in a single DOM element, but we can also maintain control over how they interact with each other, even in the hairiest scenarios.

*And this is only the beginning.* We saw that the `mx` wrapper we saw above only passes attributes to the list of transformers. But it's perfectly possible to expand this method and make it also introspect the `selector` parameter, as well as the virtual element that is returned from the wrapped `m` call, and even the children virtual elements, so we can create flexible transformers that act differently based on various criteria.

Here's an example that makes a good exercise to the reader: bi-directional bindings. Try creating a transformer called `binds`, which can read and write to a `m.prop` getter-setter, and that can correctly attach itself to a virtual element, considering that you need to read the `value` attribute in text inputs, but you need to read the `checked` attribute for checkboxes and radio boxes, and so on.

Or try writing one that replaces an empty child list with a "there are no items" text node. Or one that changes the output of the selector `a[href]`'s into the equivalent of `[href="javascript:;"]`. There's an endless amount of niceties that you can add to improve the developer ergonomics of the system.

And we can use the same system to add non-trivial functionality. The fact that we can tap into Mithril's `config` attribute from transformers means that, in addition to being able to modify virtual elements on the fly, we can also wrap around 3rd-party library integration boilerplate while keeping the ability of managing element lifecycles. In other words, we can have complex widgets with nice syntax. *And* we can still mixin transformers. *And* we still have the ability to [introspect and edit](when-css-lets-you-down.html) components after inclusion if needed.

Before I leave you with this cool new technique, remember that with great power comes great responsibility. A wrapper's job is to hide complexity, and in this case there's two interfaces to consider: how we use the wrapper in templates and how easy it is to add transformers to the system. In addition, you also need to be aware of the cost of the wrapper's complexity itself. You are responsible for deciding how often your version of `mx` is called and how much "magic" that wrapper performs, given that the cost of the wrapper is multiplied by the number of times you call it.

Generally speaking, the cost of a wrapper - even a complex one - is surprisingly negligible. (Fun fact: Mithril's templating engine is fast even though `m()` uses regular expressions!) However, calling a carelessly slow implementation of `mx` for every element in a page that has tens of thousands of elements is bound to cause problems. If push comes to shove, there *are* ways to get around performance problems of that nature, but it's always better to put some thought in the design phase than to fix mistakes in the maintenance phase.

Anyways, I hope this article gives you some ideas on how to make your templates cleaner and your experience with Mithril templating even more pleasant.