## A spreadsheet in 60 lines of Javascript

---

Short on time? [See it in action here](examples/spreadsheet-improved.html)

---

Apps with terse code have a special place in my heart. Note that I said *terse*, not *clever*. Cleverness is a tendency to sacrifice code clarity and readability in order to push code size to be smaller (think code golfing). Being terse, on the other hand, is the practice of seeking simplicity in order to make code easier to understand. It implies looking for elegant solutions and avoiding over-engineering.

One such app that looks particularly impressive is this [spreadsheet](examples/spreadsheet.html), written in a mere 30 lines of vanilla javascript.

I decided to write a version of it using [Mithril](http://lhorie.github.io/mithril). It may seem silly to require a framework (even if it's a really small one) to do something that has been proven to be doable without one, but the purpose of this exercise is precisely to get an idea of how much boilerplate would be required in order to implement the app using the Mithril framework.

This is an important consideration. Frameworks usually require boilerplate code in order to work, and frameworks like Angular can get notoriously verbose. Verbosity can add various costs to development: extra typing required, steep learning curves, more mental baggage to carry when reading code.

```javascript
//A simple, production-quality AngularJS factory
(function() {
	function something($http) {
		//code here
	}
	
	something.$injector = ["$http"]

	angular.module("spreadsheet").factory(something)
})()
```

Mithril positions itself as a minimalist framework. Minimalism can be a slippery slope. It's easy to make a "minimalist" framework that defers all the hard work to the application developer, but the real goal of minimalism in the context of frameworks is to enable developers to simplify their own codebases *in addition* to being a simple framework. So let's see how Mithril fares.

---

### The model layer

Here's a [port of the spreadsheet code to Mithril](examples/spreadsheet-improved.html).

The `data` variable is the in-memory data store. It reads from `localStorage` on page load and it's used throughout the code to store the current state of the spreadsheet data. It's a map of values, whose keys are expect to be named after their cells (e.g. `data["a1"]`, `data["b3"]`, etc)

```javascript
var data = JSON.parse(localStorage["spreadsheet"] || "{}")
```

The `update` function computes an expression if it's a string that starts with `"="`. Then it saves the computed value to both in the in-memory map and `localStorage`. Here, again, cells are named by combining the letters for the x axis and the numbers from the y axis (e.g. `"a1"`)

```javascript
function update(cell, value) {
	if (value != null && value[0] == "=") {
		try { with (data) data[cell] = eval(value.substring(1)) } catch (e) {}
	}
	else data[cell] = isNaN(+value) ? value : +value
	localStorage["spreadsheet"] = JSON.stringify(data)
}
```

### The view layer

The `grid` function creates a table and accepts an arbitrary Mithril template as an argument, which is cloned for every cell in the table.

```javascript
function grid(withCell) {
	for (var rows = [], i = 0; i < 27; i++) {
		for (var cols = [], j = 0; j < 17; j++) {
			var letter = String.fromCharCode("a".charCodeAt(0) + j - 1)
			cols.push(m("td", i && j ? withCell(letter + i) : i || letter))
		}
		rows.push(m("tr", cols))
	}
	return m("table", m("tbody", rows))
}
```

The `view` function is the main template. It creates a grid of text inputs, each of which has bindings to synchronize their values to a slot in the `data` map.

The `cellName` argument is the name of the corresponding cell. The name of the very first cell is "a1", the one beside that is "a2", and so on.

```javascript
function view() {
	return grid(function(cellName) {
		return m("input", {
			onchange: m.withAttr("value", update.bind(this, cellName)),
			value: data[cellName] || ""
		})
	})
}
```

Finally, the last line tells Mithril to run the application:

```javascript
m.module(document.body, {controller: function() {}, view: view})
```

You may have noticed the empty controller. There's only a single writing method in the model (`update`), and we're calling it directly from the view to cut down on boilerplate.

As you can see, the code isn't that complicated: there's a map of values whose keys are the names of the cells. Whenever an input changes, its respective value is computed (if it's an `eval`able expression), and then saved to its respective slot in the `data` map (and also to `localStorage`). Then Mithril redraws and puts the UI back in sync with the data.

And this port only takes 28 lines of code, just like the original. Not bad.

---

### Extending the application

We saw that porting the vanilla app to Mithril yields very little boilerplate, while keeping code quite readable. But the real test for terseness is whether we can build more functionality on top of it: *clever* code is full of obscurities and it's hard to understand and modify, but *elegant* code should be easy to refactor.

Conveniently, we can put our code to the test, because this spreadsheet app can use some improvements. As you might already know, the whole point of a spreadsheet is that they are supposed to be *reactive*. If the value of `a3` is `"=a1+a2"`, then changing the value of `a1` should also change `a3`.

Currently our app simply overwrites the expression so once it's computed, we lose its formula.

Here's a [rewrite that fixes that](http://jsfiddle.net/dnv352kn/).

The first major change is that our `update` function is now broken out into three parts: 

- the `update` function takes care of saving to the in-memory data store and to localStorage as before (but it no longer performs the evaluation of expressions)
- the `compute` function takes care of the expression evaluation logic
- and finally, the `computable` function is a **value object factory**. If the input to this function is a number or a string, it simply returns that value, but if the input is an `eval`able expression (i.e. a string beginning w/ `=` and followed by a javascript expression), it returns a String object with a custom `valueOf` method that computes its `eval`able expression when called.

```
function computable(value) {
	var output = new String(value)
	output.valueOf = compute.bind(this, value)
	return isNaN(+value) ? output : +value
}
function compute(value) {
	if (value != null && value[0] == "=") {
		try { with (data) return eval(value.substring(1)) } catch (e) {}
	}
	else return value
}
function update(cell, value) {
	data[cell] = computable(value)
	localStorage["spreadsheet"] = JSON.stringify(data)
}
```

Breaking out `compute` from `update` is a fairly standard type of refactorization: we're simply decoupling code for better separation of concerns and better reusability.

The creation of the `computable` factory is the key refactorization: a computable enables us to store expressions that can evaluate their values on demand. This function is used by the `update` function to store computable values in our in-memory `data` store, and it's also used at the very beginning of the script to turn the deserialized `localStorage` data into computable value objects.

```javascript
var data = JSON.parse(localStorage["spreadsheet"] || "{}")
for (var cell in data) data[cell] = computable(data[cell])
```

A computable value object is an immutable object that behaves mostly like a javascript primitive number or string, with one exception: when we attempt to use a computable entity in a mathematical expression, it implicitly calls the custom `valueOf` method and uses the evaluated expression instead of using the string value. This allows expressions like `a1+a2` to perform mathematical computations seamlessly regardless of whether `a1` and `a2` are numbers or computables. And since computables can evaluate to expressions that reference other computables, they can recursively cascade a data change through a complex web of computable expressions.

Here are some tests to demonstrate the expected behavior of the computable value object:

```javascript
computable(1) == 1 // true
computable("hello") == "hello" // true
computable("=1+1").toString() == "=1+1" // true
computable("=1+1").valueOf() == 2 // true

data.a1 = 1
computable("=a1+2") + 3 == 6 //true

data.a1 = 1
data.a2 = computable("=a1+2")
computable("=a2+3") + 4 == 10 //true
```

In the last two tests you can see how tightly integrated to the language `valueOf` is. The `toString` and `valueOf` methods are implicitly called by Javascript whenever type casting is implied. Computable expressions take advantage of this language feature to implement reactivity.

---

The second major change is that now there's a formula input at the top. This UI addition lets us see and edit the un-evaluated expression for any given cell.

You can see how the bindings for this input work by looking at the `view` function:

```javascript
function view() {
	return [
		m("input.formula", {
			onchange: m.withAttr("value", update.bind(this, cell())),
			value: data[cell()] || ""
		}),
		grid(function(cellName) {
			var value = compute(data[cellName]) || ""
			return m("input", {
				onkeydown: move,
				onfocus: cell.bind(this, cellName),
				onchange: m.withAttr("value", update.bind(this, cellName)),
				value: value,
				style: {textAlign: isNaN(value) || value === "" ? "left" : "right"}
			})
		})
	]
}
```

The `cell` variable is simply a view-model getter-setter that holds the name of a cell.

The `"input.formula"` element has a binding that references the `cell` getter-setter: when this input is changed, we update the data for the cell referenced by `cell()`. The value for this input is simply the string value of the `data` slot referenced by `cell()`.

In addition, each input in the grid now has a `onfocus` handler that sets the value of `cell` to their respective cell names. In short, focusing on a cell displays the uncomputed value for that cell.

---

Finally, one handy UI improvement was added: the app is now keyboard-aware. Pressing the arrows on the keyboard now moves focus around the grid. This happens thanks to the `onkeypress` event handler `move`.

```javascript
function move(e) {
	var td = e.target.parentNode, tr = td.parentNode, table = tr.parentNode
	if (e.keyCode == 37) return highlight(tr.childNodes[Math.max(1, td.cellIndex - 1)].firstChild)
	else if (e.keyCode == 38) return highlight(table.childNodes[Math.max(1, tr.rowIndex - 1)].childNodes[td.cellIndex].firstChild)
	else if (e.keyCode == 39) return highlight(tr.childNodes[Math.min(tr.childNodes.length - 1, td.cellIndex + 1)].firstChild)
	else if (e.keyCode == 40) return highlight(table.childNodes[Math.min(table.childNodes.length - 1, tr.rowIndex + 1)].childNodes[td.cellIndex].firstChild)
	else m.redraw.strategy("none")
}
function highlight(cell) {
	cell.focus()
	cell.selectionEnd = cell.value.length
	return false
}
```

There's also a one-liner in `view` that takes care of text alignment of numbers vs text, but other than that, that's pretty much it. These few UI improvements add 16 lines to the code (more than half of the original size!), but I'd argue that being able to navigate a spreadsheet with the keyboard and quickly be able to tell apart text from numbers are important features to have - if you disagree, you can reduce the code size by 16 lines and still have a reactive spreadsheet :)

---

Once you understand the `computable` value object, the rest of the application is fairly straightforward: it boils down to the basic principle of data flowing from the model to the view, and then using event handlers to push changes back to the model.

We already covered in other articles some reasons as to what makes this Mithril app clean (despite it having non-trivial functionality like focus-aware reactivity), but it's worth mentioning them again: 

- Mithril's "call-me-when-you-need" approach to tooling and the well-defined flow of data makes it easy to spend time thinking about the problem domain, rather than wasting time on framework-specific concepts.
- Explicit data bindings (as opposed to cookie-cutter binding tools like `ng-model`) allow a greater degree of flexibility when connecting form elements to model data slots, which paradoxically results in less complexity.
- The ability to idiomatically have procedural code live in functions in the view layer lets us express DOM actions without a lot of boilerplate integration code
- Idiomatic Mithril code takes the concept of design patterns to heart: we implement *patterns* of code in their simplest form, rather than creating bulky classes named after patterns.

Another thing that is worth noting (especially for those who are averse to Mithril's templating syntax), is that even though this app literally fills the page with DOM elements, there's very little "markup" code. This illustrates well the fact that, in non-trivial applications, logic often dominates in terms of code volume. A lot of boilerplate in other frameworks come from shuffling logic around in order to keep HTML "clean" in a way that is reminicent of [zero sum games](http://en.wikipedia.org/wiki/Zero-sum_game) (i.e. get clarity over here at the expense of added complexity over there). We've learned long ago to forego normalization purity in databases in favor of a pragmatic middle ground, and I think this app is an example that shows that pragmatism is a good design driver in frontend as well.

