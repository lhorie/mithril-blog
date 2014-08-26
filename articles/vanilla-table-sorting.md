## Vanilla table sorting

Here's a short and sweet helper function for [Mithril](http://lhorie.github.io/mithril) if you deal with tabular data: a table sorting helper.

```javascript
function sorts(list) {
	return {
		onclick: function(e) {
			var prop = e.target.getAttribute("data-sort-by")
			if (prop) {
				var first = list[0]
				list.sort(function(a, b) {
					return a[prop] > b[prop] ? 1 : a[prop] < b[prop] ? -1 : 0
				})
				if (first === list[0]) list.reverse()
			}
		}
	}
}
```

Let's suppose we have a table with some data:

```javascript
var MyCtrl = function() {
	this.list = [{name: "John", age: 32}, {name: "Mary", age: 25}, {name: "Bob", age: 47}]
}
var myView = function(ctrl) {
	return m("table", [
		ctrl.list.map(function(person) {
			return m("tr", [
				m("td", person.name),
				m("td", person.age)
			])
		})
	])
}
```

Here's how one would use the helper to make the table sortable:

```javascript
var MyCtrl = function() {
	this.list = [{name: "John", age: 32}, {name: "Mary", age: 25}, {name: "Bob", age: 47}]
}
var myView = function(ctrl) {
	return m("table", sorts(ctrl.list), [
		m("tr", [
			m("th[data-sort-by=name]", "Name"),
			m("th[data-sort-by=age]", "Age")
		])
		ctrl.list.map(function(person) {
			return m("tr", [
				m("td", person.name),
				m("td", person.age)
			])
		})
	])
}

m.module(document.body, {controller: MyCtrl, view: myView})
```

We are able to create such a terse helper function by taking advantage of a few different features in Javascript.

We already looked at one of them before: [event propagation](asymmetrical-data-bindings.html). The helper listens for the click event on the table, and checks whether the event's original target element is has a `data-sort-by` attribute. Since events propagate up the DOM tree, clicking on a `th` will also trigger the event on the `table`, and `event.target` will point at the element where the event originated.

If this element does have a `data-sort-by` attribute, the helper function then makes use of the built-in `sort` method in the `Array` class to sort the data using a custom comparison function.

The comparison function takes two items from the array and compares them by the property defined in `data-sort-by` - as you may recall from your algorithms class in school, sorting algorithms always have a step where they need to compare two things against each other to figure out which one is bigger. Our particular comparison function takes advantage of the fact that the `<` and `>` operators in Javascript work on both strings and numbers. As a matter of fact, it also works with Dates because using comparison operators on non-primitive objects automatically calls the built-in `valueOf` method on them, which, for dates, returns their respective UNIX timestamps. Which are numbers. Which are easy to compare.

The last line simply reverses the list if it detects that the first item in the list after sorting is the same as the first item before sorting.

And that's it. No complicated libraries, only a single event handler and a few lines of plain vanilla Javascript. Enjoy!