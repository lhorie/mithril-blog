## Organizing components

One requirement that I commonly run into is the ability to filter a list of things. Not just filtering an array, but filtering in the sense of a user specifying some criteria, and a list of things on screen updating to become more relevant as a result. Think Google's search result page.

In this article we'll look at one way of implementing a client-side filter.

First we need to decide roughly where we can separate concerns: usually the most logical way of breaking up the view is to have one template for the list of things and another for the filters, plus a top level component to glue everything together. But once we've decided that, there are many different ways in which we could actually implement our components, and some ways lend themselves to be more tightly coupled than others. Ideally, we'd like the sub-components to be as agnostic about the rest of the world as possible. Conversely, we want the top level component to specify what sub-components exist and how they interact with each other.

One may argue that then, the top component is tightly coupled. That's true and in fact it's a necessity: there's simply no way to have decoupled components talking to each other without some mechanism that ties them together into a context. This is the purpose of the top component.

```javascript
//top level component
var things = {}

things.controller = function() {}
things.view = function(ctrl) {
	m(".row", [
		m(".col-md-2", [
			filter.view(ctrl.filter)
		]),
		m(".col-md-10", [
			list.view(ctrl.list)
		])
	])
}

//filter
var filter = {}
filter.view = function() {}

//list
var list = {}
list.view = function() {}
```

Notice that the structural grid markup is in the top level component (I'm using Bootstrap CSS classes in this case). As you get into refactoring more repetitive templates, you might be tempted to start putting this type of code in the subtemplates, but from a maintenance perspective, it's a lot easier to reason about the structure of the grid when the entire structure is in one place, rather than scattered around different functions. In addition, having this markup at the top level template means that each of our subtemplates is clean (and therefore easier to reuse)

Also, note that we're using `ctrl.filter` and `ctrl.list` in the view even though we haven't defined them yet. We'll get to these later on.

---

### The list

The list will need to be populated with data. So let's create a model to handle that:

```javascript
var Thing = {}
Thing.list = function() {
	return m.request({method: "GET", url: "/api/things"})
}
```

Next, we use a controller to expose this data to a view.

```
list.controller = function(options) {
	this.items = Thing.list()
	this.visible = options.visible
}
```

The `Thing.list` method ajaxes some JSON data and returns a promise that asynchronously resolves to the response data. So in the view, `ctrl.items` will hold the data that came back from the web service.

The `visible` property will be used to determine which of the items are visible on screen. This function will be passed to `Array.prototype.filter`, so it'll take an item as the argument and expect a boolean as the return value.

Next, let's create the template to display our list:

```javascript
list.view = function(ctrl) {
	return m("table", [
		ctrl.items().filter(ctrl.visible).map(function(item) {
			return m("tr", [
				m("td", item.id),
				m("td", item.name)
			])
		})
	])
}
```

The code above creates a table and iterates over the array in `items`. It filters out items based on the `ctrl.visible` function and displays table rows for the items that are visible.

---

### The filter

Let's create a search input.

```javascript
filter.controller = function(options) {
	this.searchTerm = m.prop("")
}
```

Here we created a controller that has a member called `searchTerm`. We'll be using this getter-setter to store the value of the search input.

Next, let's create the template for the filter.

```javascript
filter.view = function(ctrl) {
	return m("input", {oninput: m.withAttr("value", ctrl.searchTerm)})
}
```

The code above simply defines a text input that populates `ctrl.searchTerm` as the user types. By using `m.withAttr`, we extract the `value` attribute of the input and pass it as the argument to `ctrl.searchTerm` when an `oninput` event is triggered.

---

### Putting things together

Let's go back to our top level controller. Here we need to instantiate each of our sub-module controllers. 

```javascript
things.controller = function() {
	var ctrl = this
	
	ctrl.list = new list.controller({
		visible: function(item) {
			return item.name.indexOf(ctrl.filter.searchTerm()) > -1
		}
	})
	
	ctrl.filter = new filter.controller()
}
```

As you may recall, we needed to define `ctrl.filter` and `ctrl.list`, because we were using them in the top level template as the controllers for the sub-views.

Another thing to remember was that the `list` controller can receive a `visible` argument. This option determines how the items in the list are filtered.

The implementation of `visible` is straightforward: if the item name contains the search term, then the item is visible.

We can now run our code:

```javascript
//model
var Thing = {}
Thing.list = function() {
	return m.request({method: "GET", url: "/api/things"})
}

//top level component
var things = {}

things.controller = function() {
	var ctrl = this
	
	ctrl.list = new list.controller({
		visible: function(item) {
			return item.name.indexOf(ctrl.filter.searchTerm()) > -1
		}
	})
	
	ctrl.filter = new filter.controller()
}
things.view = function(ctrl) {
	m(".row", [
		m(".col-md-2", [
			filter.view(ctrl.filter)
		]),
		m(".col-md-10", [
			list.view(ctrl.list)
		])
	])
}

//filter
var filter = {}
filter.controller = function(options) {
	this.searchTerm = m.prop("")
}
filter.view = function(ctrl) {
	return m("input", {oninput: m.withAttr("value", ctrl.searchTerm)})
}

//list
var list = {}
list.controller = function(options) {
	this.items = Thing.list()
	this.visible = options.visible
}
list.view = function(ctrl) {
	return m("table", [
		ctrl.items().filter(ctrl.visible).map(function(item) {
			return m("tr", [
				m("td", item.id),
				m("td", item.name)
			])
		})
	])
}

//run
m.module(document.body, things)
```

---

### "Pshaw, I could write that in less lines of code!"

Our example is admittedly pretty simple, and it's very much possible to merge everything into the `things` module and end up with less code than we did. Likewise, it's also possible to add more code to make modules more pure and abstract.

The point of this article, though, is primarily to show one way of breaking larger modules into smaller ones. Organizing code in the way we did allows us to reuse the sub-components: the `filter` module is only concerned with what the user types in the search input, and the `list` module can be filtered in any way we desire. The `things` module is what glues the sub-components together and specifies how they interact with each other in the context of `things`.

If you've been passing instances of parent controllers to child components, now you know how to re-organize code in a less tightly coupled way.
