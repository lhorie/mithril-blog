## When CSS lets you down

Componentization is a framework's ability to split the UI into pieces that are modular and reusable. So it's no wonder that many people are working hard in creating systems for providing this ability to developers: the Web Component spec, and the newest alpha releases of Knockout.js are good examples.

Speaking from my experience, I think there's one fundamental problem with the way componentization is commonly done: and it can be summarized in one word - CSS.

Component systems are great at encapsulating functionality, but the downside is that we also lose the ability to look into them and modify them - Web Component proponents often say that we can style shadow DOMs with CSS, but those with experience trying to customize the design of jQuery-UI or Ext.js widgets (and by customize I mean change their layouts to the specs of a 3rd party graphics designer, not merely change colors and trivial CSS rules) knows that certain things are extremely hard (or even downright impossible) to do. Things like vertical alignment and arbitrary ordering of elements are poorly supported by CSS, and the presence of non-editable javascript-generated inline styles, for example, further complicates matters.

Unfortunately, despite the promise of separation of content and styles that CSS was meant to solve, the reality is that some design aspects still require us to modify HTML. And the systems that encapsulate markup in order to provide modularity forget that too often.

Mithril templates, being simply pure functions that return plain javascript data structures, can be piped to **transformer functions**, which allows the developer to maintain control over their component's markup and styles with a deep level of granularity.

Here's a simple example to demonstrate. Imagine we need to display some tabular data. Our template would likely look something like this.

```javascript
//a simple template
function table(ctrl) {
	return m("table", [
		m("tr", [
			m("th", "Project"),
			m("th", "Budget"),
			m("th", "Actuals")
		]),
		m("tr", [
			ctrl.data.map(function(item) {
				return [
					m("td", item.name),
					m("td", item.budget),
					m("td", item.actuals)
				]
			})
		])
	]);
};
```

The code above is simply a table that loops through a list of data and renders a row for each item in the list. It would render something like this:

```markup
<table>
	<tr>
		<th>Project</th>
		<th>Budget</th>
		<th>Actuals</th>
	</tr>
	<tr>
		<td>Bike Ad Campaign</td>
		<td>$100,000</td>
		<td>$97,000</td>
	</tr>
	<tr>
		<td>Cart Ad Campaign</td>
		<td>$80,000</td>
		<td>$82,000</td>
	</tr>
</table>
```

If we needed to style our table with, say, Bootstrap, we'd manually add a CSS class to it. But if the table needed to be sortable or have some other not-so-trivial functionality and we chose to use a 3rd party component, we either need to search the Googles for a component that already uses Bootstrap, or spend way too much time re-styling a component's built-in style ourselves.

With a transformer function, we can programmatically inject the CSS classes that we need into our template. Mithril's `m` utility returns a *virtual element* object that looks like this:

```javascript
{tag: "div", attrs: {class: "foo"}, children: [ /* child objects */ ]}
```

Knowing that, we can create a function that takes the tree of virtual elements from our `table` function as a parameter, and transform it using plain javascript:

```javascript
//transformer function: simply add the `table` CSS classes to the table
function styleTable(table) {
	table.attrs.class = "table table-striped";
	return table;
};

//pipe our table template
styleTable(table(ctrl));
```

Then our rendered template would have bootstrap classes attached:

```markup
<table class="table table-striped">
	<tr>
		<th>Project</th>
		<th>Budget</th>
		<th>Actuals</th>
	</tr>
	<tr>
		<td>Bike Ad Campaign</td>
		<td>$100,000</td>
		<td>$97,000</td>
	</tr>
	<tr>
		<td>Cart Ad Campaign</td>
		<td>$80,000</td>
		<td>$82,000</td>
	</tr>
</table>
```

With this technique in hand, a component author no longer needs to hard-code the CSS classes of their components into their templates, and developers that use those components can roll their own transformers as well.

Transformer functions aren't limited to simply adding classes to particular elements. We can even modify the tree structure of a template, so we can do things like control the ordering of DOM elements and add helper spans to apply CSS position or overflow, when needed.

We can modify the virtual element tree structure with confidence because, unlike with jQuery code, we have the data model decoupled from the DOM tree, and no runtime DOM traversal happening, so we don't need to worry about components' internal DOM traversal code breaking after we change the DOM tree.

### Advanced transformers

A clever reader might realize that writing transformer functions for non-trivial templates can be brittle if we naively use dot notation to traverse down the virtual element tree. But because templates are just javascript data structures, we can get around this issue using techniques like **recursive pattern matching**

Javascript unfortunately doesn't have built-in syntax for compile-time pattern matching in the way that languages like Haskell do, but it's perfectly possible to do runtime pattern matching using procedural code. Here's a simple example:

```javascript
function styleTable(root) {
	if (root.tag == "table") {
		root.attrs.class = "table table-stripe";
	}
	return root;
};
```

This is the same function we used earlier, but this one can receive any template and only modifies it if the root element in the template is a table.

*Recursive* pattern matching is achieved by creating a function that recursively calls itself to drill down a template tree, and then run some arbitrary computation if a virtual element matches some criteria. The beauty of this technique is that it makes a transformer function agnostic about the structure of the template: all that matters is that an element matches some criteria in order for it to be transformed.

Here's a contrived example:

```javascript
function highlightNegatives(root, parent) {
	if (!root) return root;
	else if (root instanceof Array) {
		for (var i = 0; i < root.length; i++) {
			highlightNegatives(root[i], parent);
		}
	}
	else if (root.children) {
		highlightNegatives(root.children, root);
	}
	else if (typeof child == "string" && child.indexOf("($") === 0) {
		parent.attrs.class = "text-danger";
	}
	return root;
};

highlightNegatives(styleTable(table(ctrl)));
```

This function recursively drills down a template until it find a string that starts with a bracket and a dollar sign (i.e. a negative number, in financial notation). If it finds any, it adds the Bootstrap class `text-danger` to the parent DOM element. Given a table like the one from the example earlier, this function makes the text of negative numbers turn red.

Notice that this function works with tables with `thead`, multiple `tbody`, nested tables and just about anything else we can throw at it.

Be aware, however, that the recursive pattern matching technique we saw above isn't exactly cheap: it scans every element in a tree, so it's an O(n) operation. Fortunately, if a transformer function becomes a bottleneck, we can optimize it to run in O(1) by rewriting it as a Sweet.js macro.

### Conclusion

Transformer functions are a powerful way of achieving the elusive separation of concerns between content and presentation. With them, we can write the simplest possible HTML structures to maximize readability and reusability, and then inject styles and even extra markup to support styling, after the fact.

As the saying goes, "with great power comes great responsibility": don't abuse transformer functions to such an extent that prevents others from understanding what is happening. Transformer functions *can* be written in declarative style for a narrow number of transformation types, but as you saw above, recursive and procedural code are the most straightforward way to express data mutations. However, that type of code is typically harder to debug (especially for non-trivial transformations), so make sure you use all the tools at your disposal (comments, documentation, unit testing, etc) to make the life of your future maintainer self easier.