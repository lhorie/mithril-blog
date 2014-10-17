## Mapping view models

Fat javascript-driven applications usually have two types of data: domain data and application data.

Domain data is what users care about: user records, articles, projects, whatever. By definition, domain data is what makes an application useful; most user actions in an application revolve around reading and writing domain data.

Application data, on the other hand, is data about the state of the application itself: is this modal popup open, what filter is currently applied to this grid, should a loading icon be showing up right now, what was the original value of this input if I hit the cancel button to reset it?

Newer frameworks have started adopting the idea of view-models to deal with application state. [I talked about it previously here](what-is-a-view-model.html). The summary is that UI state is almost never a concern for the model entities that deal with domain data, and we often need to keep them separated somehow.

One challenge that people face when building complex apps is that it's inherently difficult to separate application state concerns from domain data concerns when working with lists of things. Lists can be sorted, filtered, sliced and spliced, and keeping a second list in sync is not trivial.

Today we're going to look at a pattern that I recently started using at work to help fix this problem.

Let's imagine that we're working with some user records:

```javascript
var users = [
	{id: 1, name: "John", email: "john@example.com"},
	{id: 2, name: "Mary", email: "mary@example.com"},
	{id: 3, name: "Bob", email: "bob@example.com"}
]
```

And let's say we have an interface that displays all user names and there's a "more" button beside each user that displays the rest of the user information.

```javascript
var app = {}
app.controller = function() {
	this.users = users
}
app.view = function(ctrl) {
	return m("ul", [
		ctrl.users.map(function(user) {
			return m("li", [
				m("a[href='javascript:;']", {
					onclick: function() {user.showEmail = !user.showEmail}
				}, user.name),
				user.showEmail ? m("div", user.email) : ""
			])
		})
	])
}
m.module(document.body, app)
```

In the snippet above, we loop through the list of users and display a list, which contains a name in a link. Clicking the link toggles the `div` with the email.

It's tempting to just put the show/hide flag in the user record itself as I did above, but imagine that a month down the road, your boss comes back and asks you to change the `div` into a form that lets users edit a user record. Now all of a sudden, there's a whole lot of additional application state that you weren't expecting: you need to put the temporary input value somewhere in case a user cancels out, you need a flag to indicate whether a loading icon should appear while the item is saving, you need to display an error if something goes wrong, etc. So now our user records store all sorts of not-really-user-related properties, and this was just one "small" change in the app! It's scary to realize how one little harmless hack can quickly snowball into a huge mess of mixed concerns.

Some might be wondering why we aren't just using the DOM to store this application state, as one would do with jQuery. The problem with having UI state live implicitly in the DOM is that you don't have a single source of canonical data, which makes it difficult to understand where a change begins and where it ends as it ripples through the system. Imagine the same scenario as above, in a jQuery codebase. You could start storing all the UI state I described directly in the DOM, but what if the data comes from the server, and your boss asks it to be filterable via a search input? How complicated does your code need to be now in order to re-render the rest of the grid while keeping the state of an active form intact? Ultimately what ends up happening is an exponential growth of custom code to handle every possible corner case that arises from the growing number of interactions between different use cases, all of which needs to be revised yet again when the next feature gets introduced. This simply doesn't scale.

Let's take a step back and think about the data structures.

```javascript
var users = [
	{id: 1, name: "John", email: "john@example.com"},
	{id: 2, name: "Mary", email: "mary@example.com"},
	{id: 3, name: "Bob", email: "bob@example.com"}
]
```

As we saw earlier, our data is a relatively simple data structure, but let's break this down further. There's a list, and inside of the list, there's a bunch of objects. Each object has a bunch of properties, one of which (`id`) is a *unique identifier* value.

We want to map a varying number of UI-related properties to each record in this list, without polluting the records themselves.

And as it turns out, javascript has a data structure that is perfect for this task: objects. With it, we can build a *lazy map*, that is, a map that populates each key-value pair with a defined child structure on demand.

```javascript
var viewModelMap = function(signature) {
	var map = {}
	return function(key) {
		if (!map[key]) {
			map[key] = {}
			for (var prop in signature) map[key][prop] = m.prop(signature[prop]())
		}
		return map[key]
	}
}
```

The helper above is a factory that takes as input a `signature` object with getter-setter properties attached to it, and returns a function. The returned function takes as an input a key, and returns a clone of the `signature` object, initialized with the values from the signature. Here's an example of how to use it:

```javascript
var formVMs = viewModelMap({
	isEditing: m.prop(false),
	tempValue: m.prop(""),
	error: m.prop("")
})

var vm1 = formVMs(1)
vm1.isEditing() // false
vm1.isEditing(true) // true

var vm2 = formVMs(2)
v1 === v2 // false

var vm1again = formVMs(1)
vm1 === vm1again // true
vm1again.isEditing() //true
```

Above, `formVMs` returns clones of the signature object corresponding to the number that we pass in. Calling it more than once for a single key returns the same object, with its state preserved.

We can now plug this back into our example from earlier:

```javascript
var app = {}
app.controller = function() {
	this.users = users
	
	this.usersVM = viewModelMap({
		isEditing: m.prop(false),
		tempValue: m.prop(""),
		error: m.prop("")
	})
}
app.view = function(ctrl) {
	return m("ul", [
		ctrl.users.map(function(user) {
			var vm = ctrl.usersVM(user.id)
			return m("li", [
				m("a[href='javascript:;']", {
					onclick: function() {vm.isEditing(!vm.isEditing())} //toggle div
				}, user.name),
				vm.isEditing() ? m("div", user.email) : ""
			])
		})
	])
}
m.module(document.body, app)
```

Notice that we copied the view model map to our controller, and that we replaced `user.showEmail` with `vm.isEditing`. Each view model maps to a user id.

Now the user records are kept clean of UI state, and the view model is easily extensible (just add more properties to the signature).

---

### Conclusion

Linus Torvalds once said that mediocre programmers think in terms of code, but great programmers think in terms of data structures and how they interact with one another. In this article, we applied his lesson to our problem, using common techniques that should be familiar to most programmers: using functions as factories, using objects as maps, lazy initialization, etc.

Thinking in terms of data structures is a good piece of advice. For a lot of programmers, it's easy to eagerly jump into coding as soon as a problem presents itself, but taking that extra time upfront to design a good structure for our data can pay off enormously. Designing our code around the structure of data means that keeping data clean and organized is a top priority. This makes it easier to inspect it during maintenance, and paradoxically, tends to produce more discoverable code than when we spend all our energy crafting clever code paths (at least in my own experience).

